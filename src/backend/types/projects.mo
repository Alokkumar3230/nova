module {
  /// Lifecycle state of a project.
  public type ProjectStatus = {
    #active;
    #completed;
    #archived;
  };

  /// Role a user holds within a project. The project creator is its Admin owner.
  public type ProjectRole = {
    #admin;
    #member;
  };

  /// A user's membership in a project.
  public type ProjectMember = {
    user : Principal;
    role : ProjectRole;
    joinedAt : Int;
  };

  /// A project entity. `members` is an immutable snapshot of the current team.
  public type Project = {
    id : Nat;
    name : Text;
    description : Text;
    status : ProjectStatus;
    createdAt : Int;
    owner : Principal;
    members : [ProjectMember];
  };

  /// Public profile of a NOVA user, used when adding members from the user list.
  public type UserProfile = {
    principal : Principal;
    name : Text;
    email : Text;
  };

  /// Counts of tasks by status across a user's projects (task data lives in the
  /// tasks domain; this is the aggregation shape the dashboard consumes).
  public type TaskStatusCounts = {
    todo : Nat;
    inProgress : Nat;
    done : Nat;
  };

  /// Per-project completion progress (percent of tasks marked Done).
  public type ProjectProgress = {
    projectId : Nat;
    name : Text;
    status : ProjectStatus;
    totalTasks : Nat;
    doneTasks : Nat;
    percentDone : Nat;
  };

  /// Aggregate view backing the dashboard.
  public type DashboardSummary = {
    totalProjects : Nat;
    taskCounts : TaskStatusCounts;
    overdueTasks : Nat;
    progress : [ProjectProgress];
  };

  /// Errors surfaced by project operations.
  public type ProjectError = {
    #notFound : Nat;
    #notAuthorized;
    #notMember;
    #alreadyMember;
    #invalidName;
  };
};
