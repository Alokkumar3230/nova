import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Map "mo:core/Map";
import TasksTypes "types/tasks";
import TasksApi "mixins/tasks-api";
import ProjectsTypes "types/projects";
import ProjectsLib "lib/projects";
import ProjectsApi "mixins/projects-api";
import OqlLib "lib/oql";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let tasksState : TasksTypes.TasksState;
  let projects : Map.Map<Nat, ProjectsTypes.Project>;
  let projectsState : ProjectsLib.ProjectsState;
  include MixinAuthorization(accessControlState, null);
  include TasksApi(accessControlState, tasksState, projects);
  include ProjectsApi(accessControlState, projects, projectsState, tasksState);
  include Expose({ entities = OqlLib.entities(projects, tasksState) });
  include ApiDocMixin();
};
