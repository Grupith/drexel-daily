"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { adminTheme } from "./theme";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const section = usePathname().split("/")[2];

  return (
    <div style={adminTheme} className="min-h-svh bg-drexel-canvas font-drexel text-drexel-ink leading-normal">
      <SidebarProvider style={{ "--sidebar-width": "19rem" } as React.CSSProperties} className="bg-drexel-canvas">
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-transparent">
          <header className="flex min-h-18 shrink-0 items-center gap-2 border-b border-drexel-header-border bg-drexel-header px-4 sm:gap-3 md:px-8">
            <SidebarTrigger className="-ml-1 text-drexel-subtle" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <Breadcrumb>
              <BreadcrumbList className="text-[13px]">
                <BreadcrumbItem><BreadcrumbLink render={<Link href="/admin" />}>Admin</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>{section ? section[0].toUpperCase() + section.slice(1) : "Overview"}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <Link href="/" className="text-[13px] text-drexel-subtle underline-offset-4 hover:text-drexel-brand hover:underline focus-visible:outline-2 focus-visible:outline-drexel-focus">Back to home</Link>
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-7 px-5 py-8 md:px-8 md:py-10 **:data-[slot=button]:min-h-10 **:data-[slot=button]:rounded-full **:data-[slot=button]:px-4 **:data-[slot=input]:h-10 **:data-[slot=card]:shadow-none **:data-[slot=card-title]:font-[650] **:data-[slot=card-title]:leading-normal">
            {children}
          </main>
        </SidebarInset>
        <Toaster richColors theme={resolvedTheme === "dark" ? "dark" : "light"} style={{ ...adminTheme, fontFamily: "var(--font-geist-sans), Arial, sans-serif" }} />
      </SidebarProvider>
    </div>
  );
}
