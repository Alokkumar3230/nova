import type {
  ActivityEvent,
  Comment,
  DashboardSummary,
  NovaActor,
  Project,
  ProjectResult,
  Task,
  TaskPriority,
  TaskStatus,
  UnitResult,
} from "@/types";
import type { Principal } from "@icp-sdk/core/principal";

/**
 * Builds a typed `NovaActor` mock with configurable per-method behavior.
 * Tests override the methods they care about; the rest return safe defaults.
 */
export function makeMockActor(overrides: Partial<NovaActor> = {}): NovaActor {
  const base: NovaActor = {
    createProject: async (name, description): Promise<ProjectResult> => ({
      __kind__: "ok",
      ok: {
        id: 1n,
        name,
        description,
        status: "active",
        createdAt: 0n,
        owner: undefined as unknown as Principal,
        members: [],
      },
    }),
    getProject: async (): Promise<Project | null> => null,
    listMyProjects: async (): Promise<Project[]> => [],
    updateProject: async (): Promise<ProjectResult> => ({
      __kind__: "err",
      err: { __kind__: "notAuthorized" },
    }),
    deleteProject: async (): Promise<UnitResult> => ({
      __kind__: "ok",
      ok: null,
    }),
    addMember: async (): Promise<UnitResult> => ({ __kind__: "ok", ok: null }),
    removeMember: async (): Promise<UnitResult> => ({
      __kind__: "ok",
      ok: null,
    }),
    getDashboard: async (): Promise<DashboardSummary> => ({
      totalProjects: 0n,
      taskCounts: { todo: 0n, inProgress: 0n, done: 0n },
      overdueTasks: 0n,
      progress: [],
    }),
    createTask: async (
      projectId,
      title,
      description,
      priority,
      assignee,
      dueDate,
    ): Promise<Task> => ({
      id: 1n,
      projectId,
      title,
      description,
      status: "todo",
      priority,
      assignee,
      dueDate,
      createdAt: 0n,
      updatedAt: 0n,
    }),
    getTask: async (): Promise<Task | null> => null,
    listTasks: async (): Promise<Task[]> => [],
    updateTask: async (): Promise<Task> => {
      throw new Error("updateTask not stubbed");
    },
    deleteTask: async (): Promise<void> => {},
    setTaskStatus: async (): Promise<Task> => {
      throw new Error("setTaskStatus not stubbed");
    },
    setTaskAssignee: async (): Promise<Task> => {
      throw new Error("setTaskAssignee not stubbed");
    },
    addComment: async (): Promise<Comment> => {
      throw new Error("addComment not stubbed");
    },
    listComments: async (): Promise<Comment[]> => [],
    listActivity: async (): Promise<ActivityEvent[]> => [],
  };
  return { ...base, ...overrides };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1n,
    name: "Website Redesign",
    description: "Rebuild the marketing site",
    status: "active",
    createdAt: 0n,
    owner: undefined as unknown as Principal,
    members: [],
    ...overrides,
  };
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 1n,
    projectId: 1n,
    title: "Design landing page",
    description: "Build the hero section",
    status: "todo",
    priority: "medium",
    assignee: null,
    dueDate: null,
    createdAt: 0n,
    updatedAt: 0n,
    ...overrides,
  };
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1n,
    taskId: 1n,
    author: undefined as unknown as Principal,
    body: "Looking good",
    createdAt: 0n,
    ...overrides,
  };
}

export function makeActivity(
  overrides: Partial<ActivityEvent> = {},
): ActivityEvent {
  return {
    id: 1n,
    projectId: 1n,
    actorPrincipal: undefined as unknown as Principal,
    action: "Task created",
    createdAt: 0n,
    ...overrides,
  };
}

export function makeDashboard(
  overrides: Partial<DashboardSummary> = {},
): DashboardSummary {
  return {
    totalProjects: 1n,
    taskCounts: { todo: 1n, inProgress: 0n, done: 0n },
    overdueTasks: 0n,
    progress: [],
    ...overrides,
  };
}

export type { TaskPriority, TaskStatus };
