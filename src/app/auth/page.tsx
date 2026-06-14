"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Code entry ────────────────────────────────────────
  const handleVerify = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setError("");

    const res = await fetch("/web-api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.trim() }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("Invalid or expired access code.");
      setSubmitting(false);
    }
  };

  // ── Request form ──────────────────────────────────────
  const [showRequest, setShowRequest] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  const handleRequest = async () => {
    if (!requestName.trim() || !requestEmail.trim()) return;
    setSubmitting(true);

    await fetch("/web-api/auth/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: requestName.trim(),
        email: requestEmail.trim(),
        reason: requestReason.trim(),
      }),
    });

    setRequestSent(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {requestSent ? (
          // ── Request submitted ──────────────────────────
          <div className="text-center space-y-3">
            <div className="text-2xl">📨</div>
            <h1 className="text-lg font-semibold text-foreground">
              Request received
            </h1>
            <p className="text-muted-foreground text-sm">
              I&apos;ll review your request and share an access code if approved.
            </p>
          </div>
        ) : (
          <>
            {!showRequest ? (
              // ── Access code form ───────────────────────
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-4"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-lg font-semibold text-foreground">
                    Enter access code
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    You should have received this from me.
                  </p>
                </div>

                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Access code"
                  autoFocus
                  className="w-full h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={!code.trim() || submitting}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                  {submitting ? "Verifying..." : "Continue"}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have a code?{" "}
                  <button
                    type="button"
                    onClick={() => setShowRequest(true)}
                    className="text-primary underline"
                  >
                    Request access
                  </button>
                </p>
              </form>
            ) : (
              // ── Request access form ────────────────────
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequest();
                }}
                className="space-y-4"
              >
                <div className="text-center space-y-2">
                  <h1 className="text-lg font-semibold text-foreground">
                    Request access
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    I&apos;ll review and share a code if approved.
                  </p>
                </div>

                <input
                  type="text"
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                  className="w-full h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                <input
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full h-12 rounded-lg border border-input bg-background px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Why you'd like access (optional)"
                  rows={2}
                  className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />

                <button
                  type="submit"
                  disabled={!requestName.trim() || !requestEmail.trim() || submitting}
                  className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit request"}
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have a code?{" "}
                  <button
                    type="button"
                    onClick={() => setShowRequest(false)}
                    className="text-primary underline"
                  >
                    Go back
                  </button>
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
