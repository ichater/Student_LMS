"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { canPerformAction } from "@/services/consultation.transitions";
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
  | { error: string }
> {
  try {
    const response = await fetch("/api/consultations", { cache: "no-store" });

    if (response.status === 401) return { unauthorized: true };

    const body = (await response.json()) as ApiSuccess<Consultation[]> | ApiError;

    if (!response.ok || !body.success) {
      return { error: body.message || "Consultations could not be loaded." };
    }

    return { consultations: body.data };
  } catch {
    return { error: "Unable to reach the server. Please try again." };
  }
}

export function ConsultationDashboard() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeMutation, setActiveMutation] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [reschedulingId, setReschedulingId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    let active = true;

    void fetchConsultations().then((result) => {
      if (!active) return;

      if ("unauthorized" in result) {
        router.replace("/login");
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

    if ("error" in result) {
      setErrorMessage(result.error);
    } else {
      setConsultations(result.consultations);
    }
    setLoading(false);
  }

  async function createConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setBookingErrors({});
    setBookingError("");
    setBookingSuccess("");

    const form = new FormData(event.currentTarget);
    const localScheduledAt = String(form.get("scheduled_at") ?? "");

    try {
      const response = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          reason: form.get("reason"),
          scheduled_at: localScheduledAt ? new Date(localScheduledAt).toISOString() : "",
        }),
      });
      const body = (await response.json()) as ApiSuccess<Consultation> | ApiError;

      if (!response.ok || body.success === false) {
        if (body.success === false && body.errors) {
          setBookingErrors(Object.fromEntries(body.errors.map((item) => [item.field, item.message])));
        }
        setBookingError(body.message || "Consultation could not be created.");
        return;
      }

      formElement.reset();
      setBookingSuccess("Consultation created successfully.");
      setBookingOpen(false);
      await retryLoad();
    } catch {
      setBookingError("Unable to reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function patchConsultation(id: string, key: string, body: { scheduled_at: string } | { status: "completed" | "booked" | "cancelled" }) {
    setActiveMutation(key);
    setMutationError("");

    try {
      const response = await fetch(`/api/consultations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as ApiSuccess<Consultation> | ApiError;

      if (!response.ok || !result.success) {
        setMutationError(result.message || "Consultation could not be updated.");
        return;
      }

      setReschedulingId("");
      setScheduledAt("");
      await retryLoad();
    } catch {
      setMutationError("Unable to reach the server. Please try again.");
    } finally {
      setActiveMutation("");
    }
  }

  function beginReschedule(consultation: Consultation) {
    setReschedulingId(consultation.id);
    setScheduledAt("");
    setMutationError("");
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow>Student dashboard</Eyebrow>
          <PageTitle>My consultations</PageTitle>
        </div>
        <Button
          type="button"
          onClick={() => {
            setBookingOpen((open) => !open);
            setBookingError("");
            setBookingErrors({});
            setBookingSuccess("");
          }}
          variant="primary"
          size="large"
        >
          {bookingOpen ? "Close booking form" : "Book consultation"}
        </Button>
      </div>

      {bookingSuccess ? (
        <p role="status" className="mt-5 rounded-md border border-[#acd1c4] bg-[#f1faf6] px-4 py-3 text-sm text-[#176b54]">
          {bookingSuccess}
        </p>
      ) : null}

      {bookingOpen ? (
        <form onSubmit={createConsultation} className="mt-6 grid gap-4 rounded-md border border-[#dfe5ea] bg-white p-5 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            First name
            <input
              name="first_name"
              required
              maxLength={100}
              className="mt-2 w-full rounded-md border border-[#ccd5dc] px-3 py-2.5 outline-none focus:border-[#176b54]"
              aria-invalid={Boolean(bookingErrors.first_name)}
            />
            {bookingErrors.first_name ? <span className="mt-1 block text-xs text-[#963e3e]">{bookingErrors.first_name}</span> : null}
          </label>
          <label className="block text-sm font-medium">
            Last name
            <input
              name="last_name"
              required
              maxLength={100}
              className="mt-2 w-full rounded-md border border-[#ccd5dc] px-3 py-2.5 outline-none focus:border-[#176b54]"
              aria-invalid={Boolean(bookingErrors.last_name)}
            />
            {bookingErrors.last_name ? <span className="mt-1 block text-xs text-[#963e3e]">{bookingErrors.last_name}</span> : null}
          </label>
          <label className="block text-sm font-medium sm:col-span-2">
            Reason
            <textarea
              name="reason"
              required
              maxLength={1000}
              rows={3}
              className="mt-2 w-full resize-y rounded-md border border-[#ccd5dc] px-3 py-2.5 outline-none focus:border-[#176b54]"
              aria-invalid={Boolean(bookingErrors.reason)}
            />
            {bookingErrors.reason ? <span className="mt-1 block text-xs text-[#963e3e]">{bookingErrors.reason}</span> : null}
          </label>
          <label className="block text-sm font-medium">
            Scheduled date and time
            <input
              name="scheduled_at"
              type="datetime-local"
              required
              className="mt-2 w-full rounded-md border border-[#ccd5dc] px-3 py-2.5 outline-none focus:border-[#176b54]"
              aria-invalid={Boolean(bookingErrors.scheduled_at)}
            />
            {bookingErrors.scheduled_at ? <span className="mt-1 block text-xs text-[#963e3e]">{bookingErrors.scheduled_at}</span> : null}
          </label>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={submitting}
              variant="primary"
              size="medium"
              className="w-full sm:w-auto"
            >
              {submitting ? "Booking..." : "Create consultation"}
            </Button>
          </div>
          {bookingError ? <p role="alert" className="text-sm text-[#963e3e] sm:col-span-2">{bookingError}</p> : null}
        </form>
      ) : null}

      {mutationError ? (
        <p role="alert" className="mt-5 rounded-md border border-[#e4b8b8] bg-[#fff7f7] px-4 py-3 text-sm text-[#963e3e]">
          {mutationError}
        </p>
      ) : null}

      {loading ? (
        <div className="mt-8 grid gap-3" aria-live="polite" aria-busy="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-md border border-[#dfe5ea] bg-white" />
          ))}
        </div>
      ) : errorMessage ? (
        <div role="alert" className="mt-8 rounded-md border border-[#dfbebe] bg-[#fff7f7] px-5 py-4">
          <ErrorTitle>Could not load consultations</ErrorTitle>
          <MutedText tone="error" className="mt-1">{errorMessage}</MutedText>
          <Button
            type="button"
            onClick={() => void retryLoad()}
            variant="dangerMuted"
            className="mt-4"
          >
            Try again
          </Button>
        </div>
      ) : consultations.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-[#cbd4db] bg-white px-6 py-12 text-center">
          <CardTitle>No consultations yet</CardTitle>
          <MutedText className="mt-2">
            Your upcoming and completed consultation records will appear here.
          </MutedText>
        </div>
      ) : (
        <div className="mt-8 grid gap-3">
          {consultations.map((consultation) => {
            const busy = activeMutation.startsWith(`${consultation.id}:`);

            return (
              <article
                key={consultation.id}
                className="grid gap-5 rounded-md border border-[#dfe5ea] bg-white p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>
                      {consultation.first_name} {consultation.last_name}
                    </CardTitle>
                    <StatusBadge status={consultation.status} />
                  </div>
                  <ConsultationReason>{consultation.reason}</ConsultationReason>

                  {reschedulingId === consultation.id ? (
                    <div className="mt-4 flex flex-wrap items-end gap-2">
                      <label className="block text-sm font-medium">
                        New date and time
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(event) => setScheduledAt(event.target.value)}
                          className="mt-1 block rounded-md border border-[#ccd5dc] px-3 py-2"
                        />
                      </label>
                      <Button
                        type="button"
                        disabled={!scheduledAt || busy}
                        onClick={() => {
                          const iso = new Date(scheduledAt).toISOString();
                          void patchConsultation(consultation.id, `${consultation.id}:reschedule`, { scheduled_at: iso });
                        }}
                        variant="primary"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setReschedulingId("");
                          setScheduledAt("");
                        }}
                        variant="secondary"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canPerformAction(consultation.status, "reschedule") ? (
                      <Button type="button" disabled={busy} onClick={() => beginReschedule(consultation)} variant="secondary">
                        Reschedule
                      </Button>
                    ) : null}
                    {canPerformAction(consultation.status, "complete") ? (
                      <Button type="button" disabled={busy} onClick={() => void patchConsultation(consultation.id, `${consultation.id}:complete`, { status: "completed" })} variant="secondary">
                        Complete
                      </Button>
                    ) : null}
                    {canPerformAction(consultation.status, "mark_incomplete") ? (
                      <Button type="button" disabled={busy} onClick={() => void patchConsultation(consultation.id, `${consultation.id}:incomplete`, { status: "booked" })} variant="secondary">
                        Mark incomplete
                      </Button>
                    ) : null}
                    {canPerformAction(consultation.status, "cancel") ? (
                      <Button type="button" disabled={busy} onClick={() => void patchConsultation(consultation.id, `${consultation.id}:cancel`, { status: "cancelled" })} variant="danger">
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </div>

                <dl className="min-w-52 text-sm sm:text-right">
                  <dt className="font-medium text-[#607080]">Scheduled</dt>
                  <dd className="mt-1 font-semibold">{formatScheduledTime(consultation.scheduled_at)}</dd>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
