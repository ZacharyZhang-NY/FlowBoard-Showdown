import { expect, test } from "@playwright/test";

import { requireEnv } from "../../src/shared/utils/env";

function readSessionCookie(setCookieHeader: string | null): string {
  if (!setCookieHeader) {
    throw new Error("Authentication response did not include a session cookie");
  }

  const match = setCookieHeader.match(/better-auth\.session_token=([^;]+)/);
  if (!match?.[1]) {
    throw new Error("Authentication response did not include better-auth.session_token");
  }

  return match[1];
}

async function signIn(page: import("@playwright/test").Page, request: import("@playwright/test").APIRequestContext) {
  const response = await request.post("/api/auth/sign-in/email", {
    data: {
      email: requireEnv("SEED_ADMIN_EMAIL"),
      password: requireEnv("SEED_ADMIN_PASSWORD"),
    },
  });

  expect(response.ok()).toBeTruthy();

  await page.context().addCookies([
    {
      name: "better-auth.session_token",
      value: readSessionCookie(response.headers()["set-cookie"] ?? null),
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test("loads health endpoint and dashboard after sign-in", async ({ page, request }) => {
  const healthResponse = await request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();
  await expect(healthResponse.json()).resolves.toMatchObject({
    data: {
      status: "ok",
    },
  });

  await signIn(page, request);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "FlowBoard Demo" })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Recent activity")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText("Issues by status")).toBeVisible({
    timeout: 20_000,
  });
});

test("persists issue title changes through the real API", async ({ page, request }) => {
  await signIn(page, request);
  await page.goto("/issues");
  await expect(page).toHaveURL(/\/issues$/, {
    timeout: 20_000,
  });

  const firstIssueRow = page.locator("tbody tr").first();
  await expect(firstIssueRow).toBeVisible({
    timeout: 20_000,
  });
  await firstIssueRow.click();

  await expect(page).toHaveURL(/\/issues\/.+/, {
    timeout: 20_000,
  });

  const titleInput = page.getByLabel("Title");
  const nextTitle = `E2E issue ${Date.now()}`;

  await titleInput.fill(nextTitle);
  await titleInput.blur();
  await expect(titleInput).toHaveValue(nextTitle);

  await page.reload();
  await expect(page.getByLabel("Title")).toHaveValue(nextTitle);
});
