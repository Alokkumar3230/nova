import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import ProjectsLib "../lib/projects";
import Types "../types/projects";
import TasksTypes "../types/tasks";

mixin (
  accessControlState : AccessControl.AccessControlState,
  projects : Map.Map<Nat, Types.Project>,
  state : ProjectsLib.ProjectsState,
  tasksState : TasksTypes.TasksState,
) {
  /// Creates a new project owned by the caller as its Admin.
  public shared ({ caller }) func createProject(
    name : Text,
    description : Text,
  ) : async Result.Result<Types.Project, Types.ProjectError> {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can create projects");
    };
    await ProjectsLib.createProject(projects, state, tasksState, caller, name, description)
  };

  /// Returns the project with the given id, if the caller is a member.
  public query ({ caller }) func getProject(projectId : Nat) : async ?Types.Project {
    switch (ProjectsLib.getProject(projects, projectId)) {
      case null { null };
      case (?project) {
        if (ProjectsLib.isMember(project, caller)) { ?project } else { null };
      };
    };
  };

  /// Lists every project the caller belongs to (as owner or member).
  public query ({ caller }) func listMyProjects() : async [Types.Project] {
    ProjectsLib.listMyProjects(projects, caller)
  };

  /// Updates a project's name, description, and/or status. Admin owner only.
  public shared ({ caller }) func updateProject(
    projectId : Nat,
    name : Text,
    description : Text,
    status : Types.ProjectStatus,
  ) : async Result.Result<Types.Project, Types.ProjectError> {
    await ProjectsLib.updateProject(projects, tasksState, caller, projectId, name, description, status)
  };

  /// Deletes a project. Admin owner only.
  public shared ({ caller }) func deleteProject(
    projectId : Nat,
  ) : async Result.Result<(), Types.ProjectError> {
    await ProjectsLib.deleteProject(projects, caller, projectId)
  };

  /// Adds an existing user to the project team. Admin owner only.
  public shared ({ caller }) func addMember(
    projectId : Nat,
    user : Principal,
  ) : async Result.Result<(), Types.ProjectError> {
    await ProjectsLib.addMember(projects, caller, projectId, user)
  };

  /// Removes a user from the project team. Admin owner only.
  public shared ({ caller }) func removeMember(
    projectId : Nat,
    user : Principal,
  ) : async Result.Result<(), Types.ProjectError> {
    await ProjectsLib.removeMember(projects, caller, projectId, user)
  };

  /// Aggregates the dashboard summary for the caller's projects.
  public query ({ caller }) func getDashboard() : async Types.DashboardSummary {
    ProjectsLib.getDashboard(projects, tasksState, caller)
  };
};
