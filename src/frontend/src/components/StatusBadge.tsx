import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus, TaskStatus } from "@/types";

const projectStatusStyles: Record<ProjectStatus, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  archived: "bg-muted text-muted-foreground border-border",
};

const projectStatusLabels: Record<ProjectStatus, string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

const taskStatusStyles: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  inProgress: "bg-warning/10 text-warning border-warning/20",
  done: "bg-success/10 text-success border-success/20",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "To Do",
  inProgress: "In Progress",
  done: "Done",
};

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      data-ocid="project_status_badge"
      className={cn(projectStatusStyles[status], className)}
    >
      {projectStatusLabels[status]}
    </Badge>
  );
}

export function TaskStatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      data-ocid="task_status_badge"
      className={cn(taskStatusStyles[status], className)}
    >
      {taskStatusLabels[status]}
    </Badge>
  );
}
