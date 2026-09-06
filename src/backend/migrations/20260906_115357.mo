import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type TaskStatus = {
    #todo;
    #inProgress;
    #done;
  };

  type TaskPriority = {
    #low;
    #medium;
    #high;
  };

  type Task = {
    id : Nat;
    projectId : Nat;
    title : Text;
    description : Text;
    status : TaskStatus;
    priority : TaskPriority;
    assignee : ?Principal;
    dueDate : ?Int;
    createdAt : Int;
    updatedAt : Int;
  };

  type Comment = {
    id : Nat;
    taskId : Nat;
    author : Principal;
    body : Text;
    createdAt : Int;
  };

  type ActivityEvent = {
    id : Nat;
    projectId : Nat;
    actorPrincipal : Principal;
    action : Text;
    createdAt : Int;
  };

  type ProjectStatus = {
    #active;
    #completed;
    #archived;
  };

  type ProjectRole = {
    #admin;
    #member;
  };

  type ProjectMember = {
    user : Principal;
    role : ProjectRole;
    joinedAt : Int;
  };

  type Project = {
    id : Nat;
    name : Text;
    description : Text;
    status : ProjectStatus;
    createdAt : Int;
    owner : Principal;
    members : [ProjectMember];
  };

  type ProjectsState = {
    var nextProjectId : Nat;
  };

  type TasksState = {
    var nextTaskId : Nat;
    var nextCommentId : Nat;
    var nextActivityId : Nat;
    tasks : Map.Map<Nat, Task>;
    comments : Map.Map<Nat, List.List<Comment>>;
    activity : Map.Map<Nat, List.List<ActivityEvent>>;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControlState;
    tasksState : TasksState;
    projects : Map.Map<Nat, Project>;
    projectsState : ProjectsState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      tasksState = {
        var nextTaskId = 0;
        var nextCommentId = 0;
        var nextActivityId = 0;
        tasks = Map.empty();
        comments = Map.empty();
        activity = Map.empty();
      };
      projects = Map.empty();
      projectsState = {
        var nextProjectId = 0;
      };
    };
  };
};
