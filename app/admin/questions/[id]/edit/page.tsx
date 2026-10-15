import { QuestionForm } from "@/components/admin/question-form";
export default async function Page({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { return <QuestionForm id={(await params).id}/>; }
