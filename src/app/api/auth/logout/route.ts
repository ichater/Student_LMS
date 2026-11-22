import { ApiErrorCode, ApiSuccessCode, error, success } from "@/lib/http/responses";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signOut();
    if (authError) {
      return error(ApiErrorCode.AUTHENTICATION_FAILED, "Logout could not be completed", 400);
    }
    return success(null, ApiSuccessCode.LOGGED_OUT, "Logout successful");
  } catch (caught) {
    console.error("Logout failed", caught);
    return error(ApiErrorCode.INTERNAL_ERROR, "Logout could not be completed", 500);
  }
}
