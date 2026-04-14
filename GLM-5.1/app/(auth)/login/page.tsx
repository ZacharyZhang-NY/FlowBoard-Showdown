"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  TextInput,
  Button,
  InlineNotification,
  Tile,
} from "@carbon/react";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {
        setError(error.message || "Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--cds-background)",
      }}
    >
      <Tile style={{ width: 400, padding: 32 }}>
        <h2
          style={{
            marginBottom: 24,
            fontSize: 28,
            fontWeight: 400,
          }}
        >
          FlowBoard
        </h2>
        {error && (
          <InlineNotification
            kind="error"
            title="Login Failed"
            subtitle={error}
            onCloseButtonClick={() => setError("")}
            style={{ marginBottom: 16, maxWidth: "100%" }}
          />
        )}
        <Form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <TextInput
              id="email"
              labelText="Email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              required
            />
            <TextInput
              id="password"
              labelText="Password"
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              required
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </Form>
      </Tile>
    </div>
  );
}
