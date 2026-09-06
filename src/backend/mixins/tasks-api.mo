import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Types "../types/tasks";
import ProjectsTypes "../types/projects";
import TasksLib "../lib/tasks";

mixin (
  accessControlState : AccessControl.AccessControlState,
  state : Types.TasksState,
  projects : Map.Map<Nat, ProjectsTypes.Project>,
) {
  /// Requires the caller to be a signed-in user (or admin). Traps otherwise.
  func requireUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  /// Whether the caller is the Admin owner of the project, derived from the
  /// project record (the projects domain owns the authoritative owner).
  func isProjectOwner(caller : Principal, projectId : Nat) : Bool {
    switch (projects.get(projectId)) {
      case (?project) { project.owner == caller };
      case null { false };
    };
  };

  /// Whether the caller is a member of the project (the project's members list).
  /// Only project members may view or create tasks, comments, and activity.
  func isProjectMember(caller : Principal, projectId : Nat) : Bool {
    switch (projects.get(projectId)) {
      case (?project) {
        project.members.any(func member = member.user == caller);
      };
      case null { false };
    };
  };

  /// Traps unless the caller is a member of the project.
  func requireProjectMember(caller : Principal, projectId : Nat) {
    if (not isProjectMember(caller, projectId)) {
      Runtime.trap("Unauthorized: Only project members can access this project's tasks");
    };
  };

  /// Whether the caller may modify a task: the project owner, or the task's
  /// assignee (a member working on their assigned task).
  func canModifyTask(caller : Principal, task : Types.Task) : Bool {
    let isAssignee = switch (task.assignee) {
      case (?a) { a == caller };
      case null { false };
    };
    isProjectOwner(caller, task.projectId) or isAssignee;
  };

  public shared ({ caller }) func createTask(
    projectId : Nat,
    title : Text,
    description : Text,
    priority : Types.TaskPriority,
    assignee : ?Principal,
    dueDate : ?Int,
  ) : async Types.Task {
    requireUser(caller);
    requireProjectMember(caller, projectId);
    TasksLib.createTask(state, caller, projectId, title, description, priority, assignee, dueDate);
  };

  public query ({ caller }) func getTask(taskId : Nat) : async ?Types.Task {
    requireUser(caller);
    switch (TasksLib.getTask(state, taskId)) {
      case (?task) {
        requireProjectMember(caller, task.projectId);
        ?task;
      };
      case null { null };
    };
  };

  public query ({ caller }) func listTasks(projectId : Nat) : async [Types.Task] {
    requireUser(caller);
    requireProjectMember(caller, projectId);
    TasksLib.listTasks(state, projectId);
  };

  public shared ({ caller }) func updateTask(
    taskId : Nat,
    title : Text,
    description : Text,
    priority : Types.TaskPriority,
    dueDate : ?Int,
  ) : async Types.Task {
    requireUser(caller);
    let task = TasksLib.getTask(state, taskId) ?? Runtime.trap("Task not found");
    if (not canModifyTask(caller, task)) {
      Runtime.trap("Unauthorized: Only the project owner or assignee can update this task");
    };
    TasksLib.updateTask(state, taskId, title, description, priority, dueDate);
  };

  public shared ({ caller }) func deleteTask(taskId : Nat) : async () {
    requireUser(caller);
    let task = TasksLib.getTask(state, taskId) ?? Runtime.trap("Task not found");
    if (not isProjectOwner(caller, task.projectId)) {
      Runtime.trap("Unauthorized: Only the project Admin owner can delete tasks");
    };
    TasksLib.deleteTask(state, taskId);
  };

  public shared ({ caller }) func setTaskStatus(taskId : Nat, status : Types.TaskStatus) : async Types.Task {
    requireUser(caller);
    let task = TasksLib.getTask(state, taskId) ?? Runtime.trap("Task not found");
    if (not canModifyTask(caller, task)) {
      Runtime.trap("Unauthorized: Only the project owner or assignee can update this task");
    };
    TasksLib.setTaskStatus(state, caller, taskId, status);
  };

  public shared ({ caller }) func setTaskAssignee(taskId : Nat, assignee : ?Principal) : async Types.Task {
    requireUser(caller);
    let task = TasksLib.getTask(state, taskId) ?? Runtime.trap("Task not found");
    if (not canModifyTask(caller, task)) {
      Runtime.trap("Unauthorized: Only the project owner or assignee can update this task");
    };
    TasksLib.setTaskAssignee(state, caller, taskId, assignee);
  };

  public shared ({ caller }) func addComment(taskId : Nat, body : Text) : async Types.Comment {
    requireUser(caller);
    let task = TasksLib.getTask(state, taskId) ?? Runtime.trap("Task not found");
    requireProjectMember(caller, task.projectId);
    TasksLib.addComment(state, caller, taskId, body);
  };

  public query ({ caller }) func listComments(taskId : Nat) : async [Types.Comment] {
    requireUser(caller);
    switch (TasksLib.getTask(state, taskId)) {
      case (?task) {
        requireProjectMember(caller, task.projectId);
        TasksLib.listComments(state, taskId);
      };
      case null { [] };
    };
  };

  public query ({ caller }) func listActivity(projectId : Nat) : async [Types.ActivityEvent] {
    requireUser(caller);
    requireProjectMember(caller, projectId);
    TasksLib.listActivity(state, projectId);
  };
};
