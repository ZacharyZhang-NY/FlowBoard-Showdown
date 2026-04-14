"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  TextInput,
  PasswordInput,
  Button,
  InlineNotification,
  Tile,
} from "@carbon/react";
import { Dashboard } from "@carbon/icons-react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (res.error) {
        setError(res.error.message || "Invalid credentials");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cds-background)",
      }}
    >
      <Tile style={{ width: "100%", maxWidth: 400, padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "var(--cds-background-inverse)",
              color: "var(--cds-text-inverse)",
              marginBottom: "1rem",
            }}
          >
            <Dashboard size={32} />
          </div>
          <h1 className="cds--type-productive-heading-04" style={{ marginBottom: "0.5rem" }}>
            FlowBoard
          </h1>
          <p className="cds--type-body-long-01" style={{ color: "var(--cds-text-secondary)" }}>
            Team project management, simplified.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem" }}>
            <InlineNotification
              kind="error"
              title="Login failed"
              subtitle={error}
              hideCloseButton
            />
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <TextInput
            id="email"
            labelText="Email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            required
            style={{ marginBottom: "1rem" }}
          />
          <PasswordInput
            id="password"
            labelText="Password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            required
            style={{ marginBottom: "1.5rem" }}
          />
          <Button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Form>
      </Tile>
    </div>
  );
}
