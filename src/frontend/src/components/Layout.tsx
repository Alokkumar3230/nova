import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useLocation } from "@tanstack/react-router";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";
import type { ReactNode } from "react";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
] as const;

function Wordmark() {
  return (
    <Link
      to="/dashboard"
      data-ocid="wordmark"
      className="flex items-center gap-2 font-display text-lg font-bold tracking-tight"
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </span>
      <span className="text-gradient">NOVA</span>
    </Link>
  );
}

function UserMenu() {
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";
  const short =
    principal.length > 10
      ? `${principal.slice(0, 6)}…${principal.slice(-4)}`
      : principal;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-ocid="user_menu"
          aria-label="Open user menu"
          className="flex items-center gap-2 rounded-full p-1 transition-smooth hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar name="NOVA User" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span className="font-mono text-xs">{short}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          data-ocid="logout_button"
          variant="destructive"
          onSelect={() => clear()}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Wordmark />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        data-ocid={`nav_${item.label.toLowerCase()}`}
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="px-2 py-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Plan · Collaborate · Deliver
            </p>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4 shadow-subtle">
          <div className="flex items-center gap-2">
            <SidebarTrigger data-ocid="sidebar_trigger" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              NOVA Workspace
            </span>
          </div>
          <UserMenu />
        </header>
        <main
          className={cn(
            "flex-1 bg-background p-4 sm:p-6 lg:p-8",
            "min-h-[calc(100vh-3.5rem)]",
          )}
        >
          {children}
        </main>
        <footer className="border-t border-border bg-muted/40 px-6 py-4">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
