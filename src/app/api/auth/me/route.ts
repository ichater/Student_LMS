import { ApiSuccessCode, authenticationRequired, success } from "@/lib/http/responses";
import { getAuthenticatedUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return authenticationRequired();

  const role = user.app_metadata?.role === "admin" ? "admin" : "student";
  return success({ userId: user.id, role }, ApiSuccessCode.OK, "Current session fetched successfully");
}
