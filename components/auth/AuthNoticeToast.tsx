"use client";

import { useEffect } from "react";

type AuthNoticeToastProps = {
  tone: "success" | "error";
  message: string;
  onDismiss: () => void;
};

export function AuthNoticeToast({ tone, message, onDismiss }: AuthNoticeToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div className={`auth-toast auth-toast-${tone}`} role="status" aria-live="polite">
      <div className="auth-toast-label">{tone === "success" ? "Email status" : "Request failed"}</div>
      <div className="auth-toast-message">{message}</div>
      <button type="button" className="auth-toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        Close
      </button>
    </div>
  );
}
