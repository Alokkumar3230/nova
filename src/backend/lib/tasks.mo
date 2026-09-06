import Int "mo:core/Int";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Types "../types/tasks";

module {
  /// Appends an activity event for `projectId` to the per-project activity log.
  public func addActivity(
    state : Types.TasksState,
    projectId : Nat,
    actorPrincipal : Principal,
    action : Text,
  ) {
    let id = state.nextActivityId;
    state.nextActivityId += 1;
    let event : Types.ActivityEvent = {
      id;
      projectId;
      actorPrincipal;
      action;
      createdAt = Time.now();
    };
    let existing = state.activity.get(projectId) ?? List.empty<Types.ActivityEvent>();
    existing.add(event);
    state.activity.add(projectId, existing);
  };

  /// Returns the task with the given id, trapping when it does not exist.
  func getTaskOrTrap(state : Types.TasksState, taskId : Nat) : Types.Task {
    state.tasks.get(taskId) ?? Runtime.trap("Task not found");
  };

  public func createTask(
    state : Types.TasksState,
    actorPrincipal : Principal,
    projectId : Nat,
    title : Text,
    description : Text,
    priority : Types.TaskPriority,
    assignee : ?Principal,
    dueDate : ?Int,
  ) : Types.Task {
    let now = Time.now();
    let id = state.nextTaskId;
    state.nextTaskId += 1;
    let task : Types.Task = {
      id;
      projectId;
      title;
      description;
      status = #todo;
      priority;
      assignee;
      dueDate;
      createdAt = now;
      updatedAt = now;
    };
    state.tasks.add(id, task);
    addActivity(state, projectId, actorPrincipal, "Task created");
    task
  };

  public func getTask(state : Types.TasksState, taskId : Nat) : ?Types.Task {
    state.tasks.get(taskId);
  };

  public func listTasks(state : Types.TasksState, projectId : Nat) : [Types.Task] {
    let result = List.empty<Types.Task>();
    for ((_, task) in state.tasks.entries()) {
      if (task.projectId == projectId) {
        result.add(task);
      };
    };
    result.toArray();
  };

  public func updateTask(
    state : Types.TasksState,
    taskId : Nat,
    title : Text,
    description : Text,
    priority : Types.TaskPriority,
    dueDate : ?Int,
  ) : Types.Task {
    let task = getTaskOrTrap(state, taskId);
    let updated : Types.Task = {
      task with
      title;
      description;
      priority;
      dueDate;
      updatedAt = Time.now();
    };
    state.tasks.add(taskId, updated);
    updated
  };

  public func deleteTask(state : Types.TasksState, taskId : Nat) {
    state.tasks.remove(taskId);
    state.comments.remove(taskId);
  };

  public func setTaskStatus(
    state : Types.TasksState,
    actorPrincipal : Principal,
    taskId : Nat,
    status : Types.TaskStatus,
  ) : Types.Task {
    let task = getTaskOrTrap(state, taskId);
    let updated : Types.Task = {
      task with
      status;
      updatedAt = Time.now();
    };
    state.tasks.add(taskId, updated);
    if (status == #done) {
      addActivity(state, task.projectId, actorPrincipal, "Task moved to Done");
    };
    updated
  };

  public func setTaskAssignee(
    state : Types.TasksState,
    actorPrincipal : Principal,
    taskId : Nat,
    assignee : ?Principal,
  ) : Types.Task {
    let task = getTaskOrTrap(state, taskId);
    let updated : Types.Task = {
      task with
      assignee;
      updatedAt = Time.now();
    };
    state.tasks.add(taskId, updated);
    addActivity(state, task.projectId, actorPrincipal, "Task reassigned");
    updated
  };

  public func addComment(
    state : Types.TasksState,
    actorPrincipal : Principal,
    taskId : Nat,
    body : Text,
  ) : Types.Comment {
    ignore getTaskOrTrap(state, taskId);
    let id = state.nextCommentId;
    state.nextCommentId += 1;
    let comment : Types.Comment = {
      id;
      taskId;
      author = actorPrincipal;
      body;
      createdAt = Time.now();
    };
    let existing = state.comments.get(taskId) ?? List.empty<Types.Comment>();
    existing.add(comment);
    state.comments.add(taskId, existing);
    comment
  };

  public func listComments(state : Types.TasksState, taskId : Nat) : [Types.Comment] {
    let existing = state.comments.get(taskId) ?? List.empty<Types.Comment>();
    existing.toArray();
  };

  public func listActivity(state : Types.TasksState, projectId : Nat) : [Types.ActivityEvent] {
    let existing = state.activity.get(projectId) ?? List.empty<Types.ActivityEvent>();
    let arr = existing.toArray();
    arr.sort(func (a, b) = Int.compare(b.createdAt, a.createdAt));
  };
};
