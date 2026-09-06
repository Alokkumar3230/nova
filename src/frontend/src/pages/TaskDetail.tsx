import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Principal } from "@icp-sdk/core/principal";
import { Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock4,
  Loader2,
  MessageSquare,
  Pencil,
  Save,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { PriorityBadge } from "@/components/PriorityBadge";
import { TaskStatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAddComment,
  useGetProject,
  useGetTask,
  useListComments,
  useSetTaskAssignee,
  useSetTaskStatus,
  useUpdateTask,
} from "@/hooks/useQueries";
import {
  type TaskPriority,
  type TaskStatus,
  formatDate,
  timestampToDate,
} from "@/types";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "inProgress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function shortPrincipal(p: Principal): string {
  const s = p.toString();
  return s.length > 14 ? `${s.slice(0, 6)}…${s.slice(-4)}` : s;
}

function dateToTimestamp(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

function toDateInputValue(timestamp: bigint | null): string {
  if (timestamp === null) return "";
  const date = timestampToDate(timestamp);
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatCommentTime(timestamp: bigint): string {
  const date = timestampToDate(timestamp);
  if (!date) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TaskDetail() {
  const { taskId } = useParams({ from: "/_app/tasks/$taskId" });
  const id = BigInt(taskId);
  const { data: task, isLoading } = useGetTask(id);
  const { data: project } = useGetProject(task?.projectId);
  const { data: comments, isLoading: commentsLoading } = useListComments(id);
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity ? identity.getPrincipal() : null;

  const updateTask = useUpdateTask();
  const setStatus = useSetTaskStatus();
  const setAssignee = useSetTaskAssignee();
  const addComment = useAddComment();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [comment, setComment] = useState("");

  function startEditing() {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setDueDate(toDateInputValue(task.dueDate ?? null));
    setEditing(true);
  }

  function handleSave() {
    if (!task) return;
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") return;
    const due =
      dueDate.trim() === ""
        ? null
        : dateToTimestamp(new Date(`${dueDate}T00:00:00`));
    updateTask.mutate(
      {
        taskId: task.id,
        title: trimmedTitle,
        description: description.trim(),
        priority,
        dueDate: due,
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleAddComment() {
    if (!task || comment.trim() === "") return;
    const body = comment.trim();
    setComment("");
    addComment.mutate(
      { taskId: task.id, body },
      { onError: () => setComment((cur) => (cur === "" ? body : cur)) },
    );
  }

  const assignee = task ? (task.assignee ?? null) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" data-ocid="back_button">
        <Link to="/projects">
          <ArrowLeft className="size-4" />
          Back to Projects
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : task ? (
        <>
          <PageHeader
            title={task.title}
            description={task.description || "No description provided."}
            actions={
              <div className="flex items-center gap-2">
                <TaskStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {!editing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="edit_task_button"
                    onClick={startEditing}
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                ) : null}
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main column */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg">
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {editing ? (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                          id="task-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          data-ocid="task_title_input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          data-ocid="task_description_input"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>Priority</Label>
                          <Select
                            value={priority}
                            onValueChange={(v) =>
                              setPriority(v as TaskPriority)
                            }
                          >
                            <SelectTrigger
                              className="w-full"
                              data-ocid="task_priority_select"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {priorityOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="task-due-date">Due date</Label>
                          <Input
                            id="task-due-date"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            data-ocid="task_due_date_input"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-ocid="cancel_edit_button"
                          onClick={() => setEditing(false)}
                        >
                          <X className="size-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          data-ocid="save_task_button"
                          onClick={handleSave}
                          disabled={updateTask.isPending || title.trim() === ""}
                        >
                          {updateTask.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}
                          Save changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-foreground">
                      {task.description || "No description provided."}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display text-lg">
                    <MessageSquare className="size-4 text-muted-foreground" />
                    Comments
                    <span className="text-sm font-normal text-muted-foreground">
                      {comments?.length ?? 0}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {commentsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 rounded-lg" />
                      <Skeleton className="h-16 rounded-lg" />
                    </div>
                  ) : comments && comments.length > 0 ? (
                    <ul className="space-y-4">
                      {comments.map((c, i) => {
                        const isMine =
                          currentPrincipal?.toString() === c.author.toString();
                        return (
                          <li
                            key={c.id.toString()}
                            data-ocid={`comment_item.${i}`}
                            className="flex gap-3"
                          >
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {isMine
                                  ? "You"
                                  : shortPrincipal(c.author)
                                      .slice(0, 2)
                                      .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted/30 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {isMine ? "You" : shortPrincipal(c.author)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatCommentTime(c.createdAt)}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-foreground">
                                {c.body}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No comments yet. Start the discussion.
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="comment-input">Add a comment</Label>
                    <Textarea
                      id="comment-input"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a comment…"
                      rows={3}
                      data-ocid="comment_input"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        data-ocid="add_comment_button"
                        onClick={handleAddComment}
                        disabled={addComment.isPending || comment.trim() === ""}
                      >
                        {addComment.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <MessageSquare className="size-4" />
                        )}
                        Post comment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-5 p-5">
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={task.status}
                      onValueChange={(v) =>
                        setStatus.mutate({
                          projectId: task.projectId,
                          taskId: task.id,
                          status: v as TaskStatus,
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        data-ocid="task_status_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Assignee</Label>
                    <Select
                      value={assignee ? assignee.toString() : "unassigned"}
                      onValueChange={(v) =>
                        setAssignee.mutate({
                          projectId: task.projectId,
                          taskId: task.id,
                          assignee:
                            v === "unassigned" ? null : Principal.fromText(v),
                        })
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        data-ocid="task_assignee_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {project?.members.map((m) => (
                          <SelectItem
                            key={m.user.toString()}
                            value={m.user.toString()}
                          >
                            {currentPrincipal?.toString() === m.user.toString()
                              ? "You"
                              : shortPrincipal(m.user)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Due date</span>
                      <span className="ml-auto font-medium text-foreground">
                        {formatDate(task.dueDate ?? null)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Assignee</span>
                      <span className="ml-auto font-medium text-foreground">
                        {assignee
                          ? currentPrincipal?.toString() === assignee.toString()
                            ? "You"
                            : shortPrincipal(assignee)
                          : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock4 className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Created</span>
                      <span className="ml-auto font-medium text-foreground">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">Task not found.</p>
        </div>
      )}
    </div>
  );
}
