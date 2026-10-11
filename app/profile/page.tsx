import type { Metadata } from "next";
import { ProfileDetails } from "@/components/profile-details";

export const metadata: Metadata = {
  title: "Your profile | Drexel Daily",
};

export default function ProfilePage() {
  return (
    <div className="min-h-svh flex flex-col text-drexel-ink font-drexel bg-drexel-canvas">
      <main className="flex-1 grid justify-items-center pt-10 px-6 pb-14 [@media(max-width:600px)]:pt-6 [@media(max-width:600px)]:pb-10">
        <ProfileDetails />
      </main>
    </div>
  );
}
