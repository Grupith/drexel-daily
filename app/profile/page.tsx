import type { Metadata } from "next";
import { DailyHeader } from "@/components/daily-header";
import { ProfileDetails } from "@/components/profile-details";

export const metadata: Metadata = {
  title: "Your profile | Drexel Daily",
};

export default function ProfilePage() {
  return (
    <div className="daily-page">
      <DailyHeader />
      <main className="daily-main">
        <ProfileDetails />
      </main>
    </div>
  );
}
