import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { Fingerprint, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Users,
    title: "Collaborate in real time",
    description:
      "Plan projects, assign tasks, and keep your whole team aligned.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description: "Sign in with Internet Identity — no passwords, full control.",
  },
  {
    icon: Sparkles,
    title: "Deliver with clarity",
    description:
      "From idea to done, NOVA keeps every step visible and on track.",
  },
] as const;

export function SignIn() {
  const { login, isAuthenticated, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-12 text-foreground">
      {/* Ambient background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 size-[30rem] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,16,32,0.6)_100%)]" />
      </div>

      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Brand panel */}
        <div className="hidden flex-col gap-8 lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-lg shadow-primary/30">
              <Sparkles className="size-6" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              NOVA
            </span>
          </div>

          <div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white">
              Plan. Collaborate.
              <br />
              <span className="text-gradient">Deliver.</span>
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
              The workspace where your team turns ideas into shipped work — with
              projects, tasks, and progress all in one calm, focused place.
            </p>
          </div>

          <ul className="space-y-5">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                  <feature.icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium text-white">{feature.title}</p>
                  <p className="text-sm text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Sign-in card */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
              <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                <Sparkles className="size-6" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                  <span className="text-gradient">NOVA</span>
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  Plan. Collaborate. Deliver.
                </p>
              </div>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="font-display text-xl font-semibold text-white">
                Welcome back
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Sign in to your NOVA workspace to continue.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                data-ocid="sign_in_button"
                className="h-12 w-full gap-2.5 text-base"
                size="lg"
                disabled={isLoggingIn}
                onClick={() => login()}
              >
                <Fingerprint className="size-5" />
                {isLoggingIn ? "Signing in…" : "Sign in with Internet Identity"}
              </Button>

              {isLoginError ? (
                <p
                  data-ocid="sign_in_error"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive"
                >
                  {loginError?.message ?? "Sign-in failed. Please try again."}
                </p>
              ) : null}

              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  Secure
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-xs leading-relaxed text-slate-400">
                Your first sign-in automatically creates your NOVA account.
                Internet Identity keeps you in control — no passwords to
                remember.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} NOVA. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
