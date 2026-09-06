import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Projects } from "@/pages/Projects";
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
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

describe("Projects", () => {
  beforeEach(() => {
    resetMocks();
    setAuthenticated(Principal.fromText("aaaaa-aa"));
  });

  it("renders the list of projects the user belongs to", async () => {
    const owner = Principal.fromText("aaaaa-aa");
    setActor(
      makeMockActor({
        listMyProjects: async () => [
          makeProject({
            id: 1n,
            name: "Website Redesign",
            description: "Rebuild the marketing site",
            status: "active",
            owner,
            members: [{ user: owner, role: "admin", joinedAt: 0n }],
          }),
        ],
        getDashboard: async () =>
          makeDashboard({
            progress: [
              {
                projectId: 1n,
                name: "Website Redesign",
                status: "active",
                totalTasks: 2n,
                doneTasks: 1n,
                percentDone: 50n,
              },
            ],
          }),
      }),
    );
    renderWithQuery(<Projects />);

    expect(await screen.findByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("Rebuild the marketing site")).toBeInTheDocument();
    expect(screen.getByText("1 member")).toBeInTheDocument();
  });

  it("creates a project through the dialog", async () => {
    const createProject = vi.fn(async (name: string, description: string) => ({
      __kind__: "ok" as const,
      ok: makeProject({ name, description }),
    }));
    setActor(
      makeMockActor({
        listMyProjects: async () => [],
        getDashboard: async () => makeDashboard(),
        createProject,
      }),
    );
    renderWithQuery(<Projects />);

    fireEvent.click(screen.getAllByText("New Project")[0]);
    expect(
      await screen.findByRole("heading", { name: "Create project" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Mobile App" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Build the app" },
    });
    fireEvent.click(screen.getByTestId("submit_button"));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith("Mobile App", "Build the app");
    });
  });

  it("shows an empty state when there are no projects", async () => {
    setActor(
      makeMockActor({
        listMyProjects: async () => [],
        getDashboard: async () => makeDashboard(),
      }),
    );
    renderWithQuery(<Projects />);
    expect(await screen.findByText("No projects yet")).toBeInTheDocument();
  });
});
