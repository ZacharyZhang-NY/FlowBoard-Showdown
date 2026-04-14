"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  TextInput,
  PasswordInput,
  InlineNotification,
  Tile,
  Form,
  Stack,
} from "@carbon/react";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <Tile className="login-card">
        <div className="login-header">
          <h1 className="login-title">FlowBoard</h1>
          <p>Project Management Board</p>
        </div>

        <Form onSubmit={handleSubmit} className="login-form">
          <Stack gap={6}>
            {error && (
              <InlineNotification
                kind="error"
                title="Error"
                subtitle={error}
                lowContrast
                hideCloseButton={false}
                onCloseButtonClick={() => setError("")}
              />
            )}

            <TextInput
              id="email"
              type="email"
              labelText="Email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <PasswordInput
              id="password"
              labelText="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </Form>
      </Tile>
    </div>
  );
}
