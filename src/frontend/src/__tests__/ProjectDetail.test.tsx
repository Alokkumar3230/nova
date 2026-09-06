import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectDetail } from "@/pages/ProjectDetail";
import { Principal } from "@icp-sdk/core/principal";
import {
  makeActivity,
  makeMockActor,
  makeProject,
  makeTask,
} from "./mockActor";
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

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useParams: () => ({ projectId: "1" }),
    useNavigate: () => navigateMock,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const OWNER = Principal.fromText("aaaaa-aa");
const MEMBER = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai");

function projectWithMembers() {
  return makeProject({
    id: 1n,
    name: "Website Redesign",
    description: "Rebuild the marketing site",
    status: "active",
    owner: OWNER,
    members: [
      { user: OWNER, role: "admin", joinedAt: 0n },
      { user: MEMBER, role: "member", joinedAt: 0n },
    ],
  });
}

describe("ProjectDetail", () => {
  beforeEach(() => {
    resetMocks();
    navigateMock.mockReset();
  });

  it("renders the kanban board with tasks in their columns", async () => {
    setAuthenticated(OWNER);
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [
          makeTask({ id: 1n, title: "Design hero", status: "todo" }),
          makeTask({ id: 2n, title: "Build API", status: "inProgress" }),
          makeTask({ id: 3n, title: "Ship it", status: "done" }),
        ],
        listActivity: async () => [],
      }),
    );
    renderWithQuery(<ProjectDetail />);

    expect(await screen.findByText("Design hero")).toBeInTheDocument();
    expect(screen.getByText("Build API")).toBeInTheDocument();
    expect(screen.getByText("Ship it")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows admin controls only to the owner", async () => {
    setAuthenticated(OWNER);
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [],
        listActivity: async () => [],
      }),
    );
    renderWithQuery(<ProjectDetail />);

    expect(await screen.findByText("Website Redesign")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    // Owner can add members.
    expect(screen.getByLabelText("Add member")).toBeInTheDocument();
  });

  it("hides admin controls from a non-owner member", async () => {
    setAuthenticated(MEMBER);
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [],
        listActivity: async () => [],
      }),
    );
    renderWithQuery(<ProjectDetail />);

    expect(await screen.findByText("Website Redesign")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Add member")).not.toBeInTheDocument();
  });

  it("flags overdue tasks that are not done", async () => {
    setAuthenticated(OWNER);
    const pastDue = BigInt(Date.now() - 86_400_000) * 1_000_000n;
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [
          makeTask({
            id: 1n,
            title: "Overdue task",
            status: "todo",
            dueDate: pastDue,
          }),
          makeTask({
            id: 2n,
            title: "Done task",
            status: "done",
            dueDate: pastDue,
          }),
        ],
        listActivity: async () => [],
      }),
    );
    renderWithQuery(<ProjectDetail />);

    expect(await screen.findByText("Overdue task")).toBeInTheDocument();
    expect(screen.getAllByText("Overdue")).toHaveLength(1);
  });

  it("renders the activity log newest first", async () => {
    setAuthenticated(OWNER);
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [],
        listActivity: async () => [
          makeActivity({
            id: 1n,
            action: "Older event",
            createdAt: 100n,
            actorPrincipal: OWNER,
          }),
          makeActivity({
            id: 2n,
            action: "Newer event",
            createdAt: 200n,
            actorPrincipal: OWNER,
          }),
        ],
      }),
    );
    renderWithQuery(<ProjectDetail />);

    expect(await screen.findByText("Newer event")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    const texts = items.map((el) => el.textContent ?? "");
    const newerIndex = texts.findIndex((t) => t.includes("Newer event"));
    const olderIndex = texts.findIndex((t) => t.includes("Older event"));
    expect(newerIndex).toBeLessThan(olderIndex);
  });

  it("moves a task to Done via drag-and-drop and persists the status", async () => {
    setAuthenticated(OWNER);
    const setTaskStatus = vi.fn(async () =>
      makeTask({ id: 1n, title: "Design hero", status: "done" }),
    );
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [
          makeTask({ id: 1n, title: "Design hero", status: "todo" }),
        ],
        listActivity: async () => [],
        setTaskStatus,
      }),
    );
    renderWithQuery(<ProjectDetail />);

    const card = await screen.findByText("Design hero");
    const doneColumn = screen.getByTestId("kanban_column_done");
    fireEvent.dragStart(card);
    fireEvent.drop(doneColumn);

    await waitFor(() => {
      expect(setTaskStatus).toHaveBeenCalledWith(1n, "done");
    });
  });

  it("refreshes the activity log after editing the project", async () => {
    setAuthenticated(OWNER);
    const updateProject = vi.fn(async () => ({
      __kind__: "ok" as const,
      ok: makeProject({
        id: 1n,
        name: "Renamed",
        description: "new desc",
        status: "active",
        owner: OWNER,
      }),
    }));
    // The activity query is refetched after the edit (the ['activity', id]
    // invalidation in useUpdateProject), so the second call returns the new
    // "Project edited" event that the first call did not have.
    const listActivity = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        makeActivity({
          id: 1n,
          action: "Project edited",
          createdAt: 100n,
          actorPrincipal: OWNER,
        }),
      ]);
    setActor(
      makeMockActor({
        getProject: async () => projectWithMembers(),
        listTasks: async () => [],
        listActivity,
        updateProject,
      }),
    );
    renderWithQuery(<ProjectDetail />);

    await screen.findByText("Website Redesign");
    fireEvent.click(screen.getByText("Edit"));
    await screen.findByRole("heading", { name: "Edit Project" });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Renamed" },
    });
    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith(
        1n,
        "Renamed",
        "Rebuild the marketing site",
        "active",
      );
    });
    // The activity query was invalidated and refetched, surfacing the new event.
    expect(await screen.findByText("Project edited")).toBeInTheDocument();
  });
});
