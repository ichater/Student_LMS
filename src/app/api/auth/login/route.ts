import { ZodError } from "zod";
import {
  ApiErrorCode,
  ApiSuccessCode,
  error,
  invalidFields,
  invalidJson,
  success,
} from "@/lib/http/responses";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJson();
  }

  try {
    const input = loginSchema.parse(body);
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword(input);

    if (authError) {
      return error(ApiErrorCode.AUTHENTICATION_FAILED, "The email or password is incorrect", 401);
    }

    const role = data.user.app_metadata?.role === "admin" ? "admin" : "student";
    return success({ userId: data.user.id, role }, ApiSuccessCode.LOGGED_IN, "Login successful");
  } catch (caught) {
    if (caught instanceof ZodError) {
      return invalidFields(
        caught.issues.map((issue) => ({ field: issue.path.join(".") || "body", message: issue.message })),
      );
    }
    console.error("Login failed", caught);
    return error(ApiErrorCode.INTERNAL_ERROR, "Login could not be completed", 500);
  }
}
