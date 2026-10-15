import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as zod from 'zod';
function load(path, imports = {}, globals = {}) {
  const loadedModule = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(path,'utf8'),{fileName:path,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{module:loadedModule,exports:loadedModule.exports,require:id=>{if(id in imports)return imports[id];throw Error(id);},Date,Intl,Response,console,URLSearchParams,URL,...globals});
  return loadedModule.exports;
}
const content = load('lib/challenges/content.ts');
const validation = load('lib/admin/validation.ts',{zod});
class AdminError extends Error { constructor(status,message){super(message);this.status=status;} }
const question = {text:'What does OSHA stand for?',category:'Safety',type:'multiple_choice',options:['A','B','C','D'],correctAnswerIndex:1,isActive:true};
test('admin validation preserves gameplay schema, optional fields, weekdays and date IDs',()=>{
  const data = validation.validateQuestion({...question,difficulty:'Hard',explanation:'A helpful explanation'});
  assert.equal(data.correctAnswerIndex,1); assert.equal(data.explanation,'A helpful explanation');
  assert.ok(content.toPublicQuestion('q',data));
  assert.throws(()=>validation.validateQuestion({...question,options:['A','A','C','D']}));
  assert.throws(()=>validation.validateQuestion({...question,correctAnswerIndex:4}));
  assert.throws(()=>validation.validateQuestion({...question,imageUrl:'javascript:alert(1)'}));
  for(const [date,valid] of [['2026-10-14',true],['2026-10-17',false],['2026-10-18',false],['2026-02-30',false],['invalid',false]])assert.equal(validation.validChallengeDate(date),valid);
});
test('admin authorization verifies tokens with revocation and looks up only verified UID',async()=>{
  for(const role of ['admin','employee',undefined]){
    const lookups=[]; const checks=[];
    const auth = load('lib/admin/auth.ts',{'server-only':{},'next/headers':{},'@/firebase/admin':{getAdminServices:()=>({auth:{verifyIdToken:async(...args)=>{checks.push(args);return {uid:'verified-uid',role:'admin'};}},db:{collection:name=>({doc:uid=>({get:async()=>{lookups.push([name,uid]);return {data:()=>({role})};}})})}})}});
    const request = new Request('http://localhost/api/admin/questions',{headers:{Authorization:'Bearer valid','x-role':'admin','x-uid':'forged'}});
    if(role==='admin')assert.equal((await auth.requireAdmin(request)).uid,'verified-uid'); else await assert.rejects(auth.requireAdmin(request),e=>e.status===403);
    assert.equal(checks[0][0],'valid'); assert.equal(checks[0][1],true); assert.deepEqual(lookups,[['users','verified-uid']]);
    await assert.rejects(auth.requireAdmin(new Request('http://localhost')),e=>e.status===401);
  }
  const auth = load('lib/admin/auth.ts',{'server-only':{},'next/headers':{},'@/firebase/admin':{getAdminServices:()=>({auth:{verifyIdToken:async()=>{throw Error('revoked');}}})}});
  await assert.rejects(auth.requireAdmin(new Request('http://localhost',{headers:{Authorization:'Bearer revoked'}})),e=>e.status===401);
});
function store(seed={}) {
  const documents = new Map(Object.entries(seed)); const writes=[];
  function collection(name, filters=[], maximum=Infinity) {
    return {name,filters,maximum,doc:id=>({path:`${name}/${id}`,id}),where:(field,operator,value)=>collection(name,[...filters,[field,operator,value]],maximum),limit:n=>collection(name,filters,n)};
  }
  function snapshot(ref){return {...ref,ref,exists:documents.has(ref.path),data:()=>documents.get(ref.path)};}
  const tx={get:async ref=>{
    if(ref.path)return snapshot(ref);
    const docs=[...documents].filter(([path,data])=>(ref.name==='attempts'?path.includes('/attempts/'):path.startsWith(ref.name+'/'))&&ref.filters.every(([field,operator,value])=>operator==='array-contains'?data[field]?.includes(value):data[field]===value)).slice(0,ref.maximum).map(([path])=>snapshot({path,id:path.split('/').at(-1)}));return {docs,empty:!docs.length};
  },getAll:async(...refs)=>refs.map(snapshot),set:(ref,data)=>writes.push(['set',ref.path,data]),update:(ref,data)=>writes.push(['update',ref.path,data]),delete:ref=>writes.push(['delete',ref.path])};
  const db={collection,collectionGroup:collection,runTransaction:fn=>fn(tx)};
  const data=load('lib/admin/data.ts',{'server-only':{},'firebase-admin/firestore':{FieldPath:{documentId:()=> '__name__'},FieldValue:{serverTimestamp:()=> 'timestamp',delete:()=> 'DELETE'}},'@/firebase/admin':{getAdminServices:()=>({db})},'./test-challenge':{},'./auth':{AdminError},'./validation':validation,'@/lib/challenges/content':content});
  return {data,writes};
}
test('question deletion and edits reject assigned and published content',async()=>{
  for(const status of ['draft','published']) {
    const {data,writes}=store({'questions/a':question,'challenges/2026-10-14':{date:'2026-10-14',status,questionIds:['a']}});
    await assert.rejects(data.mutateAdmin('questions','a',null),e=>e.status===409);
    if(status==='published')await assert.rejects(data.mutateAdmin('questions','a',{...question,correctAnswerIndex:2}),e=>e.status===409);
    assert.equal(writes.length,0);
  }
  const {data,writes}=store({'questions/a':question});await data.mutateAdmin('questions','a',null);assert.equal(writes[0][0],'delete');
});
test('publishing requires three valid distinct unused questions and writes shared locks',async()=>{
  const seed={'questions/a':question,'questions/b':question,'questions/c':question};
  for(const ids of [['a','b'],['a','a','c'],['a','b','missing']]) {
    const {data,writes}=store(seed);await assert.rejects(data.mutateAdmin('challenges','2026-10-14',{status:'published',questionIds:ids},true),e=>e.status===400);assert.equal(writes.length,0);
  }
  const {data,writes}=store(seed);await data.mutateAdmin('challenges','2026-10-14',{status:'published',questionIds:['c','a','b']},true);
  assert.equal(writes.filter(w=>w[0]==='update').length,3);assert.equal(writes.at(-1)[2].questionIds.join(','),'c,a,b');
  const reused=store({...seed,'challenges/2026-10-13':{status:'published',questionIds:['a']}});await assert.rejects(reused.data.mutateAdmin('challenges','2026-10-14',{status:'draft',questionIds:['a']},true),e=>e.status===409);assert.equal(reused.writes.length,0);
});
test('duplicate dates, weekends, published changes and challenges with submissions are rejected',async()=>{
  for(const [seed,id,input,create] of [
    [{'challenges/2026-10-14':{status:'draft'}},'2026-10-14',{status:'draft',questionIds:[]},true],
    [{},'2026-10-17',{status:'draft',questionIds:[]},true],
    [{'challenges/2026-10-14':{status:'published'}},'2026-10-14',null,false],
    [{'challenges/2026-10-14':{status:'draft'},'users/u/attempts/2026-10-14':{challengeDate:'2026-10-14'}},'2026-10-14',null,false]
  ]){const {data,writes}=store(seed);await assert.rejects(data.mutateAdmin('challenges',id,input,create));assert.equal(writes.length,0);}
  const {data,writes}=store();await data.mutateAdmin('challenges','2026-10-14',{status:'draft',questionIds:[]},true);assert.equal(writes.at(-1)[2].status,'draft');
});

test('question saves preserve gameplay fields and edits use merge writes', async () => {
  const created = store();
  await created.data.mutateAdmin('questions','new-question',{...question, difficulty:'Easy', explanation:'Context'},true);
  assert.equal(created.writes[0][2].type,'multiple_choice');
  assert.equal(created.writes[0][2].correctAnswerIndex,1);
  assert.ok(content.toPublicQuestion('new-question',created.writes[0][2]));
  const edited = store({'questions/a':question});
  await edited.data.mutateAdmin('questions','a',{...question,text:'Updated question'});
  assert.equal(edited.writes[0][2].text,'Updated question');
  assert.equal('createdAt' in edited.writes[0][2],false);
});
test('image upload rejects unauthorized, oversized and spoofed files before Storage writes', async () => {
  const uploads = [];
  let authorized = true;
  const route = load('app/api/admin/images/route.ts', {
    'node:crypto': {randomUUID:()=> 'random-id'},
    'firebase-admin/storage': {getStorage:()=>({bucket:()=>({file:path=>({save:async (bytes,options)=>uploads.push({path,bytes,options})})})})},
    '@/firebase/admin': {getAdminServices:()=>({auth:{app:{}}})},
    '@/lib/admin/auth': {AdminError, requireAdmin:async()=>{if(!authorized)throw new AdminError(403,'Admin required');},adminFailure:e=>Response.json({message:e.message},{status:e.status??500})}
  }, {Buffer,File,process:{env:{NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:'test-bucket'}}});
  function request(file){const body=new FormData();body.set('image',file);return new Request('http://localhost/api/admin/images',{method:'POST',body});}
  authorized=false;
  assert.equal((await route.POST(request(new File(['data'],'fake.png',{type:'image/png'})))).status,403);
  authorized=true;
  assert.equal((await route.POST(request(new File(['not an image'],'fake.png',{type:'image/png'})))).status,400);
  const tooLarge = new Request('http://localhost/api/admin/images',{method:'POST',headers:{'content-length':String(6*1024*1024)},body:'x'});
  assert.equal((await route.POST(tooLarge)).status,400);
  assert.equal(uploads.length,0);
  const response=await route.POST(request(new File([Buffer.from([137,80,78,71,13,10,26,10])],'../../image.png',{type:'image/png'})));
  assert.equal(response.status,200);assert.equal(uploads.length,1);
  assert.equal(uploads[0].path,'challenge-images/random-id/image.png');
  assert.equal(uploads[0].options.metadata.contentType,'image/png');
  assert.match((await response.json()).imageUrl,/firebasestorage.googleapis.com/);
});


test('admin validation rejects unsupported types instead of converting them to multiple choice', async () => {
  for (const type of ['multiple-choice', 'true_false', '', null, 1]) {
    assert.throws(() => validation.validateQuestion({...question, type}), /Unsupported question type/);
    const {data, writes} = store();
    await assert.rejects(data.mutateAdmin('questions', 'new', {...question, type}, true), e => e.status === 400);
    assert.equal(writes.length, 0);
  }
  const {type, ...legacyInput} = question;
  void type;
  assert.equal(validation.validateQuestion(legacyInput).type, 'multiple_choice');
  assert.equal(content.toPublicQuestion('legacy', legacyInput), null);
});

const estimate = {text:'How many?',category:'Company',type:'estimate',correctAnswer:800,unit:'employees',minGuess:0,maxGuess:5000,isActive:true};
test('estimate validation accepts finite numbers and strips hidden multiple-choice fields', () => {
  for (const answer of [0,-12,0.25,800]) {
    const data = validation.validateQuestion({...estimate,correctAnswer:answer,minGuess:-100,options:['A','B','C','D'],correctAnswerIndex:0});
    assert.equal(data.correctAnswer,answer);
    assert.equal('options' in data,false); assert.equal('correctAnswerIndex' in data,false);
  }
  for (const value of [undefined,null,'', '800',NaN,Infinity,-Infinity]) assert.throws(()=>validation.validateQuestion({...estimate,correctAnswer:value}));
  for (const changes of [{minGuess:6000},{minGuess:801},{maxGuess:799},{minGuess:null},{maxGuess:Infinity}]) assert.throws(()=>validation.validateQuestion({...estimate,...changes}));
  const data = validation.validateQuestion({...question,correctAnswer:800,unit:'employees'});
  assert.equal('correctAnswer' in data,false); assert.equal('unit' in data,false);
});
test('mixed challenges publish and estimate edits remove obsolete and cleared fields',async()=>{
  const {data,writes}=store({'questions/a':question,'questions/b':estimate,'questions/c':question});
  await data.mutateAdmin('challenges','2026-10-14',{status:'published',questionIds:['a','b','c']},true);
  assert.equal(writes.at(-1)[2].status,'published');
  const edited=store({'questions/a':question});
  await edited.data.mutateAdmin('questions','a',{...estimate,unit:undefined,minGuess:undefined,maxGuess:undefined});
  assert.equal(edited.writes[0][2].options,'DELETE');
  assert.equal(edited.writes[0][2].correctAnswerIndex,'DELETE');
  assert.equal(edited.writes[0][2].minGuess,'DELETE');
  for (const invalid of [{...estimate,correctAnswer:NaN},{...estimate,minGuess:900},{...estimate,maxGuess:-1}]) {
    const bad=store({'questions/a':question,'questions/b':invalid,'questions/c':question});
    await assert.rejects(bad.data.mutateAdmin('challenges','2026-10-14',{status:'published',questionIds:['a','b','c']},true));
    assert.equal(bad.writes.length,0);
  }
});

test('question form defaults to multiple choice, switches fields, saves numbers and loads estimates',async()=>{
  const React=await import('react');const runtime=await import('react/jsx-runtime');
  for(const editing of [false,true]){
    const states=[],effects=[];let cursor=0;const requests=[];
    const {QuestionForm}=load('components/admin/question-form.tsx',{
      react:{useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useEffect(fn){effects.push(fn);}},
      'react/jsx-runtime':runtime,'next/navigation':{useRouter:()=>({push(){}})},'next/link':{default:'a'},sonner:{toast:{success(){},error(){}}},
      '@/lib/admin/validation':validation,'@/lib/admin/client':{adminFetch:async(path,options)=>{requests.push([path,options]);return {...estimate,id:'a',usage:'Unused'};}},
      '@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'},
      '@/components/ui/select':Object.fromEntries(['Select','SelectTrigger','SelectValue','SelectContent','SelectItem'].map(k=>[k,k])),
      '@/components/ui/card':Object.fromEntries(['Card','CardHeader','CardTitle','CardContent'].map(k=>[k,k])),
      './common':{AdminLoading:'loading',ErrorNotice:'error',selectClass:''}
    });
    function nodes(tree){return React.isValidElement(tree)?[tree,...React.Children.toArray(tree.props.children).flatMap(nodes)]:[];}
    const render=()=>{cursor=0;return nodes(QuestionForm({id:editing?'a':undefined}));};
    let tree=render();
    if(editing){effects[0]();await new Promise(resolve=>setTimeout(resolve,0));tree=render();assert.equal(tree.find(n=>n.type==='Select').props.value,'estimate');assert.equal(tree.filter(n=>n.props.type==='number')[0].props.value,'800');}
    else{
      assert.equal(tree.find(n=>n.type==='Select').props.value,'multiple_choice');assert.equal(tree.filter(n=>n.props.type==='radio').length,4);
      tree.find(n=>n.type==='Select').props.onValueChange('estimate');tree=render();
      assert.equal(tree.filter(n=>n.props.type==='radio').length,0);assert.equal(tree.filter(n=>n.props.type==='number').length,3);
      tree.find(n=>n.type==='Select').props.onValueChange('multiple_choice');tree=render();assert.equal(tree.filter(n=>n.props.type==='radio').length,4);
      tree.find(n=>n.type==='Select').props.onValueChange('estimate');tree=render();
      tree.find(n=>n.type==='textarea'&&n.props.required).props.onChange({target:{value:'How many?'}});tree=render();
      tree.find(n=>n.type==='input'&&n.props.maxLength===100&&n.props.required).props.onChange({target:{value:'Company'}});tree=render();
      tree.filter(n=>n.props.type==='number')[0].props.onChange({target:{value:'0'}});tree=render();
    }
    await tree.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
    const saved=JSON.parse(requests.at(-1)[1].body);assert.equal(saved.type,'estimate');assert.equal(saved.correctAnswer,editing?800:0);assert.equal('options' in saved,false);assert.equal('correctAnswerIndex' in saved,false);
  }
});
