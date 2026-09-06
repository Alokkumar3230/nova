import { createActor } from "@/backend";
import type {
  Comment,
  DashboardSummary,
  NovaActor,
  Project,
  ProjectResult,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
  UnitResult,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * The generated `Backend` class gains the project/task methods once the
 * backend tasks run `pnpm bindgen`. Until then we access the actor through the
 * authoritative `NovaActor` contract surface.
 */
function asNovaActor(actor: unknown): NovaActor {
  return actor as NovaActor;
}

function useCaller(): Principal | null {
  const { identity } = useInternetIdentity();
  return identity ? identity.getPrincipal() : null;
}

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/* ------------------------------------------------------------------ */

export function useListMyProjects() {
  const { actor, isFetching } = useActor(createActor);
  const caller = useCaller();
  return useQuery({
    queryKey: ["projects", "mine"],
    queryFn: async () => {
      if (!actor || !caller) return [];
      return asNovaActor(actor).listMyProjects();
    },
    enabled: !!actor && !!caller && !isFetching,
  });
}

export function useGetProject(projectId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      if (!actor || projectId === undefined) return null;
      return asNovaActor(actor).getProject(projectId);
    },
    enabled: !!actor && projectId !== undefined && !isFetching,
  });
}

export function useCreateProject() {
  const { actor } = useActor(createActor);
  const caller = useCaller();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }): Promise<ProjectResult> => {
      if (!actor || !caller) throw new Error("Backend is not ready");
      return asNovaActor(actor).createProject(name, description);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateProject() {
  const { actor } = useActor(createActor);
  const caller = useCaller();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      name,
      description,
      status,
    }: {
      projectId: bigint;
      name: string;
      description: string;
      status: ProjectStatus;
    }): Promise<ProjectResult> => {
      if (!actor || !caller) throw new Error("Backend is not ready");
      return asNovaActor(actor).updateProject(
        projectId,
        name,
        description,
        status,
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["activity", variables.projectId],
      });
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor(createActor);
  const caller = useCaller();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: bigint): Promise<UnitResult> => {
      if (!actor || !caller) throw new Error("Backend is not ready");
      return asNovaActor(actor).deleteProject(projectId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddMember() {
  const { actor } = useActor(createActor);
  const caller = useCaller();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      user,
    }: {
      projectId: bigint;
      user: Principal;
    }): Promise<UnitResult> => {
      if (!actor || !caller) throw new Error("Backend is not ready");
      return asNovaActor(actor).addMember(projectId, user);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["projects", variables.projectId],
      });
    },
  });
}

export function useRemoveMember() {
  const { actor } = useActor(createActor);
  const caller = useCaller();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      user,
    }: {
      projectId: bigint;
      user: Principal;
    }): Promise<UnitResult> => {
      if (!actor || !caller) throw new Error("Backend is not ready");
      return asNovaActor(actor).removeMember(projectId, user);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["projects", variables.projectId],
      });
    },
  });
}

export function useGetDashboard() {
  const { actor, isFetching } = useActor(createActor);
  const caller = useCaller();
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardSummary | null> => {
      if (!actor || !caller) return null;
      return asNovaActor(actor).getDashboard();
    },
    enabled: !!actor && !!caller && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Tasks                                                               */
/* ------------------------------------------------------------------ */

export function useListTasks(projectId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      if (!actor || projectId === undefined) return [];
      return asNovaActor(actor).listTasks(projectId);
    },
    enabled: !!actor && projectId !== undefined && !isFetching,
  });
}

export function useGetTask(taskId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: async () => {
      if (!actor || taskId === undefined) return null;
      return asNovaActor(actor).getTask(taskId);
    },
    enabled: !!actor && taskId !== undefined && !isFetching,
  });
}

export function useCreateTask() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      title,
      description,
      priority,
      assignee,
      dueDate,
    }: {
      projectId: bigint;
      title: string;
      description: string;
      priority: TaskPriority;
      assignee: Principal | null;
      dueDate: bigint | null;
    }): Promise<Task> => {
      if (!actor) throw new Error("Backend is not ready");
      return asNovaActor(actor).createTask(
        projectId,
        title,
        description,
        priority,
        assignee,
        dueDate,
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["tasks", variables.projectId],
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["activity", variables.projectId],
      });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      title,
      description,
      priority,
      dueDate,
    }: {
      taskId: bigint;
      title: string;
      description: string;
      priority: TaskPriority;
      dueDate: bigint | null;
    }): Promise<Task> => {
      if (!actor) throw new Error("Backend is not ready");
      return asNovaActor(actor).updateTask(
        taskId,
        title,
        description,
        priority,
        dueDate,
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId],
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      return asNovaActor(actor).deleteTask(taskId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useSetTaskStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      projectId: bigint;
      taskId: bigint;
      status: TaskStatus;
    }): Promise<Task> => {
      if (!actor) throw new Error("Backend is not ready");
      return asNovaActor(actor).setTaskStatus(taskId, status);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId],
      });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({
        queryKey: ["activity", variables.projectId],
      });
    },
  });
}

export function useSetTaskAssignee() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      assignee,
    }: {
      projectId: bigint;
      taskId: bigint;
      assignee: Principal | null;
    }): Promise<Task> => {
      if (!actor) throw new Error("Backend is not ready");
      return asNovaActor(actor).setTaskAssignee(taskId, assignee);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({
        queryKey: ["tasks", "detail", variables.taskId],
      });
      void queryClient.invalidateQueries({
        queryKey: ["activity", variables.projectId],
      });
    },
  });
}

export function useAddComment() {
  const { actor } = useActor(createActor);
  const caller = useCaller();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      taskId,
      body,
    }: {
      taskId: bigint;
      body: string;
    }): Promise<Comment> => {
      if (!actor || !caller) throw new Error("Backend is not ready");
      return asNovaActor(actor).addComment(taskId, body);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["comments", variables.taskId],
      });
    },
  });
}

export function useListComments(taskId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      if (!actor || taskId === undefined) return [];
      return asNovaActor(actor).listComments(taskId);
    },
    enabled: !!actor && taskId !== undefined && !isFetching,
  });
}

export function useListActivity(projectId: bigint | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["activity", projectId],
    queryFn: async () => {
      if (!actor || projectId === undefined) return [];
      return asNovaActor(actor).listActivity(projectId);
    },
    enabled: !!actor && projectId !== undefined && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Project helpers                                                     */
/* ------------------------------------------------------------------ */

export function isProjectOk(
  result: ProjectResult | UnitResult,
): result is { __kind__: "ok"; ok: Project } {
  return result.__kind__ === "ok";
}

export function projectErrorMessage(
  result: ProjectResult | UnitResult,
): string {
  if (result.__kind__ === "ok") return "";
  switch (result.err.__kind__) {
    case "notFound":
      return "Project not found.";
    case "notAuthorized":
      return "You are not authorized to perform this action.";
    case "notMember":
      return "You are not a member of this project.";
    case "alreadyMember":
      return "That user is already a member.";
    case "invalidName":
      return "Project name is invalid.";
    default:
      return "Something went wrong.";
  }
}
