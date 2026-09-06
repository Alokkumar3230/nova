import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import IntValue "mo:caffeineai-oql/IntValue";
import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Types "../types/projects";
import TasksTypes "../types/tasks";

module {
  /// Flattens the per-task comment lists into a single array of comments.
  func flattenComments(
    comments : Map.Map<Nat, List.List<TasksTypes.Comment>>,
  ) : [TasksTypes.Comment] {
    let out = List.empty<TasksTypes.Comment>();
    for ((_, list) in comments.entries()) {
      for (c in list.values()) { out.add(c) };
    };
    out.toArray();
  };

  /// Flattens the per-project activity lists into a single array of events.
  func flattenActivity(
    activity : Map.Map<Nat, List.List<TasksTypes.ActivityEvent>>,
  ) : [TasksTypes.ActivityEvent] {
    let out = List.empty<TasksTypes.ActivityEvent>();
    for ((_, list) in activity.entries()) {
      for (e in list.values()) { out.add(e) };
    };
    out.toArray();
  };

  /// Maps a project status to its OQL string representation.
  func projectStatusText(p : Types.Project) : Text {
    switch (p.status) {
      case (#active) "active";
      case (#completed) "completed";
      case (#archived) "archived";
    };
  };

  /// Maps a task status to its OQL string representation.
  func taskStatusText(t : TasksTypes.Task) : Text {
    switch (t.status) {
      case (#todo) "todo";
      case (#inProgress) "inProgress";
      case (#done) "done";
    };
  };

  /// Maps a task priority to its OQL string representation.
  func taskPriorityText(t : TasksTypes.Task) : Text {
    switch (t.priority) {
      case (#low) "low";
      case (#medium) "medium";
      case (#high) "high";
    };
  };

  /// Maps a task assignee to its OQL string representation (empty when unassigned).
  func assigneeText(t : TasksTypes.Task) : Text {
    switch (t.assignee) {
      case (?p) p.toText();
      case null "";
    };
  };

  /// Maps a task due date to its OQL numeric representation (0 when unset).
  func dueDateInt(t : TasksTypes.Task) : Int {
    switch (t.dueDate) {
      case (?v) v;
      case null 0;
    };
  };

  /// Builds the OQL entity declarations over NOVA's persisted data. Each
  /// entity is exposed `.controllerOnly()`: private to end users, readable by
  /// the platform's Data Intelligence agent (which calls as the controller).
  public func entities(
    projects : Map.Map<Nat, Types.Project>,
    tasksState : TasksTypes.TasksState,
  ) : [Entity.Decl] {
    let anyP = Principal.fromText("aaaaa-aa");

    let projectEntity = projects.toEntityManual("project", "Project", "id")
      .sample({ id = 0; name = ""; description = ""; status = #active; createdAt = 0; owner = anyP; members = [] })
      .payload("id", func p = p.id)
      .payload("name", func p = p.name)
      .payload("description", func p = p.description)
      .payload("status", projectStatusText)
      .payload("createdAt", func p = p.createdAt)
      .payload("owner", func p = p.owner)
      .payload("memberCount", func p = p.members.size())
      .controllerOnly()
      .build();

    let taskEntity = tasksState.tasks.toEntityManual("task", "Task", "id")
      .sample({ id = 0; projectId = 0; title = ""; description = ""; status = #todo; priority = #low; assignee = null : ?Principal; dueDate = null : ?Int; createdAt = 0; updatedAt = 0 })
      .payload("id", func t = t.id)
      .payload("projectId", func t = t.projectId)
      .payload("title", func t = t.title)
      .payload("description", func t = t.description)
      .payload("status", taskStatusText)
      .payload("priority", taskPriorityText)
      .payload("assignee", assigneeText)
      .payload("dueDate", dueDateInt)
      .payload("createdAt", func t = t.createdAt)
      .payload("updatedAt", func t = t.updatedAt)
      .controllerOnly()
      .build();

    let commentEntity = Entity.new<TasksTypes.Comment>(
      "comment",
      func () = flattenComments(tasksState.comments).values(),
      "Comment",
      "id",
    )
      .sample({ id = 0; taskId = 0; author = anyP; body = ""; createdAt = 0 })
      .controllerOnly()
      .build();

    let activityEntity = Entity.new<TasksTypes.ActivityEvent>(
      "activity",
      func () = flattenActivity(tasksState.activity).values(),
      "ActivityEvent",
      "id",
    )
      .sample({ id = 0; projectId = 0; actorPrincipal = anyP; action = ""; createdAt = 0 })
      .controllerOnly()
      .build();

    [projectEntity, taskEntity, commentEntity, activityEntity];
  };
};
