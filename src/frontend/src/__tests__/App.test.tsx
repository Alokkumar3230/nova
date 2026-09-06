import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { Principal } from "@icp-sdk/core/principal";
import { makeDashboard, makeMockActor } from "./mockActor";
import {
  mockActorState,
  mockIdentityState,
  resetMocks,
  setActor,
  setAuthenticated,
  setUnauthenticated,
} from "./mockInfrastructure";
import { renderWithQuery } from "./render";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => mockIdentityState,
  useActor: () => mockActorState,
}));

vi.mock("@/backend", () => ({
  createActor: vi.fn(),
}));

/**
 * Route-protection coverage for the App-level `RequireAuth` guard. The guard
 * lives inside App.tsx and wraps every protected route, so the only way to
 * observe it is to render the real router and navigate to a protected path.
 */
describe("App route protection", () => {
  beforeEach(() => {
    resetMocks();
    window.history.replaceState({}, "", "/");
  });

  it("renders the sign-in screen instead of a blank page when unauthenticated", async () => {
    setUnauthenticated();
    setActor(makeMockActor({ getDashboard: async () => makeDashboard() }));
    renderWithQuery(<App />);

    // The default route redirects to /dashboard, which is protected. An
    // unauthenticated user must see the sign-in screen, not a blank page.
    expect(
      await screen.findAllByRole("button", {
        name: /sign in with internet identity/i,
      }),
    ).not.toHaveLength(0);
  });

  it("renders the protected dashboard for an authenticated user", async () => {
    setAuthenticated(Principal.fromText("aaaaa-aa"));
    setActor(
      makeMockActor({
        getDashboard: async () =>
          makeDashboard({
            totalProjects: 2n,
            taskCounts: { todo: 1n, inProgress: 0n, done: 0n },
            overdueTasks: 0n,
          }),
      }),
    );
    renderWithQuery(<App />);

    expect(await screen.findByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
