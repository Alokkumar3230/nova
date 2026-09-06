import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock4,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PriorityBadge } from "@/components/PriorityBadge";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  isProjectOk,
  projectErrorMessage,
  useAddMember,
  useCreateTask,
  useDeleteProject,
  useDeleteTask,
  useGetProject,
  useListActivity,
  useListTasks,
  useRemoveMember,
  useSetTaskStatus,
  useUpdateProject,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import type {
  ActivityEvent,
  Project,
  ProjectMember,
  ProjectStatus,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/types";
import { formatDate, timestampToDate } from "@/types";

const COLUMNS: { status: TaskStatus; label: string; icon: typeof Circle }[] = [
  { status: "todo", label: "To Do", icon: Circle },
  { status: "inProgress", label: "In Progress", icon: Loader2 },
  { status: "done", label: "Done", icon: CheckCircle2 },
];

const PRIORITIES: TaskPriority[] = ["low", "medium", "high"];

function shortPrincipal(principal: Principal | null | undefined): string {
  if (!principal) return "Unassigned";
  const p = principal.toString();
  return p.length > 12 ? `${p.slice(0, 6)}…${p.slice(-4)}` : p;
}

function memberName(member: ProjectMember | undefined): string {
  return member ? shortPrincipal(member.user) : "Unassigned";
}

function isOverdue(task: Task): boolean {
  if (task.status === "done") return false;
  const due = task.dueDate ?? null;
  if (due === null) return false;
  const now = BigInt(Date.now()) * 1_000_000n;
  return due < now;
}

function formatActivityTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ProjectDetail() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId" });
  const id = BigInt(projectId);
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const caller = identity?.getPrincipal() ?? null;

  const { data: project, isLoading } = useGetProject(id);
  const { data: tasks = [], isLoading: tasksLoading } = useListTasks(id);
  const { data: activity = [], isLoading: activityLoading } =
    useListActivity(id);

  const [dragTaskId, setDragTaskId] = useState<bigint | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const setTaskStatus = useSetTaskStatus();
  const deleteTask = useDeleteTask();
  const deleteProject = useDeleteProject();

  const isAdmin =
    !!project && !!caller && project.owner.toString() === caller.toString();

  function handleDrop(status: TaskStatus) {
    if (dragTaskId !== null) {
      setTaskStatus.mutate({ projectId: id, taskId: dragTaskId, status });
    }
    setDragTaskId(null);
  }

  function handleDeleteProject() {
    if (!project) return;
    deleteProject.mutate(project.id, {
      onSuccess: (result) => {
        if (result.__kind__ === "ok") {
          void navigate({ to: "/projects" });
        }
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" data-ocid="back_to_projects">
          <Link to="/projects">
            <ArrowLeft className="size-4" />
            Back to Projects
          </Link>
        </Button>
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" data-ocid="back_to_projects">
          <Link to="/projects">
            <ArrowLeft className="size-4" />
            Back to Projects
          </Link>
        </Button>
        <EmptyState
          icon={FolderKanban}
          title="Project not found"
          description="This project may have been deleted or you may not have access to it."
          action={
            <Button asChild data-ocid="project_not_found_back">
              <Link to="/projects">View Projects</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" data-ocid="back_to_projects">
        <Link to="/projects">
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>
      </Button>

      <PageHeader
        title={project.name}
        description={project.description || "No description provided."}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            {isAdmin ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="edit_project_button"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  data-ocid="delete_project_button"
                  onClick={handleDeleteProject}
                  disabled={deleteProject.isPending}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Kanban board */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="font-display text-lg">Task Board</CardTitle>
              <Button
                size="sm"
                data-ocid="new_task_button"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-4" />
                New Task
              </Button>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {["a", "b", "c"].map((k) => (
                    <Skeleton key={k} className="h-64 rounded-lg" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No tasks yet"
                  description="Create your first task to start planning this project."
                  action={
                    <Button
                      data-ocid="empty_new_task_button"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus className="size-4" />
                      New Task
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {COLUMNS.map((col) => (
                    <KanbanColumn
                      key={col.status}
                      column={col}
                      tasks={tasks.filter((t) => t.status === col.status)}
                      isAdmin={isAdmin}
                      onDrop={() => handleDrop(col.status)}
                      onDragStart={setDragTaskId}
                      onDragEnd={() => setDragTaskId(null)}
                      onDelete={(taskId) => deleteTask.mutate(taskId)}
                      members={project.members}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <MembersPanel project={project} isAdmin={isAdmin} />
          <ActivityLog
            activity={activity}
            loading={activityLoading}
            members={project.members}
          />
        </div>
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={project.id}
        members={project.members}
      />

      <EditProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kanban                                                              */
/* ------------------------------------------------------------------ */

function KanbanColumn({
  column,
  tasks,
  isAdmin,
  onDrop,
  onDragStart,
  onDragEnd,
  onDelete,
  members,
}: {
  column: { status: TaskStatus; label: string; icon: typeof Circle };
  tasks: Task[];
  isAdmin: boolean;
  onDrop: () => void;
  onDragStart: (id: bigint) => void;
  onDragEnd: () => void;
  onDelete: (taskId: bigint) => void;
  members: ProjectMember[];
}) {
  const Icon = column.icon;
  return (
    <div
      data-ocid={`kanban_column_${column.status}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      <div className="flex items-center gap-2 px-1">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">
          {column.label}
        </span>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="flex min-h-24 flex-col gap-3">
        {tasks.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-muted-foreground">
            Drop tasks here
          </p>
        ) : (
          tasks.map((task, index) => (
            <TaskCard
              key={task.id.toString()}
              task={task}
              index={index}
              isAdmin={isAdmin}
              onDragStart={() => onDragStart(task.id)}
              onDragEnd={onDragEnd}
              onDelete={() => onDelete(task.id)}
              members={members}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  index,
  isAdmin,
  onDragStart,
  onDragEnd,
  onDelete,
  members,
}: {
  task: Task;
  index: number;
  isAdmin: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDelete: () => void;
  members: ProjectMember[];
}) {
  const overdue = isOverdue(task);
  const assignee = members.find(
    (m) => m.user.toString() === task.assignee?.toString(),
  );

  return (
    <div
      data-ocid={`task_card_${index}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-lg border bg-card p-3 shadow-subtle transition-smooth hover:shadow-elevated active:cursor-grabbing",
        overdue && "border-destructive/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-medium text-foreground">
          {task.title}
        </p>
        {isAdmin ? (
          <button
            type="button"
            data-ocid={`task_delete_button_${index}`}
            aria-label={`Delete task ${task.title}`}
            onClick={onDelete}
            className="rounded p-1 text-muted-foreground opacity-0 transition-smooth hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityBadge priority={task.priority} />
        {overdue ? (
          <span
            data-ocid="overdue_badge"
            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive"
          >
            <Clock4 className="size-3" />
            Overdue
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatDate(task.dueDate ?? null)}
        </span>
        <UserAvatar
          name={memberName(assignee)}
          className="size-6 text-[10px]"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create task dialog                                                  */
/* ------------------------------------------------------------------ */

function CreateTaskDialog({
  open,
  onOpenChange,
  projectId,
  members,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: bigint;
  members: ProjectMember[];
}) {
  const createTask = useCreateTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignee, setAssignee] = useState<string>("unassigned");
  const [dueDate, setDueDate] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setAssignee("unassigned");
    setDueDate("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const capturedTitle = title;
    const capturedDescription = description;
    const capturedPriority = priority;
    const capturedAssignee = assignee;
    const capturedDueDate = dueDate;

    const assigneeValue: Principal | null =
      capturedAssignee === "unassigned"
        ? null
        : Principal.fromText(capturedAssignee);

    const dueDateValue: bigint | null = capturedDueDate
      ? BigInt(new Date(`${capturedDueDate}T00:00:00`).getTime()) * 1_000_000n
      : null;

    reset();
    createTask.mutate(
      {
        projectId,
        title: capturedTitle,
        description: capturedDescription,
        priority: capturedPriority,
        assignee: assigneeValue,
        dueDate: dueDateValue,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: () => {
          setTitle((current) => (current === "" ? capturedTitle : current));
          setDescription((current) =>
            current === "" ? capturedDescription : current,
          );
          setPriority((current) =>
            current === "medium" ? capturedPriority : current,
          );
          setAssignee((current) =>
            current === "unassigned" ? capturedAssignee : current,
          );
          setDueDate((current) => (current === "" ? capturedDueDate : current));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="create_task_dialog">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Add a task to this project's board.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              data-ocid="task_title_input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design the landing page"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              data-ocid="task_description_input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail about this task"
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TaskPriority)}
              >
                <SelectTrigger
                  data-ocid="task_priority_select"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger
                  data-ocid="task_assignee_select"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem
                      key={m.user.toString()}
                      value={m.user.toString()}
                    >
                      {shortPrincipal(m.user)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-due">Due date</Label>
            <Input
              id="task-due"
              data-ocid="task_due_input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {createTask.isError ? (
            <p
              data-ocid="create_task_error"
              className="text-sm text-destructive"
            >
              Failed to create the task. Please try again.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="create_task_cancel"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="create_task_submit"
              disabled={createTask.isPending || title.trim() === ""}
            >
              {createTask.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Edit project dialog                                                 */
/* ------------------------------------------------------------------ */

function EditProjectDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}) {
  const updateProject = useUpdateProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    updateProject.mutate(
      { projectId: project.id, name, description, status },
      {
        onSuccess: (result) => {
          if (isProjectOk(result)) {
            onOpenChange(false);
          } else {
            setError(projectErrorMessage(result));
          }
        },
        onError: () =>
          setError("Failed to update the project. Please try again."),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="edit_project_dialog">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the project details and status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              data-ocid="edit_project_name_input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              data-ocid="edit_project_description_input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProjectStatus)}
            >
              <SelectTrigger
                data-ocid="edit_project_status_select"
                className="w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error ? (
            <p
              data-ocid="edit_project_error"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="edit_project_cancel"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="edit_project_save"
              disabled={updateProject.isPending || name.trim() === ""}
            >
              {updateProject.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Pencil className="size-4" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Members panel                                                       */
/* ------------------------------------------------------------------ */

function MembersPanel({
  project,
  isAdmin,
}: {
  project: Project;
  isAdmin: boolean;
}) {
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const [principalInput, setPrincipalInput] = useState("");
  const [error, setError] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const value = principalInput.trim();
    if (!value) return;
    let principal: Principal;
    try {
      principal = Principal.fromText(value);
    } catch {
      setError("That doesn't look like a valid principal ID.");
      return;
    }
    setError("");
    setPrincipalInput("");
    addMember.mutate(
      { projectId: project.id, user: principal },
      {
        onSuccess: (result) => {
          if (result.__kind__ === "err") {
            setError(projectErrorMessage(result));
          }
        },
        onError: () => setError("Failed to add member. Please try again."),
      },
    );
  }

  return (
    <Card data-ocid="members_panel">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg">
          <Users className="size-4 text-muted-foreground" />
          Team Members
        </CardTitle>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          {project.members.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {project.members.map((member, index) => {
            const isOwner =
              member.user?.toString() === project.owner.toString();
            return (
              <li
                key={member.user.toString()}
                data-ocid={`member_item_${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-2.5"
              >
                <UserAvatar name={shortPrincipal(member.user)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-foreground">
                    {shortPrincipal(member.user)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isOwner ? "Owner" : "Member"}
                  </p>
                </div>
                {isAdmin && !isOwner ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    data-ocid={`remove_member_button_${index}`}
                    onClick={() =>
                      removeMember.mutate({
                        projectId: project.id,
                        user: member.user,
                      })
                    }
                    disabled={removeMember.isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove member</span>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>

        {isAdmin ? (
          <form
            onSubmit={handleAdd}
            className="space-y-2 border-t border-border pt-3"
          >
            <Label htmlFor="member-principal">Add member by principal</Label>
            <div className="flex gap-2">
              <Input
                id="member-principal"
                data-ocid="member_principal_input"
                value={principalInput}
                onChange={(e) => setPrincipalInput(e.target.value)}
                placeholder="Enter a principal ID"
                className="font-mono text-xs"
              />
              <Button
                type="submit"
                size="icon"
                data-ocid="add_member_button"
                disabled={addMember.isPending || principalInput.trim() === ""}
                aria-label="Add member"
              >
                {addMember.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
              </Button>
            </div>
            {error ? (
              <p data-ocid="member_error" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

function ActivityLog({
  activity,
  loading,
  members,
}: {
  activity: ActivityEvent[];
  loading: boolean;
  members: ProjectMember[];
}) {
  const sorted = [...activity].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
  );

  return (
    <Card data-ocid="activity_log">
      <CardHeader>
        <CardTitle className="font-display text-lg">Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton key={k} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Clock4}
            title="No activity yet"
            description="Project events will appear here as they happen."
          />
        ) : (
          <ol className="space-y-4">
            {sorted.map((event, index) => {
              const actor = members.find(
                (m) => m.user?.toString() === event.actorPrincipal.toString(),
              );
              const actorLabel = actor
                ? memberName(actor)
                : shortPrincipal(event.actorPrincipal);
              return (
                <li
                  key={event.id.toString()}
                  data-ocid={`activity_item_${index}`}
                  className="flex gap-3"
                >
                  <UserAvatar
                    name={actorLabel}
                    className="mt-0.5 size-7 text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {actorLabel} · {formatActivityTime(event.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
