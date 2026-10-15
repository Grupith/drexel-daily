import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, imports = {}, globals = {}) {
  const loadedModule = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(path,'utf8'),{fileName:path,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{module:loadedModule,exports:loadedModule.exports,require:id=>{if(id in imports)return imports[id];throw Error(id);},Date,Intl,Response,console,URLSearchParams,URL,fetch:imports.fetch,...globals});
  return loadedModule.exports;
}

class AdminError extends Error { constructor(status, message) { super(message); this.status = status; } }
const content = load('lib/challenges/content.ts');
const scoring = load('lib/challenges/scoring.ts');
const choice = {type:'multiple_choice',text:'Choose',category:'Safety',isActive:true,options:['A','B','C','D'],correctAnswerIndex:1};
const estimate = {type:'estimate',text:'Estimate',category:'Company',isActive:true,correctAnswer:12.5,minGuess:0,maxGuess:100,unit:'units'};
function fixture(date='2026-10-14', status='draft', changes={}) {
  const seed = {[`challenges/${date}`]:{date,status,questionIds:['a','b','c']},'questions/a':choice,'questions/b':estimate,'questions/c':choice,...changes};
  const writes=[]; const reads=[];
  const write=(...args)=>{writes.push(args);throw Error('Unexpected write');};
  const snapshot=(path)=>({id:path.split('/').at(-1),exists:path in seed,data:()=>seed[path]});
  const db={collection(name){return {doc(id){const path=`${name}/${id}`;return {path,get:async()=>{reads.push(path);return snapshot(path);},set:write,update:write,create:write,delete:write};}};},getAll:async(...refs)=>refs.map(ref=>{reads.push(ref.path);return snapshot(ref.path);}),runTransaction:write,batch:write};
  const service=load('lib/admin/test-challenge.ts',{'server-only':{},'./auth':{AdminError},'./validation':{validChallengeDate:date=>/^\d{4}-\d{2}-\d{2}$/.test(date)},'@/lib/challenges/content':content,'@/lib/challenges/scoring':scoring});
  return {db,service,writes,reads,seed};
}
function submission(date='2026-10-14', answers=[1,12.5,0]) {return {challengeDate:date,questionIds:['a','b','c'],answers};}
test('draft and published challenges on past and upcoming dates score through shared utility without any writes',async()=>{
  for(const date of ['2025-01-06','2026-10-14','2027-01-04'])for(const status of ['draft','published']){
    const {db,service,writes,reads}=fixture(date,status);
    for(let retry=0;retry<3;retry++){
      const result=await service.scoreTestChallenge(db,date,submission(date));
      assert.equal(result.correctCount,2); assert.equal(result.pointsEarned,20);
      assert.equal(result.questions[1].correctAnswer,12.5);
      assert.equal(result.answers.join(','),'1,12.5,0');
    }
    assert.equal(writes.length,0); assert.ok(reads.every(path=>path.startsWith('challenges/')||path.startsWith('questions/')));
  }
});
test('initial gameplay payload strips both kinds of answer keys',async()=>{
  const {db,service}=fixture();
  const {questions}=await service.loadTestChallenge(db,'2026-10-14');
  assert.equal(questions.length,3);
  for(const question of questions){assert.equal('correctAnswer' in question,false);assert.equal('correctAnswerIndex' in question,false);}
});
test('incomplete, missing, duplicate, inactive and invalid questions cannot be tested',async()=>{
  for(const changes of [
    {'challenges/2026-10-14':{date:'2026-10-14',questionIds:['a','b']}},
    {'challenges/2026-10-14':{date:'2026-10-14',questionIds:['a','a','b']}},
    {'questions/b':undefined}, {'questions/b':{...estimate,isActive:false}},
    {'questions/b':{...estimate,correctAnswer:200}}, {'questions/a':{...choice,correctAnswerIndex:9}}
  ]){
    const {db,service,writes}=fixture(undefined,undefined,changes);
    await assert.rejects(service.loadTestChallenge(db,'2026-10-14'),e=>e.status===400);assert.equal(writes.length,0);
  }
});
test('invalid and forged submissions are rejected with zero writes',async()=>{
  for(const input of [null,{}, {...submission(),score:100}, {...submission(),challengeDate:'2027-01-04'}, {...submission(),questionIds:['b','a','c']},submissionshort(),submission(undefined,[4,12.5,1]),submission(undefined,[1,-1,1]),submission(undefined,[1,'12.5',1]),submission(undefined,[1,Infinity,1])]){
    const {db,service,writes}=fixture();
    await assert.rejects(service.scoreTestChallenge(db,'2026-10-14',input),e=>e.status===400);assert.equal(writes.length,0);
  }
  function submissionshort(){return {...submission(),answers:[1]};}
});
test('test endpoint authorizes before loading or scoring and returns no-store results',async()=>{
  for(const status of [401,403,200]){
    const {db,service,writes,reads}=fixture();let checks=0;
    const route=load('app/api/admin/challenges/[date]/test/route.ts',{
      '@/lib/admin/auth':{AdminError,requireAdmin:async()=>{checks++;if(status!==200)throw new AdminError(status,'Denied');return {db};},adminFailure:e=>Response.json({message:e.message},{status:e.status??500})},
      '@/lib/admin/test-challenge':service
    });
    const response=await route.POST(new Request('http://localhost/api/admin/challenges/2026-10-14/test',{method:'POST',body:JSON.stringify(submission())}),{params:Promise.resolve({date:'2026-10-14'})});
    assert.equal(response.status,status);assert.equal(checks,1);assert.equal(writes.length,0);
    assert.match(response.headers.get('cache-control'),/no-store/);
    if(status!==200)assert.equal(reads.length,0);else assert.equal((await response.json()).results.pointsEarned,20);
  }
});

test('shared gameplay keeps answers on back navigation, uses only test scoring and resets completely',async()=>{
  const React=await import('react');const states=[],refs=[],effects=[],requests=[];let cursor=0;
  const hooks={useState(initial){const i=cursor++;if(!(i in states))states[i]=initial;return [states[i],v=>{states[i]=typeof v==='function'?v(states[i]):v;}];},useRef(initial){const i=cursor++;return refs[i]??={current:initial};},useEffect(fn){effects.push(fn);}};
  const {db,service}=fixture();
  const loaded=await service.loadTestChallenge(db,'2026-10-14');
  const testChallenge={status:'available',date:loaded.date,questions:loaded.questions};
  const {DailyChallenge}=load('components/daily-challenge.tsx',{
    react:hooks,'react/jsx-runtime':await import('react/jsx-runtime'),'next/link':{default:'a'},'lucide-react':{},'@/lib/utils':{cn:()=>''},
    '@/components/ui/button':{Button:'button'},'@/components/ui/input':{Input:'input'},'@/lib/challenges/content':content,
    '@/components/challenge-results':{ChallengeResultsView:'results'},'@/auth/auth-context':{useAuth:()=>({user:{getIdToken:async()=> 'valid'}})},'@/components/play-skeleton':{PlaySkeleton:'skeleton'},
    fetch:async(url,options)=>{requests.push(url);assert.equal(url,'/api/admin/challenges/2026-10-14/test');return Response.json({status:'completed',results:await service.scoreTestChallenge(db,'2026-10-14',JSON.parse(options.body))});}
  });
  function nodes(tree){return React.isValidElement(tree)?[tree,...React.Children.toArray(tree.props.children).flatMap(nodes)]:[];}
  const render=()=>{cursor=0;return nodes(DailyChallenge({testChallenge}));};
  let tree=render();effects[0]();assert.equal(requests.length,0);
  const next=()=>tree.find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
  const choose=index=>{tree.filter(n=>n.props['aria-pressed']!==undefined)[index].props.onClick();tree=render();};
  const back=()=>{tree.find(n=>n.props.variant==='ghost').props.onClick();tree=render();};
  choose(1);next();tree=render();
  tree.find(n=>n.props.id==='estimate-answer').props.onChange({target:{value:'12.5'}});tree=render();
  back();assert.equal(tree.filter(n=>n.props['aria-pressed']!==undefined)[1].props['aria-pressed'],true);
  next();tree=render();assert.equal(tree.find(n=>n.props.id==='estimate-answer').props.value,'12.5');
  next();tree=render();choose(0);next();await new Promise(resolve=>setTimeout(resolve,0));tree=render();
  const result=tree.find(n=>n.type==='results');assert.equal(result.props.testMode,true);assert.equal(result.props.results.pointsEarned,20);
  result.props.onTestAgain();tree=render();
  assert.equal(tree.find(n=>n.props.id==='play-title').props.children[1],'Choose');
  assert.ok(tree.filter(n=>n.props['aria-pressed']!==undefined).every(n=>!n.props['aria-pressed']));
  choose(0);next();tree=render();assert.equal(tree.find(n=>n.props.id==='estimate-answer').props.value,'');
  assert.equal(requests.length,1);
});
