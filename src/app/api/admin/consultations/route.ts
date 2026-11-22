import {
  ApiErrorCode,
  ApiSuccessCode,
  authenticationRequired,
  error,
  success,
} from "@/lib/http/responses";
import { getAuthenticatedUser, isAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ConsultationService } from "@/services/consultation.service";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return authenticationRequired();
  if (!isAdmin(user)) return error(ApiErrorCode.FORBIDDEN, "Administrator access is required", 403);

  try {
    const supabase = await createClient();
    const service = new ConsultationService(supabase);
    const consultations = await service.listAll();

    return success(consultations, ApiSuccessCode.OK, "All consultations fetched successfully");
  } catch (caught) {
    console.error("Failed to fetch admin consultations", caught);
    return error(ApiErrorCode.INTERNAL_ERROR, "Consultations could not be fetched", 500);
  }
}
