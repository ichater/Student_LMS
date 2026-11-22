import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const studentEmail = process.env.E2E_STUDENT_EMAIL;
const studentPassword = process.env.E2E_STUDENT_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

if (!url || !publishableKey || !studentEmail || !studentPassword || !adminEmail || !adminPassword) {
  throw new Error("Set local Supabase public variables and both E2E account pairs in .env.local.");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function signIn(email, password) {
  const client = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  assert(!error && data.user, `Login failed for ${email}: ${error?.message ?? "unknown error"}`);
  return { client, user: data.user };
}

const anonymous = createClient(url, publishableKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: anonymousRows, error: anonymousError } = await anonymous
  .from("consultations")
  .select("id")
  .limit(1);
assert(Boolean(anonymousError), "Anonymous consultation reads must be denied.");
assert(!anonymousRows, "Anonymous consultation reads returned data.");

const { client: student, user: studentUser } = await signIn(studentEmail, studentPassword);
const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const { data: inserted, error: insertError } = await student
  .from("consultations")
  .insert({
    user_id: studentUser.id,
    first_name: "RLS",
    last_name: "Student",
    reason: "Live RLS verification record",
    scheduled_at: scheduledAt,
  })
  .select("id,user_id,status")
  .single();
assert(!insertError && inserted, `Student insert failed: ${insertError?.message ?? "unknown error"}`);

const { data: ownRows, error: ownError } = await student
  .from("consultations")
  .select("id,user_id")
  .eq("id", inserted.id);
assert(!ownError && ownRows?.length === 1, `Student could not read its own record: ${ownError?.message ?? "missing row"}`);

const fakeUserId = "00000000-0000-4000-8000-000000000001";
const { error: foreignInsertError } = await student
  .from("consultations")
  .insert({
    user_id: fakeUserId,
    first_name: "Forbidden",
    last_name: "Insert",
    reason: "Cross-user insert must fail",
    scheduled_at: scheduledAt,
  });
assert(Boolean(foreignInsertError), "Student foreign-user insert unexpectedly succeeded.");

const { client: admin } = await signIn(adminEmail, adminPassword);
const { data: adminRows, error: adminError } = await admin
  .from("consultations")
  .select("id,user_id")
  .eq("id", inserted.id);
assert(!adminError && adminRows?.length === 1, `Admin could not read the student record: ${adminError?.message ?? "missing row"}`);

const { data: adminUpdateRows, error: adminUpdateError } = await admin
  .from("consultations")
  .update({ reason: "Admin writes must remain denied" })
  .eq("id", inserted.id)
  .select("id");
assert(!adminUpdateError && adminUpdateRows?.length === 0, "Admin update unexpectedly affected a row; admins are read-only.");

console.log("Live RLS verification passed:");
console.log("- anonymous consultation reads denied");
console.log("- student inserted and read its own consultation");
console.log("- student cross-user insert denied");
console.log("- admin read all consultations policy allowed the student row");
console.log("- admin update remained denied");
