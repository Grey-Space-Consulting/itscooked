import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Section } from "../components/ui/Section";
import { useAuth } from "../lib/auth";

export function AuthCallback() {
  const { status, error, postLoginRedirect, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") {
      navigate(postLoginRedirect ?? "/", { replace: true });
    }
  }, [status, postLoginRedirect, navigate]);

  return (
    <div className="page stack">
      <Section
        title="Signing you in"
        subtitle="Finalizing the secure session handoff"
      >
        <Card>
          <div className="stack">
            {status === "loading" && (
              <p className="card-meta">Verifying your session...</p>
            )}
            {status === "authenticated" && (
              <p className="card-meta">Redirecting you back...</p>
            )}
            {status === "error" && (
              <p className="card-meta">
                {error ?? "We could not complete sign-in. Try again."}
              </p>
            )}
            {status === "unauthenticated" && (
              <p className="card-meta">
                We could not find an active sign-in. Restart the flow to
                continue.
              </p>
            )}
            {status === "disabled" && (
              <p className="card-meta">
                Auth is not configured yet. Set the OIDC environment values to
                enable sign-in.
              </p>
            )}
            {status !== "loading" && status !== "authenticated" && (
              <div className="hero-actions">
                <Button onClick={() => navigate("/")}>Go home</Button>
                {status === "error" && (
                  <Button variant="ghost" onClick={login}>
                    Try sign-in again
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </Section>
    </div>
  );
}
