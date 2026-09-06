import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Result_2 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface ProjectMember {
    joinedAt: bigint;
    role: ProjectRole;
    user: Principal;
}
export interface ProjectProgress {
    status: ProjectStatus;
    doneTasks: bigint;
    totalTasks: bigint;
    name: string;
    projectId: bigint;
    percentDone: bigint;
}
export interface Comment {
    id: bigint;
    body: string;
    createdAt: bigint;
    author: Principal;
    taskId: bigint;
}
export type ProjectError = {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "notMember";
    notMember: null;
} | {
    __kind__: "alreadyMember";
    alreadyMember: null;
} | {
    __kind__: "notFound";
    notFound: bigint;
} | {
    __kind__: "invalidName";
    invalidName: null;
};
export interface Task {
    id: bigint;
    status: TaskStatus;
    assignee?: Principal;
    title: string;
    createdAt: bigint;
    dueDate?: bigint;
    description: string;
    updatedAt: bigint;
    projectId: bigint;
    priority: TaskPriority;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface DashboardSummary {
    overdueTasks: bigint;
    taskCounts: TaskStatusCounts;
    totalProjects: bigint;
    progress: Array<ProjectProgress>;
}
export type Result_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: ProjectError;
};
export type Result = {
    __kind__: "ok";
    ok: Project;
} | {
    __kind__: "err";
    err: ProjectError;
};
export interface ActivityEvent {
    id: bigint;
    action: string;
    createdAt: bigint;
    projectId: bigint;
    actorPrincipal: Principal;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface TaskStatusCounts {
    done: bigint;
    todo: bigint;
    inProgress: bigint;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface Project {
    id: bigint;
    status: ProjectStatus;
    members: Array<ProjectMember>;
    owner: Principal;
    name: string;
    createdAt: bigint;
    description: string;
}
export enum ProjectRole {
    member = "member",
    admin = "admin"
}
export enum ProjectStatus {
    active = "active",
    completed = "completed",
    archived = "archived"
}
export enum TaskPriority {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum TaskStatus {
    done = "done",
    todo = "todo",
    inProgress = "inProgress"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addComment(taskId: bigint, body: string): Promise<Comment>;
    addMember(projectId: bigint, user: Principal): Promise<Result_1>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(name: string, description: string): Promise<Result>;
    createTask(projectId: bigint, title: string, description: string, priority: TaskPriority, assignee: Principal | null, dueDate: bigint | null): Promise<Task>;
    deleteProject(projectId: bigint): Promise<Result_1>;
    deleteTask(taskId: bigint): Promise<void>;
    execute(qJson: string): Promise<Result__1>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboard(): Promise<DashboardSummary>;
    getProject(projectId: bigint): Promise<Project | null>;
    getTask(taskId: bigint): Promise<Task | null>;
    isCallerAdmin(): Promise<boolean>;
    listActivity(projectId: bigint): Promise<Array<ActivityEvent>>;
    listComments(taskId: bigint): Promise<Array<Comment>>;
    listMyProjects(): Promise<Array<Project>>;
    listTasks(projectId: bigint): Promise<Array<Task>>;
    removeMember(projectId: bigint, user: Principal): Promise<Result_1>;
    schema(): Promise<string>;
    setTaskAssignee(taskId: bigint, assignee: Principal | null): Promise<Task>;
    setTaskStatus(taskId: bigint, status: TaskStatus): Promise<Task>;
    updateProject(projectId: bigint, name: string, description: string, status: ProjectStatus): Promise<Result>;
    updateTask(taskId: bigint, title: string, description: string, priority: TaskPriority, dueDate: bigint | null): Promise<Task>;
}
