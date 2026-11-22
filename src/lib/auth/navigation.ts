export type AppRole = "student" | "admin";

const AUTH_STATE_CHANGED_EVENT = "contour:auth-state-changed";

export function getRoleLandingPage(role: AppRole): string {
  return role === "admin" ? "/admin/consultations" : "/dashboard";
}

export function notifyAuthStateChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

export function subscribeToAuthStateChanges(listener: () => void) {
  window.addEventListener(AUTH_STATE_CHANGED_EVENT, listener);
  return () => window.removeEventListener(AUTH_STATE_CHANGED_EVENT, listener);
}
