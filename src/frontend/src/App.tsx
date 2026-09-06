import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Layout } from "@/components/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { ProjectDetail } from "@/pages/ProjectDetail";
import { Projects } from "@/pages/Projects";
import { SignIn } from "@/pages/SignIn";
import { TaskDetail } from "@/pages/TaskDetail";

/**
 * Auth guard for protected routes. Redirects unauthenticated users to the
 * sign-in screen.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useInternetIdentity();
  if (!isAuthenticated) {
    return <SignIn />;
  }
  return <>{children}</>;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignIn,
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_app",
  component: () => (
    <RequireAuth>
      <Layout>
        <Outlet />
      </Layout>
    </RequireAuth>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/dashboard",
  component: Dashboard,
});

const projectsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects",
  component: Projects,
});

const projectDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/projects/$projectId",
  component: ProjectDetail,
});

const taskDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/tasks/$taskId",
  component: TaskDetail,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

const routeTree = rootRoute.addChildren([
  signInRoute,
  indexRoute,
  appLayoutRoute.addChildren([
    dashboardRoute,
    projectsRoute,
    projectDetailRoute,
    taskDetailRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
