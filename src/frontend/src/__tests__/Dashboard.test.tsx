import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Dashboard } from "@/pages/Dashboard";
import { Principal } from "@icp-sdk/core/principal";
import { makeDashboard, makeMockActor, makeProject } from "./mockActor";
import {
  mockActorState,
  mockIdentityState,
  resetMocks,
  setActor,
  setAuthenticated,
} from "./mockInfrastructure";
import { renderWithQuery } from "./render";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => mockIdentityState,
  useActor: () => mockActorState,
}));

vi.mock("@/backend", () => ({
  createActor: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      params,
    }: {
      children: React.ReactNode;
      to: string;
      params?: Record<string, string>;
    }) => {
      let href = to;
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          href = href.replace(`$${key}`, value);
        }
      }
      return <a href={href}>{children}</a>;
    },
  };
});

describe("Dashboard", () => {
  beforeEach(() => {
    resetMocks();
    setAuthenticated(Principal.fromText("aaaaa-aa"));
  });

  it("renders the dashboard stats from the actor", async () => {
    setActor(
      makeMockActor({
        getDashboard: async () =>
          makeDashboard({
            totalProjects: 3n,
            taskCounts: { todo: 2n, inProgress: 1n, done: 4n },
            overdueTasks: 1n,
          }),
      }),
    );
    renderWithQuery(<Dashboard />);

    expect(await screen.findByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(2); // In Progress + Overdue
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("renders project progress rows linking to project detail", async () => {
    setActor(
      makeMockActor({
        getDashboard: async () =>
          makeDashboard({
            totalProjects: 1n,
            progress: [
              {
                projectId: 7n,
                name: "Website Redesign",
                status: "active",
                totalTasks: 4n,
                doneTasks: 2n,
                percentDone: 50n,
              },
            ],
          }),
      }),
    );
    renderWithQuery(<Dashboard />);

    expect(await screen.findByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("2/4 · 50%")).toBeInTheDocument();
    const link = screen.getByText("Website Redesign").closest("a");
    expect(link).toHaveAttribute("href", "/projects/7");
  });

  it("shows an empty state when there are no projects", async () => {
    setActor(makeMockActor({ getDashboard: async () => makeDashboard() }));
    renderWithQuery(<Dashboard />);
    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
  });
});
