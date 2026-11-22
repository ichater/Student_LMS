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
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidJson();
  }

  try {
    const input = registerSchema.parse(body);
    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
    });

    if (authError) {
      return error(ApiErrorCode.AUTHENTICATION_FAILED, authError.message, 400);
    }

    return success(
      { userId: data.user?.id ?? null },
      ApiSuccessCode.REGISTERED,
      "Account created successfully",
    );
  } catch (caught) {
    if (caught instanceof ZodError) {
      return invalidFields(
        caught.issues.map((issue) => ({ field: issue.path.join(".") || "body", message: issue.message })),
      );
    }
    console.error("Registration failed", caught);
    return error(ApiErrorCode.INTERNAL_ERROR, "The account could not be created", 500);
  }
}
