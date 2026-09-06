import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TaskDetail } from "@/pages/TaskDetail";
import { Principal } from "@icp-sdk/core/principal";
import { makeComment, makeMockActor, makeProject, makeTask } from "./mockActor";
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

// The Radix Select popper does not render its options in jsdom, so we mock the
// UI Select at the module level. `SelectTrigger` renders a native <select> that
// forwards `data-ocid` as the test id and calls `onValueChange` on change, which
// lets us drive the status change without depending on the popper portal.
vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange?: (v: string) => void;
      children: React.ReactNode;
    }) => (
      <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
        {children}
      </select>
    ),
    SelectTrigger: ({
      children,
      ...props
    }: {
      children: React.ReactNode;
      "data-ocid"?: string;
    }) => <span data-ocid={props["data-ocid"]}>{children}</span>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => <option value={value}>{children}</option>,
  };
});

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    useParams: () => ({ taskId: "1" }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

const OWNER = Principal.fromText("aaaaa-aa");

describe("TaskDetail", () => {
  beforeEach(() => {
    resetMocks();
    setAuthenticated(OWNER);
  });

  it("renders the task title, description, priority, and due date", async () => {
    const due = BigInt(Date.now() + 86_400_000) * 1_000_000n;
    setActor(
      makeMockActor({
        getTask: async () =>
          makeTask({
            id: 1n,
            title: "Design landing page",
            description: "Build the hero section",
            priority: "high",
            dueDate: due,
          }),
        getProject: async () => makeProject({ id: 1n, owner: OWNER }),
        listComments: async () => [],
      }),
    );
    renderWithQuery(<TaskDetail />);

    expect(await screen.findByText("Design landing page")).toBeInTheDocument();
    // The description appears both in the page header and the description card.
    expect(
      screen.getAllByText("Build the hero section").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("displays comments with author and body", async () => {
    setActor(
      makeMockActor({
        getTask: async () => makeTask({ id: 1n, title: "T", description: "d" }),
        getProject: async () => makeProject({ id: 1n, owner: OWNER }),
        listComments: async () => [
          makeComment({ id: 1n, body: "Looking good", author: OWNER }),
          makeComment({ id: 2n, body: "Ship it", author: OWNER }),
        ],
      }),
    );
    renderWithQuery(<TaskDetail />);

    expect(await screen.findByText("Looking good")).toBeInTheDocument();
    expect(screen.getByText("Ship it")).toBeInTheDocument();
  });

  it("posts a comment through the actor", async () => {
    const addComment = vi.fn(async () =>
      makeComment({ id: 1n, body: "Nice work", author: OWNER }),
    );
    setActor(
      makeMockActor({
        getTask: async () => makeTask({ id: 1n, title: "T", description: "d" }),
        getProject: async () => makeProject({ id: 1n, owner: OWNER }),
        listComments: async () => [],
        addComment,
      }),
    );
    renderWithQuery(<TaskDetail />);

    const input = await screen.findByLabelText("Add a comment");
    fireEvent.change(input, { target: { value: "Nice work" } });
    fireEvent.click(screen.getByText("Post comment"));

    await waitFor(() => {
      expect(addComment).toHaveBeenCalledWith(1n, "Nice work");
    });
  });

  it("changes task status through the actor", async () => {
    const setTaskStatus = vi.fn(async () =>
      makeTask({ id: 1n, title: "T", status: "done" }),
    );
    setActor(
      makeMockActor({
        getTask: async () => makeTask({ id: 1n, title: "T", description: "d" }),
        getProject: async () => makeProject({ id: 1n, owner: OWNER }),
        listComments: async () => [],
        setTaskStatus,
      }),
    );
    renderWithQuery(<TaskDetail />);

    await screen.findByText("T");
    // The mocked Select renders a native <select> whose change handler invokes
    // the component's onValueChange, so we drive the status change directly
    // without depending on the Radix popper rendering options in jsdom. The
    // data-ocid marker lives on the trigger span inside the select.
    const select = screen.getByTestId("task_status_select").closest("select");
    expect(select).not.toBeNull();
    fireEvent.change(select as HTMLSelectElement, {
      target: { value: "done" },
    });

    await waitFor(() => {
      expect(setTaskStatus).toHaveBeenCalledWith(1n, "done");
    });
  });
});
