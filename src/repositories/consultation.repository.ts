import type { SupabaseClient } from "@supabase/supabase-js";
import type { Consultation } from "@/types/consultation";

export class ConsultationRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(userId: string): Promise<Consultation[]> {
    const { data, error } = await this.supabase
      .from("consultations")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Consultation[];
  }

  async listAll(): Promise<Consultation[]> {
    const { data, error } = await this.supabase
      .from("consultations")
      .select("*")
      .order("scheduled_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Consultation[];
  }

  async findById(userId: string, consultationId: string): Promise<Consultation | null> {
    const { data, error } = await this.supabase
      .from("consultations")
      .select("*")
      .eq("id", consultationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as Consultation | null;
  }

  async update(
    userId: string,
    consultationId: string,
    values: Partial<Pick<Consultation, "scheduled_at" | "status">>,
  ): Promise<Consultation> {
    const { data, error } = await this.supabase
      .from("consultations")
      .update(values)
      .eq("id", consultationId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) throw error;
    return data as Consultation;
  }

  async create(
    userId: string,
    input: {
      first_name: string;
      last_name: string;
      reason: string;
      scheduled_at: string;
    },
  ): Promise<Consultation> {
    const { data, error } = await this.supabase
      .from("consultations")
      .insert({ ...input, user_id: userId })
      .select("*")
      .single();

    if (error) throw error;
    return data as Consultation;
  }
}
