import { PocketIc, createIdentity } from "@dfinity/pic";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

// Deterministic identities give us stable, distinct principals for caller
// isolation without importing @icp-sdk/core (which is not resolvable from this
// lane's location outside the frontend package).
const owner = createIdentity("nova-owner").getPrincipal();
const member = createIdentity("nova-member").getPrincipal();
const stranger = createIdentity("nova-stranger").getPrincipal();

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
});

afterAll(async () => {
  await pic?.tearDown();
});

/**
 * Register `principal` as a signed-in NOVA user via the public role API.
 *
 * The canister persists state across every test in this file, so a principal
 * must only be registered once. A brand-new caller may assign its own role
 * without an admin check, but an already-registered caller requires admin and
 * traps with "Only admins can assign user roles" — so re-registering the same
 * principal would fail. Track which principals have been registered and skip
 * the call for those already known to the canister.
 */
const registeredUsers = new Set<string>();

async function registerUser(principal: typeof owner) {
  const key = principal.toString();
  if (registeredUsers.has(key)) return;
  actor.setPrincipal(principal);
  await actor.assignCallerUserRole(principal, { user: null });
  registeredUsers.add(key);
}

describe("NOVA backend public API", () => {
  it("answers an empty-state read instead of trapping", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    expect(await actor.listMyProjects()).toEqual([]);
  });

  it("round-trips a project through the real canister", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    const created = await actor.createProject("Website Redesign", "Rebuild the marketing site");
    expect(created).toHaveProperty("ok");
    const project = created.ok;
    expect(project.name).toBe("Website Redesign");
    expect(project.owner.toString()).toBe(owner.toString());
    expect(project.status).toEqual({ active: null });
    expect(project.members).toHaveLength(1);

    const mine = await actor.listMyProjects();
    expect(mine.map((p) => p.id)).toContain(project.id);
  });

  it("creates a task, moves it to Done, and records activity", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    const created = await actor.createProject("Task Flow", "desc");
    const projectId = created.ok.id;

    const task = await actor.createTask(
      projectId,
      "Design landing page",
      "Build the hero section",
      { medium: null },
      [],
      [],
    );
    expect(task.title).toBe("Design landing page");
    expect(task.status).toEqual({ todo: null });

    const moved = await actor.setTaskStatus(task.id, { done: null });
    expect(moved.status).toEqual({ done: null });

    const activity = await actor.listActivity(projectId);
    const actions = activity.map((e) => e.action);
    expect(actions).toContain("Task created");
    expect(actions).toContain("Task moved to Done");
  });

  it("adds a comment to a task with author and timestamp", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    const created = await actor.createProject("Comments", "desc");
    const projectId = created.ok.id;
    const task = await actor.createTask(projectId, "T", "d", { low: null }, [], []);

    const comment = await actor.addComment(task.id, "Looking good");
    expect(comment.body).toBe("Looking good");
    expect(comment.author.toString()).toBe(owner.toString());
    expect(comment.createdAt).toBeGreaterThan(0n);

    const comments = await actor.listComments(task.id);
    expect(comments.map((c) => c.body)).toContain("Looking good");
  });

  it("reassigns a task and records the activity event", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    const created = await actor.createProject("Reassign", "desc");
    const projectId = created.ok.id;
    const task = await actor.createTask(projectId, "T", "d", { high: null }, [], []);

    const reassigned = await actor.setTaskAssignee(task.id, [member]);
    expect(reassigned.assignee).toEqual([member]);

    const activity = await actor.listActivity(projectId);
    expect(activity.map((e) => e.action)).toContain("Task reassigned");
  });

  it("records a 'Project edited' activity event when the owner updates a project", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    const created = await actor.createProject("Edit Me", "original");
    const projectId = created.ok.id;

    const updated = await actor.updateProject(projectId, "Edited Name", "new desc", {
      completed: null,
    });
    expect(updated).toHaveProperty("ok");
    expect(updated.ok.name).toBe("Edited Name");
    expect(updated.ok.status).toEqual({ completed: null });

    const activity = await actor.listActivity(projectId);
    expect(activity.map((e) => e.action)).toContain("Project edited");
  });

  it("isolates callers: a non-owner member cannot edit the project", async () => {
    actor.setPrincipal(owner);
    await registerUser(owner);
    const created = await actor.createProject("Isolation", "desc");
    const projectId = created.ok.id;

    // Owner adds the member to the project team.
    await actor.addMember(projectId, member);

    // The member is a registered user but not the owner.
    actor.setPrincipal(member);
    await registerUser(member);

    const result = await actor.updateProject(projectId, "Hacked", "x", { active: null });
    expect(result).toHaveProperty("err");
    expect(result.err).toEqual({ notAuthorized: null });

    // The member can still see the project they belong to.
    const mine = await actor.listMyProjects();
    expect(mine.map((p) => p.id)).toContain(projectId);
  });

  it("rejects an unregistered caller from creating a project", async () => {
    actor.setPrincipal(stranger);
    await expect(actor.createProject("Nope", "x")).rejects.toThrow();
  });
});
