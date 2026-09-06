import { Link } from "@tanstack/react-router";
import { FolderKanban, Plus, User } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { ProjectStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  isProjectOk,
  useCreateProject,
  useGetDashboard,
  useListMyProjects,
} from "@/hooks/useQueries";

/** Shorten a principal id for compact display, e.g. "aaaaa-aa...-aaa". */
function shortPrincipal(principal: string): string {
  if (principal.length <= 13) return principal;
  return `${principal.slice(0, 5)}...${principal.slice(-3)}`;
}

export function Projects() {
  const { data, isLoading } = useListMyProjects();
  const { data: dashboard } = useGetDashboard();
  const createProject = useCreateProject();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const progressByProject = new Map(
    (dashboard?.progress ?? []).map((p) => [
      p.projectId.toString(),
      Number(p.percentDone),
    ]),
  );

  const canSubmit = name.trim().length > 0 && !createProject.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const capturedName = name.trim();
    const capturedDescription = description.trim();
    setName("");
    setDescription("");
    createProject.mutate(
      { name: capturedName, description: capturedDescription },
      {
        onSuccess: (result) => {
          if (isProjectOk(result)) {
            setOpen(false);
          }
        },
        onError: () => {
          setName((current) => (current === "" ? capturedName : current));
          setDescription((current) =>
            current === "" ? capturedDescription : current,
          );
        },
      },
    );
  }

  const createDialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent data-ocid="create_project_modal">
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Give your project a name and a short description to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              data-ocid="project_name_input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Website Redesign"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              data-ocid="project_description_input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
            />
          </div>
          {createProject.isError ? (
            <p
              data-ocid="create_project_error"
              className="text-sm text-destructive"
            >
              {createProject.error instanceof Error
                ? createProject.error.message
                : "Something went wrong creating the project."}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              data-ocid="cancel_button"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="submit_button"
              disabled={!canSubmit}
            >
              {createProject.isPending ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="All projects you belong to."
        actions={
          <Button data-ocid="new_project_button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            New Project
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["a", "b", "c", "d", "e", "f"].map((k) => (
            <Skeleton key={k} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((project, index) => {
            const percent = progressByProject.get(project.id.toString()) ?? 0;
            return (
              <Link
                key={project.id.toString()}
                to="/projects/$projectId"
                params={{ projectId: project.id.toString() }}
                data-ocid={`project_card_${index}`}
                className="group"
              >
                <Card className="h-full transition-smooth hover:shadow-elevated">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FolderKanban className="size-5" />
                      </span>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary">
                        {project.name}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {project.description || "No description provided."}
                      </p>
                    </div>
                    <div className="mt-auto space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="size-3.5" />
                        <span className="truncate">
                          {shortPrincipal(project.owner.toString())}
                        </span>
                        <span className="ml-auto shrink-0 font-mono">
                          {project.members.length} member
                          {project.members.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <ProgressBar value={percent} className="flex-1" />
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start planning and collaborating."
          action={
            <Button
              data-ocid="empty_new_project_button"
              onClick={() => setOpen(true)}
            >
              <Plus className="size-4" />
              New Project
            </Button>
          }
        />
      )}

      {createDialog}
    </div>
  );
}
