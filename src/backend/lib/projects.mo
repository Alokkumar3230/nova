import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Result "mo:core/Result";
import Time "mo:core/Time";
import Types "../types/projects";
import TasksTypes "../types/tasks";
import TasksLib "../lib/tasks";

module {
  /// Mutable counter shared with the mixin for assigning project ids.
  public type ProjectsState = {
    var nextProjectId : Nat;
  };

  /// True if `user` is a member (any role) of `project`.
  public func isMember(project : Types.Project, user : Principal) : Bool {
    project.members.any(func m = m.user == user);
  };

  /// True if `user` is the Admin owner of `project`.
  public func isAdminOwner(project : Types.Project, user : Principal) : Bool {
    project.owner == user
      or project.members.any(func m = m.user == user and m.role == #admin);
  };

  /// Creates a new project owned by `caller` as its Admin. Returns the created
  /// project or an error.
  public func createProject(
    projects : Map.Map<Nat, Types.Project>,
    state : ProjectsState,
    tasksState : TasksTypes.TasksState,
    caller : Principal,
    name : Text,
    description : Text,
  ) : async Result.Result<Types.Project, Types.ProjectError> {
    if (name == "") { return #err(#invalidName) };
    let id = state.nextProjectId;
    state.nextProjectId += 1;
    let now = Time.now();
    let project : Types.Project = {
      id;
      name;
      description;
      status = #active;
      createdAt = now;
      owner = caller;
      members = [{ user = caller; role = #admin; joinedAt = now }];
    };
    projects.add(id, project);
    TasksLib.addActivity(tasksState, id, caller, "Project created");
    #ok(project)
  };

  /// Returns the project with the given id, if it exists.
  public func getProject(
    projects : Map.Map<Nat, Types.Project>,
    projectId : Nat,
  ) : ?Types.Project {
    projects.get(projectId)
  };

  /// Lists every project the caller belongs to (as owner or member).
  public func listMyProjects(
    projects : Map.Map<Nat, Types.Project>,
    caller : Principal,
  ) : [Types.Project] {
    projects.entries().toArray()
      .filter(func (_, p) = isMember(p, caller))
      .map(func (_, p) = p)
  };

  /// Updates a project's name, description, and/or status. Admin owner only.
  public func updateProject(
    projects : Map.Map<Nat, Types.Project>,
    tasksState : TasksTypes.TasksState,
    caller : Principal,
    projectId : Nat,
    name : Text,
    description : Text,
    status : Types.ProjectStatus,
  ) : async Result.Result<Types.Project, Types.ProjectError> {
    if (name == "") { return #err(#invalidName) };
    switch (projects.get(projectId)) {
      case null { #err(#notFound(projectId)) };
      case (?project) {
        if (not isAdminOwner(project, caller)) { return #err(#notAuthorized) };
        let updated = { project with name; description; status };
        projects.add(projectId, updated);
        TasksLib.addActivity(tasksState, projectId, caller, "Project edited");
        #ok(updated)
      };
    };
  };

  /// Deletes a project. Admin owner only.
  public func deleteProject(
    projects : Map.Map<Nat, Types.Project>,
    caller : Principal,
    projectId : Nat,
  ) : async Result.Result<(), Types.ProjectError> {
    switch (projects.get(projectId)) {
      case null { #err(#notFound(projectId)) };
      case (?project) {
        if (not isAdminOwner(project, caller)) { return #err(#notAuthorized) };
        projects.remove(projectId);
        #ok(())
      };
    };
  };

  /// Adds an existing user to the project team. Admin owner only.
  public func addMember(
    projects : Map.Map<Nat, Types.Project>,
    caller : Principal,
    projectId : Nat,
    user : Principal,
  ) : async Result.Result<(), Types.ProjectError> {
    switch (projects.get(projectId)) {
      case null { #err(#notFound(projectId)) };
      case (?project) {
        if (not isAdminOwner(project, caller)) { return #err(#notAuthorized) };
        if (isMember(project, user)) { return #err(#alreadyMember) };
        let member : Types.ProjectMember = {
          user;
          role = #member;
          joinedAt = Time.now();
        };
        let updated = { project with members = project.members.concat([member]) };
        projects.add(projectId, updated);
        #ok(())
      };
    };
  };

  /// Removes a user from the project team. Admin owner only.
  public func removeMember(
    projects : Map.Map<Nat, Types.Project>,
    caller : Principal,
    projectId : Nat,
    user : Principal,
  ) : async Result.Result<(), Types.ProjectError> {
    switch (projects.get(projectId)) {
      case null { #err(#notFound(projectId)) };
      case (?project) {
        if (not isAdminOwner(project, caller)) { return #err(#notAuthorized) };
        if (not isMember(project, user)) { return #err(#notMember) };
        let updated = { project with members = project.members.filter(func m = m.user != user) };
        projects.add(projectId, updated);
        #ok(())
      };
    };
  };

  /// Aggregates the dashboard summary for the caller's projects. Task counts,
  /// overdue figures, and per-project progress are computed from the tasks
  /// domain state.
  public func getDashboard(
    projects : Map.Map<Nat, Types.Project>,
    tasksState : TasksTypes.TasksState,
    caller : Principal,
  ) : Types.DashboardSummary {
    let mine = projects.entries().toArray()
      .filter(func (_, p) = isMember(p, caller))
      .map(func (_, p) = p);
    let now = Time.now();
    var todo = 0;
    var inProgress = 0;
    var done = 0;
    var overdue = 0;
    let progress = List.empty<Types.ProjectProgress>();
    for (p in mine.values()) {
      var totalTasks = 0;
      var doneTasks = 0;
      for ((_, t) in tasksState.tasks.entries()) {
        if (t.projectId == p.id) {
          totalTasks += 1;
          switch (t.status) {
            case (#todo) { todo += 1 };
            case (#inProgress) { inProgress += 1 };
            case (#done) { done += 1; doneTasks += 1 };
          };
          switch (t.dueDate) {
            case (?due) {
              if (due < now and t.status != #done) { overdue += 1 };
            };
            case null {};
          };
        };
      };
      let percentDone = if (totalTasks == 0) { 0 } else { (doneTasks * 100) / totalTasks };
      progress.add({
        projectId = p.id;
        name = p.name;
        status = p.status;
        totalTasks;
        doneTasks;
        percentDone;
      });
    };
    {
      totalProjects = mine.size();
      taskCounts = { todo; inProgress; done };
      overdueTasks = overdue;
      progress = progress.toArray();
    };
  };
};
