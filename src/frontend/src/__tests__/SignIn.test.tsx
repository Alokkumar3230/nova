import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SignIn } from "@/pages/SignIn";
import { Principal } from "@icp-sdk/core/principal";
import {
  mockIdentityState,
  resetMocks,
  setAuthenticated,
} from "./mockInfrastructure";
import { makeIdentity } from "./mockInfrastructure";
import { renderWithQuery } from "./render";

vi.mock("@caffeineai/core-infrastructure", () => ({
  useInternetIdentity: () => mockIdentityState,
  useActor: () => ({ actor: null, isFetching: false }),
}));

const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

describe("SignIn", () => {
  beforeEach(() => {
    resetMocks();
    navigateMock.mockReset();
  });

  it("renders the sign-in button and NOVA branding", () => {
    renderWithQuery(<SignIn />);
    expect(
      screen.getAllByRole("button", { name: /sign in with internet identity/i })
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("NOVA").length).toBeGreaterThan(0);
  });

  it("calls login when the sign-in button is clicked", () => {
    renderWithQuery(<SignIn />);
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /sign in with internet identity/i,
      })[0],
    );
    expect(mockIdentityState.login).toHaveBeenCalled();
  });

  it("navigates to the dashboard once authenticated", () => {
    setAuthenticated(Principal.fromText("aaaaa-aa"));
    renderWithQuery(<SignIn />);
    expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard" });
  });

  it("shows an error message when login fails", () => {
    mockIdentityState.isLoginError = true;
    mockIdentityState.loginError = new Error("Sign-in failed");
    renderWithQuery(<SignIn />);
    expect(screen.getByText("Sign-in failed")).toBeInTheDocument();
  });
});
