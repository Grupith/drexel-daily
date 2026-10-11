import type { Metadata } from "next";
import { ProfileDetails } from "@/components/profile-details";

export const metadata: Metadata = {
  title: "Your profile | Drexel Daily",
};

export default function ProfilePage() {
  return (
    <div className="daily-page landing-page profile-page">
      <main className="profile-main">
        <ProfileDetails />
      </main>
    </div>
  );
}
