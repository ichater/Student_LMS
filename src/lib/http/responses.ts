import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess, FieldError } from "@/types/api";
export type { ApiError, ApiSuccess, FieldError } from "@/types/api";

export const ApiSuccessCode = {
  OK: "OK",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  LOGGED_IN: "LOGGED_IN",
  LOGGED_OUT: "LOGGED_OUT",
  REGISTERED: "REGISTERED",
} as const;

export type ApiSuccessCode = (typeof ApiSuccessCode)[keyof typeof ApiSuccessCode];

export const ApiErrorCode = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_FAILED: "AUTHENTICATION_FAILED",
  RESCHEDULE_NOT_ALLOWED: "RESCHEDULE_NOT_ALLOWED",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export type ApiSuccessStatus<C extends ApiSuccessCode> =
  C extends typeof ApiSuccessCode.CREATED | typeof ApiSuccessCode.REGISTERED ? 201 : 200;

export type ApiErrorStatus<C extends ApiErrorCode> =
  C extends typeof ApiErrorCode.UNAUTHORIZED ? 401
    : C extends typeof ApiErrorCode.FORBIDDEN ? 403
      : C extends typeof ApiErrorCode.NOT_FOUND ? 404
        : C extends typeof ApiErrorCode.VALIDATION_ERROR ? 400 | 409 | 422
          : C extends typeof ApiErrorCode.AUTHENTICATION_FAILED ? 400 | 401
            : C extends typeof ApiErrorCode.RESCHEDULE_NOT_ALLOWED | typeof ApiErrorCode.INVALID_STATUS_TRANSITION ? 409
              : C extends typeof ApiErrorCode.INTERNAL_ERROR ? 500
                : never;

export function success<T, C extends ApiSuccessCode>(
  data: T,
  code: C,
  message: string,
  status?: ApiSuccessStatus<C>,
) {
  const body: ApiSuccess<T, C> = { success: true, code, message, data };
  const responseStatus = status ?? (
    code === ApiSuccessCode.CREATED || code === ApiSuccessCode.REGISTERED ? 201 : 200
  );
  return NextResponse.json(body, { status: responseStatus });
}

export function error<C extends ApiErrorCode>(
  code: C,
  message: string,
  status: ApiErrorStatus<C>,
  errors?: FieldError[],
) {
  const body: ApiError<C> = { success: false, code, message, data: null, ...(errors ? { errors } : {}) };
  return NextResponse.json(body, { status });
}

export function authenticationRequired() {
  return error(ApiErrorCode.UNAUTHORIZED, "Authentication is required", 401);
}

export function consultationNotFound() {
  return error(ApiErrorCode.NOT_FOUND, "Consultation not found", 404);
}

export function invalidJson() {
  return error(ApiErrorCode.VALIDATION_ERROR, "Request body must be valid JSON", 400);
}

export function invalidFields(fields: FieldError[]) {
  return error(ApiErrorCode.VALIDATION_ERROR, "Please correct the highlighted fields", 422, fields);
}
