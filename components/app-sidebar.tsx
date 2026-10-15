"use client";
import { Users } from "lucide-react";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { adminTheme } from "@/components/admin/theme";
import { LayoutDashboard, ListChecks, CalendarDays } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
const links = [{ title: "Players", href: "/admin/players", icon: Users }, { title: "Overview", href: "/admin", icon: LayoutDashboard }, { title: "Questions", href: "/admin/questions", icon: ListChecks }, { title: "Challenges", href: "/admin/challenges", icon: CalendarDays }];
export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const path = usePathname();
    return <Sidebar variant="floating" collapsible="icon" {...props}><SidebarHeader style={adminTheme} className="bg-drexel-panel p-4 font-drexel text-drexel-ink group-data-[collapsible=icon]:p-2"><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" render={<Link href="/admin"/>}><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><span className="text-sm font-bold">D</span></div><div className="flex flex-col leading-tight"><span className="flex items-center gap-2"><Image src="/drexel-logo-blue.svg" alt="Drexel" width={384} height={127} className="h-auto w-20 dark:hidden" /><Image src="/drexel-logo-white.svg" alt="Drexel" width={384} height={127} className="hidden h-auto w-20 dark:block" /><span className="text-lg font-semibold tracking-tight">Daily</span></span><span className="text-xs text-muted-foreground">Administration</span></div></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader><SidebarContent style={adminTheme} className="bg-drexel-panel font-drexel text-drexel-ink"><SidebarGroup><SidebarMenu>{links.map(item => <SidebarMenuItem key={item.href}><SidebarMenuButton isActive={item.href === "/admin" ? path === item.href : path.startsWith(item.href)} className="min-h-11 rounded-lg font-medium data-active:bg-drexel-selected data-active:text-drexel-selected-ink" tooltip={{ children: item.title, style: adminTheme, className: "font-drexel" }} render={<Link href={item.href}/>}><item.icon /><span>{item.title}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup></SidebarContent></Sidebar>;
}
