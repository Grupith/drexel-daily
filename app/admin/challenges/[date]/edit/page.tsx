import { ChallengeForm } from "@/components/admin/challenge-form";
export default async function Page({ params }: {
    params: Promise<{
        date: string;
    }>;
}) { return <ChallengeForm date={(await params).date}/>; }
