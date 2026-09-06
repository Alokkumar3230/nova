import List "mo:core/List";
import Map "mo:core/Map";

module {
  public type TaskStatus = {
    #todo;
    #inProgress;
    #done;
  };

  public type TaskPriority = {
    #low;
    #medium;
    #high;
  };

  public type Task = {
    id : Nat;
    projectId : Nat;
    title : Text;
    description : Text;
    status : TaskStatus;
    priority : TaskPriority;
    assignee : ?Principal;
    dueDate : ?Int; // nanoseconds since epoch; null = no due date
    createdAt : Int; // nanoseconds since epoch
    updatedAt : Int; // nanoseconds since epoch
  };

  public type Comment = {
    id : Nat;
    taskId : Nat;
    author : Principal;
    body : Text;
    createdAt : Int; // nanoseconds since epoch
  };

  public type ActivityEvent = {
    id : Nat;
    projectId : Nat;
    actorPrincipal : Principal;
    action : Text;
    createdAt : Int; // nanoseconds since epoch
  };

  /// Mutable state backing the tasks domain. Declared once in main.mo and
  /// injected into the tasks mixin; initial values come from the migration chain.
  public type TasksState = {
    var nextTaskId : Nat;
    var nextCommentId : Nat;
    var nextActivityId : Nat;
    tasks : Map.Map<Nat, Task>;
    comments : Map.Map<Nat, List.List<Comment>>;
    activity : Map.Map<Nat, List.List<ActivityEvent>>;
  };
};
