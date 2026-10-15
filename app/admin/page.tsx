import Link from "next/link";
import { ArrowUpRight, Plus, ListChecks, CalendarDays } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
export default function Dashboard() {
  return (
    <>
      <div>
        <h1 className="text-[clamp(24px,4vw,30px)] font-bold leading-[1.3] tracking-[-0.7px]">
          Dashboard
        </h1>
        <p className="mt-3 text-sm leading-normal text-drexel-description">
          Manage Drexel Daily questions and upcoming challenges.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Create Question",
            href: "/admin/questions/new",
            icon: Plus,
            description: "Add fresh knowledge to your library.",
          },
          {
            label: "Create Challenge",
            href: "/admin/challenges/new",
            icon: Plus,
            description: "Plan a new weekday challenge.",
          },
          {
            label: "View Questions",
            href: "/admin/questions",
            icon: ListChecks,
            description: "Browse and manage the question library.",
          },
          {
            label: "View Challenges",
            href: "/admin/challenges",
            icon: CalendarDays,
            description: "Review drafts and published challenges.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full rounded-2xl border-drexel-panel-border shadow-none transition-colors hover:border-drexel-option-hover-border hover:bg-drexel-option-hover">
              <CardHeader>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-drexel-avatar text-drexel-avatar-ink">
                    <item.icon className="size-5" />
                  </span>
                  <ArrowUpRight
                    className="size-4 text-drexel-subtle"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle>{item.label}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-normal text-drexel-description">
                {item.description}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
