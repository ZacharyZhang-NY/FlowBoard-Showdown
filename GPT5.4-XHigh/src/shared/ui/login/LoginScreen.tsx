"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Form, InlineNotification, PasswordInput, TextInput } from "@carbon/react";

import { authClient } from "@/src/lib/auth-client";

async function waitForAuthenticatedSession(): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const sessionResult = await authClient.getSession();
    if (sessionResult.data) {
      return;
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 100);
    });
  }

  throw new Error("Session establishment timed out");
}

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirectTo") ?? "/dashboard", [searchParams]);
  const [email, setEmail] = useState("test@zacharyzhang.com");
  const [password, setPassword] = useState("Test@TestModels");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    void authClient
      .getSession()
      .then((sessionResult) => {
        if (!active || !sessionResult?.data) {
          return;
        }

        router.replace(redirectTo);
        router.refresh();
      })
      .catch(() => {
        return;
      });

    return () => {
      active = false;
    };
  }, [redirectTo, router]);

  const submitCredentials = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Authentication failed");
        return;
      }

      await waitForAuthenticatedSession();
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isSubmitting, password, redirectTo, router]);

  const handlePasswordKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void submitCredentials();
  };

  return (
    <main className="flowboard-login">
      <section className="flowboard-login__panel">
        <div className="flowboard-login__brand">
          <p className="flowboard-eyebrow">FlowBoard</p>
          <h1>Sign in</h1>
          <p>Use the seeded account to access the workspace.</p>
        </div>
        <Form className="flowboard-login__form">
          {errorMessage ? (
            <InlineNotification
              data-testid="signin-error"
              hideCloseButton
              kind="error"
              lowContrast
              subtitle={errorMessage}
              title="Sign in failed"
            />
          ) : null}
          <TextInput
            id="email"
            labelText="Email"
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            type="email"
            value={email}
          />
          <PasswordInput
            id="password"
            labelText="Password"
            onKeyDown={handlePasswordKeyDown}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            value={password}
          />
          <Button
            disabled={isSubmitting}
            kind="primary"
            onClick={() => {
              void submitCredentials();
            }}
            type="button"
          >
            {isSubmitting ? "Signing in" : "Sign in"}
          </Button>
        </Form>
      </section>
    </main>
  );
}
