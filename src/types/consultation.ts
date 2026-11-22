export type ConsultationStatus = "booked" | "completed" | "cancelled";

export interface Consultation {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  reason: string;
  scheduled_at: string;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
}
