"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { Consultation, ConsultationStatus } from "@/types/consultation";
import {
  Button,
  CardTitle,
  ConsultationReason,
  Eyebrow,
  ErrorTitle,
  MutedText,
  PageTitle,
} from "@/components/ui";

function StatusBadge({ status }: { status: ConsultationStatus }) {
  const styles: Record<ConsultationStatus, string> = {
    booked: "border-[#a8c8bb] bg-[#edf7f2] text-[#176b54]",
    completed: "border-[#b8c4d1] bg-[#f1f4f7] text-[#405267]",
    cancelled: "border-[#dfbebe] bg-[#fff4f4] text-[#963e3e]",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatScheduledTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function fetchConsultations(): Promise<
  | { consultations: Consultation[] }
  | { unauthorized: true }
  | { forbidden: true }
  | { error: string }
> {
  try {
    const response = await fetch("/api/admin/consultations", { cache: "no-store" });

    if (response.status === 401) return { unauthorized: true };
    if (response.status === 403) return { forbidden: true };

    const body = (await response.json()) as ApiSuccess<Consultation[]> | ApiError;

    if (!response.ok || !body.success) {
      return { error: body.message || "Consultations could not be loaded." };
    }

    return { consultations: body.data };
  } catch {
    return { error: "Unable to reach the server. Please try again." };
  }
}

export function AdminConsultations() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    void fetchConsultations().then((result) => {
      if (!active) return;

      if ("unauthorized" in result) {
        router.replace("/login");
        router.refresh();
        return;
      }

      if ("forbidden" in result) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if ("error" in result) {
        setErrorMessage(result.error);
      } else {
        setConsultations(result.consultations);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function retryLoad() {
    setLoading(true);
    setErrorMessage("");

    const result = await fetchConsultations();

    if ("unauthorized" in result) {
      router.replace("/login");
      router.refresh();
      return;
    }

    if ("forbidden" in result) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    if ("error" in result) {
      setErrorMessage(result.error);
    } else {
      setConsultations(result.consultations);
    }
    setLoading(false);
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <Eyebrow>Administrator</Eyebrow>
      <PageTitle>All consultations</PageTitle>

      {loading ? (
        <div className="mt-8 grid gap-3" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-md border border-[#dfe5ea] bg-white" />
          ))}
        </div>
      ) : errorMessage ? (
        <div role="alert" className="mt-8 rounded-md border border-[#dfbebe] bg-[#fff7f7] px-5 py-4">
          <ErrorTitle>Could not load consultations</ErrorTitle>
          <MutedText tone="error" className="mt-1">{errorMessage}</MutedText>
          <Button type="button" onClick={() => void retryLoad()} variant="dangerMuted" className="mt-4">
            Try again
          </Button>
        </div>
      ) : consultations.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-[#cbd4db] bg-white px-6 py-12 text-center">
          <CardTitle>No consultations found</CardTitle>
          <MutedText className="mt-2">Consultation records across the system will appear here.</MutedText>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {consultations.map((consultation) => (
            <article key={consultation.id} className="grid gap-5 rounded-md border border-[#dfe5ea] bg-white p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle>{consultation.first_name} {consultation.last_name}</CardTitle>
                  <StatusBadge status={consultation.status} />
                </div>
                <ConsultationReason>{consultation.reason}</ConsultationReason>
              </div>
              <dl className="min-w-52 text-sm sm:text-right">
                <dt className="font-medium text-[#607080]">Scheduled</dt>
                <dd className="mt-1 font-semibold">{formatScheduledTime(consultation.scheduled_at)}</dd>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
