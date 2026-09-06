import type { Principal } from "@icp-sdk/core/principal";

/**
 * Shared NOVA domain types.
 *
 * These mirror the backend contract (see `contracts.backend` in the dispatch).
 * Optional fields use the bindgen `Option<T>` wrapper convention
 * (`{ __kind__: "Some"; value: T } | { __kind__: "None" }`), and `Result`
 * variants use the `{ __kind__: "ok" | "err" }` shape produced by bindgen.
 */

/** Optional-value wrapper matching the generated bindings. */
export type Option<T> = { __kind__: "Some"; value: T } | { __kind__: "None" };

export function isSome<T>(
  option: Option<T>,
): option is { __kind__: "Some"; value: T } {
  return option.__kind__ === "Some";
}

export function unwrapOption<T>(option: Option<T>): T | null {
  return isSome(option) ? option.value : null;
}

/** `Result.Result<Project, ProjectError>` shape produced by bindgen. */
export type ProjectResult =
  | { __kind__: "ok"; ok: Project }
  | { __kind__: "err"; err: ProjectError };

export type UnitResult =
  | { __kind__: "ok"; ok: null }
  | { __kind__: "err"; err: ProjectError };

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export type ProjectStatus = "active" | "completed" | "archived";
export type ProjectRole = "admin" | "member";

export interface ProjectMember {
  user: Principal;
  role: ProjectRole;
  joinedAt: bigint;
}

export interface Project {
  id: bigint;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: bigint;
  owner: Principal;
  members: ProjectMember[];
}

export interface UserProfile {
  principal: Principal;
  name: string;
  email: string;
}

export type ProjectError =
  | { __kind__: "notFound"; notFound: bigint }
  | { __kind__: "notAuthorized" }
  | { __kind__: "notMember" }
  | { __kind__: "alreadyMember" }
  | { __kind__: "invalidName" };

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export type TaskStatus = "todo" | "inProgress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: bigint;
  projectId: bigint;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Principal | null;
  dueDate: bigint | null;
  createdAt: bigint;
  updatedAt: bigint;
}

export interface Comment {
  id: bigint;
  taskId: bigint;
  author: Principal;
  body: string;
  createdAt: bigint;
}

export interface ActivityEvent {
  id: bigint;
  projectId: bigint;
  actorPrincipal: Principal;
  action: string;
  createdAt: bigint;
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export interface TaskStatusCounts {
  todo: bigint;
  inProgress: bigint;
  done: bigint;
}

export interface ProjectProgress {
  projectId: bigint;
  name: string;
  status: ProjectStatus;
  totalTasks: bigint;
  doneTasks: bigint;
  percentDone: bigint;
}

export interface DashboardSummary {
  totalProjects: bigint;
  taskCounts: TaskStatusCounts;
  overdueTasks: bigint;
  progress: ProjectProgress[];
}

/* ------------------------------------------------------------------ */
/* Actor surface                                                       */
/* ------------------------------------------------------------------ */

/**
 * The NOVA backend actor surface. The generated `Backend` class gains these
 * methods once the backend tasks run `pnpm bindgen`; this interface lets the
 * frontend call them against the authoritative contract in the meantime.
 */
export interface NovaActor {
  /* projects */
  createProject(name: string, description: string): Promise<ProjectResult>;
  getProject(projectId: bigint): Promise<Project | null>;
  listMyProjects(): Promise<Project[]>;
  updateProject(
    projectId: bigint,
    name: string,
    description: string,
    status: ProjectStatus,
  ): Promise<ProjectResult>;
  deleteProject(projectId: bigint): Promise<UnitResult>;
  addMember(projectId: bigint, user: Principal): Promise<UnitResult>;
  removeMember(projectId: bigint, user: Principal): Promise<UnitResult>;
  getDashboard(): Promise<DashboardSummary>;

  /* tasks */
  createTask(
    projectId: bigint,
    title: string,
    description: string,
    priority: TaskPriority,
    assignee: Principal | null,
    dueDate: bigint | null,
  ): Promise<Task>;
  getTask(taskId: bigint): Promise<Task | null>;
  listTasks(projectId: bigint): Promise<Task[]>;
  updateTask(
    taskId: bigint,
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: bigint | null,
  ): Promise<Task>;
  deleteTask(taskId: bigint): Promise<void>;
  setTaskStatus(taskId: bigint, status: TaskStatus): Promise<Task>;
  setTaskAssignee(taskId: bigint, assignee: Principal | null): Promise<Task>;
  addComment(taskId: bigint, body: string): Promise<Comment>;
  listComments(taskId: bigint): Promise<Comment[]>;
  listActivity(projectId: bigint): Promise<ActivityEvent[]>;
}

/* ------------------------------------------------------------------ */
/* Time helpers                                                        */
/* ------------------------------------------------------------------ */

/** Convert a Motoko nanosecond timestamp to a JS Date. */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a nanosecond timestamp as a short date (e.g. "Sep 6, 2026"). */
export function formatDate(timestamp: bigint | null): string {
  if (timestamp === null) return "No due date";
  const date = timestampToDate(timestamp);
  if (!date) return "No due date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
