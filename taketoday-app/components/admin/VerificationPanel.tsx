"use client";

import { useCallback, useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, RefreshCw, CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Claim {
  text: string;
  status: "verified" | "likely_verified" | "needs_review" | "unverified" | "disputed";
  notes: string;
}

interface Verification {
  id: string;
  aiBrief: string | null;
  aiClaims: Claim[] | null;
  aiScore: number | null;
  aiGeneratedAt: string | null;
  aiModel: string | null;
  reviewerId: string | null;
  decision: string | null;
  decidedAt: string | null;
}

interface Props {
  articleId: string;
  onStatusChange: (newStatus: string) => void;
}

const claimTone = {
  verified: "green",
  likely_verified: "green",
  needs_review: "amber",
  unverified: "neutral",
  disputed: "red",
} as const;

const claimLabel = {
  verified: "Verified",
  likely_verified: "Likely verified",
  needs_review: "Needs review",
  unverified: "Unverified",
  disputed: "Disputed",
};

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 85 ? "green" : score >= 65 ? "amber" : "red";
  return (
    <Badge tone={tone} className="text-base font-bold px-3 py-1.5">
      {score}
      <span className="ml-0.5 text-xs font-normal opacity-70">/100</span>
    </Badge>
  );
}

function ClaimIcon({ status }: { status: Claim["status"] }) {
  if (status === "verified" || status === "likely_verified") return <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />;
  if (status === "disputed") return <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />;
  if (status === "needs_review") return <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400" />;
  return <HelpCircle className="h-3.5 w-3.5 shrink-0 text-zinc-500" />;
}

export function VerificationPanel({ articleId, onStatusChange }: Props) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/verify`);
      if (!res.ok) return;
      const json = await res.json();
      setVerification((json.data as { verification: Verification | null }).verification);
    } catch {
      // silent — panel is non-critical
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => { void fetchVerification(); }, [fetchVerification]);

  const runVerification = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${articleId}/verify`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
      const v = (json.data as { verification: Verification }).verification;
      setVerification(v);
      onStatusChange("fact_checking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setRunning(false);
    }
  }, [articleId, onStatusChange]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--adm-text-3)" }}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--adm-text-3)" }} />
          {verification?.aiScore != null && <ScoreBadge score={verification.aiScore} />}
        </div>
        <button
          type="button"
          onClick={() => void runVerification()}
          disabled={running}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-white/8 disabled:pointer-events-none disabled:opacity-40"
          style={{ color: "var(--adm-accent-purple)" }}
        >
          {running ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {running ? "Running…" : verification ? "Re-run" : "Run check"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!verification && !running && (
        <p className="text-xs" style={{ color: "var(--adm-text-3)" }}>
          No fact check yet. Run to analyse claims.
        </p>
      )}

      {verification?.aiBrief && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--adm-text-2)" }}>
          {verification.aiBrief}
        </p>
      )}

      {/* claims */}
      {verification?.aiClaims && verification.aiClaims.length > 0 && (
        <div className="space-y-2">
          {verification.aiClaims.map((claim, i) => (
            <div
              key={i}
              className="rounded-md p-2.5 space-y-1.5"
              style={{ background: "var(--adm-surface-2)", border: "1px solid var(--adm-border-dim)" }}
            >
              <div className="flex items-start gap-2">
                <ClaimIcon status={claim.status} />
                <p className="flex-1 text-xs leading-snug" style={{ color: "var(--adm-text-1)" }}>
                  {claim.text}
                </p>
                <Badge tone={claimTone[claim.status]} className="shrink-0 text-[10px]">
                  {claimLabel[claim.status]}
                </Badge>
              </div>
              {claim.notes && (
                <p className="pl-5 text-[11px] italic leading-snug" style={{ color: "var(--adm-text-3)" }}>
                  {claim.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* editorial decision */}
      {verification?.decision && (
        <div
          className="rounded-md px-3 py-2 text-xs"
          style={{
            background: verification.decision === "APPROVED" ? "rgba(52,211,153,0.08)" : "rgba(251,146,60,0.08)",
            border: `1px solid ${verification.decision === "APPROVED" ? "rgba(52,211,153,0.2)" : "rgba(251,146,60,0.2)"}`,
            color: verification.decision === "APPROVED" ? "rgb(167,243,208)" : "rgb(253,186,116)",
          }}
        >
          Editorial: {verification.decision === "APPROVED" ? "Approved" : "Needs revision"}
          {verification.decidedAt && (
            <span className="ml-2 opacity-60">
              {new Date(verification.decidedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {verification?.aiGeneratedAt && (
        <p className="text-[10px]" style={{ color: "var(--adm-text-3)" }}>
          Last checked {new Date(verification.aiGeneratedAt).toLocaleDateString()} · {verification.aiModel}
        </p>
      )}
    </div>
  );
}
