import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

function futureDateTime(days = 7) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

test("signed-out users are redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/admin/consultations");
  await expect(page).toHaveURL(/\/login$/);
});

test("student can register, book, mutate, isolate, and sign out", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-student-${unique}@example.com`;
  const password = "E2e-password-123!";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  const registrationResponse = page.waitForResponse((response) => response.url().includes("/api/auth/register"));
  await page.getByRole("button", { name: "Create account" }).click();
  expect((await registrationResponse).status()).toBe(201);
  await expect(page.getByRole("status")).toContainText("Account created");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, email, password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/consultations");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "Book consultation" }).click();
  await page.getByLabel("First name").fill("E2e");
  await page.getByLabel("Last name").fill("Student");
  await page.getByLabel("Reason").fill("Browser test consultation");
  await page.getByLabel("Scheduled date and time").fill(futureDateTime());
  const bookingResponse = page.waitForResponse((response) => response.url().includes("/api/consultations"));
  await page.getByRole("button", { name: "Create consultation" }).click();
  expect((await bookingResponse).status()).toBe(201);

  const record = page.getByRole("article").filter({ hasText: "Browser test consultation" });
  await expect(record).toBeVisible();
  await expect(record.getByText("booked", { exact: true })).toBeVisible();

  await record.getByRole("button", { name: "Reschedule" }).click();
  await record.getByLabel("New date and time").fill(futureDateTime(8));
  await record.getByRole("button", { name: "Save" }).click();

  await record.getByRole("button", { name: "Complete" }).click();
  await expect(record.getByText("completed", { exact: true })).toBeVisible();

  await record.getByRole("button", { name: "Mark incomplete" }).click();
  await expect(record.getByText("booked", { exact: true })).toBeVisible();

  await record.getByRole("button", { name: "Cancel" }).click();
  await expect(record.getByText("cancelled", { exact: true })).toBeVisible();
  await expect(record.getByRole("button", { name: "Reschedule" })).toHaveCount(0);
  await expect(record.getByRole("button", { name: "Cancel" })).toHaveCount(0);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("generic student can log in, reach role isolation, and sign out", async ({ page }) => {
  const email = process.env.E2E_STUDENT_EMAIL;
  const password = process.env.E2E_STUDENT_PASSWORD;
  test.skip(!email || !password, "Set E2E_STUDENT_EMAIL and E2E_STUDENT_PASSWORD.");

  await login(page, email!, password!);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin/consultations");
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});

test("preassigned admin can open read-only all-consultations view", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD after assigning the trusted admin claim.");

  await login(page, email!, password!);
  await expect(page).toHaveURL(/\/admin\/consultations$/);
  await expect(page.getByRole("heading", { name: "All consultations" })).toBeVisible();

  await page.goto("/");
  await expect(page).toHaveURL(/\/admin\/consultations$/);

  await page.goto("/login");
  await expect(page).toHaveURL(/\/admin\/consultations$/);
  await page.goto("/register");
  await expect(page).toHaveURL(/\/admin\/consultations$/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/admin\/consultations$/);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});
