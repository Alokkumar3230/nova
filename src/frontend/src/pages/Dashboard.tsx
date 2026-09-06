import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock4,
  FolderKanban,
  LayoutDashboard,
  Loader2,
} from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetDashboard } from "@/hooks/useQueries";

export function Dashboard() {
  const { data, isLoading } = useGetDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your projects and task progress."
        actions={
          <Button asChild data-ocid="new_project_button">
            <Link to="/projects">
              <FolderKanban className="size-4" />
              View Projects
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {["a", "b", "c", "d", "e"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Total Projects"
              value={Number(data.totalProjects)}
              icon={FolderKanban}
            />
            <StatCard
              label="To Do"
              value={Number(data.taskCounts.todo)}
              icon={Circle}
            />
            <StatCard
              label="In Progress"
              value={Number(data.taskCounts.inProgress)}
              icon={Loader2}
            />
            <StatCard
              label="Done"
              value={Number(data.taskCounts.done)}
              icon={CheckCircle2}
            />
            <StatCard
              label="Overdue"
              value={Number(data.overdueTasks)}
              icon={Clock4}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Project Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.progress.length === 0 ? (
                <EmptyState
                  icon={FolderKanban}
                  title="No projects yet"
                  description="Create your first project to start tracking tasks and progress."
                  action={
                    <Button asChild data-ocid="dashboard_empty_create_button">
                      <Link to="/projects">
                        <FolderKanban className="size-4" />
                        Create a project
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {data.progress.map((p) => (
                    <Link
                      key={p.projectId.toString()}
                      to="/projects/$projectId"
                      params={{ projectId: p.projectId.toString() }}
                      data-ocid={`dashboard_project_${p.projectId.toString()}`}
                      className="group flex flex-col gap-2 rounded-lg border border-border bg-background p-4 transition-smooth hover:shadow-elevated"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground group-hover:text-primary">
                          {p.name}
                        </span>
                        <ProjectStatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar
                          value={Number(p.percentDone)}
                          className="flex-1"
                        />
                        <span className="font-mono text-xs text-muted-foreground">
                          {Number(p.doneTasks)}/{Number(p.totalTasks)} ·{" "}
                          {Number(p.percentDone)}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <LayoutDashboard className="size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to load your dashboard.
          </p>
          <Button asChild data-ocid="dashboard_sign_in_link">
            <Link to="/sign-in">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: typeof FolderKanban;
}) {
  return (
    <Card data-ocid="stat_card">
      <CardContent className="flex items-center gap-4 p-5">
        {Icon ? (
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div>
          <p className="font-display text-2xl font-bold text-foreground">
            {value}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
