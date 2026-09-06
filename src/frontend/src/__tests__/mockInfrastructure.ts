import type { NovaActor } from "@/types";
import type { Principal } from "@icp-sdk/core/principal";
import { vi } from "vitest";

/**
 * Shared mock state for the `@caffeineai/core-infrastructure` hooks used by the
 * NOVA pages. Tests set the current identity/actor before rendering.
 */

export interface MockIdentity {
  getPrincipal(): Principal;
}

export function makeIdentity(principal: Principal): MockIdentity {
  return { getPrincipal: () => principal };
}

export interface MockActorState {
  actor: NovaActor | null;
  isFetching: boolean;
}

export const mockActorState: MockActorState = {
  actor: null,
  isFetching: false,
};

export const mockIdentityState: {
  identity: MockIdentity | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  isLoginError: boolean;
  loginError: Error | undefined;
  login: ReturnType<typeof vi.fn>;
  clear: ReturnType<typeof vi.fn>;
} = {
  identity: null,
  isAuthenticated: false,
  isLoggingIn: false,
  isLoginError: false,
  loginError: undefined,
  login: vi.fn(),
  clear: vi.fn(),
};

export function setAuthenticated(principal: Principal) {
  mockIdentityState.identity = makeIdentity(principal);
  mockIdentityState.isAuthenticated = true;
}

export function setUnauthenticated() {
  mockIdentityState.identity = null;
  mockIdentityState.isAuthenticated = false;
}

export function setActor(actor: NovaActor) {
  mockActorState.actor = actor;
  mockActorState.isFetching = false;
}

export function resetMocks() {
  setUnauthenticated();
  mockActorState.actor = null;
  mockActorState.isFetching = false;
  mockIdentityState.isLoggingIn = false;
  mockIdentityState.isLoginError = false;
  mockIdentityState.loginError = undefined;
  mockIdentityState.login.mockReset();
  mockIdentityState.clear.mockReset();
}
