"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Lock, Shield } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface EnvCapabilities {
  gemini: boolean;
  openai: boolean;
  groq: boolean;
  openrouter: boolean;
  mistral: boolean;
  cloudinary: boolean;
  pythonService: boolean;
  google: boolean;
}

interface Integration {
  id: string;
  provider: string;
  name: string;
  enabled: boolean;
  hasConfig: boolean;
  hasSecret: boolean;
  createdAt: string;
}

interface SecurityInfo {
  hasSecretKey: boolean;
}

interface Branding {
  siteName?: string;
  tagline?: string;
  siteUrl?: string;
}

interface SeoDefaults {
  [key: string]: unknown;
}

interface SettingsData {
  branding: Branding;
  seoDefaults: SeoDefaults;
  envCapabilities: EnvCapabilities;
  integrations: Integration[];
  security: SecurityInfo;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const CAPABILITY_LABELS: Record<keyof EnvCapabilities, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  groq: "Groq",
  openrouter: "OpenRouter",
  mistral: "Mistral AI",
  cloudinary: "Cloudinary",
  pythonService: "Python Pipeline",
  google: "Google Auth",
};

function fmtDate(str: string) {
  return new Date(str).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { ok: boolean; data: SettingsData };
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="neutral">Settings</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Settings
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          System configuration, integration status, and security overview.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-32 animate-pulse rounded-lg bg-white/4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* ── AI & Service Providers ── */}
          <Card>
            <CardHeader>
              <CardTitle>AI &amp; Service Providers</CardTitle>
              <CardDescription>
                Environment variable status for external integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 p-0">
              {(Object.keys(CAPABILITY_LABELS) as (keyof EnvCapabilities)[]).map((key, i, arr) => {
                const configured = data.envCapabilities[key];
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < arr.length - 1 ? "border-b border-white/10" : ""
                    }`}
                  >
                    <span className="text-sm text-zinc-300">{CAPABILITY_LABELS[key]}</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          configured ? "bg-emerald-400" : "bg-red-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          configured ? "text-emerald-300" : "text-zinc-500"
                        }`}
                      >
                        {configured ? "Configured" : "Not configured"}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-white/10 px-4 py-2.5">
                <p className="text-xs text-zinc-500">
                  Add keys to <span className="font-mono">.env.local</span> to enable providers.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── Database Integrations ── */}
          {data.integrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Database Integrations</CardTitle>
                <CardDescription>Active provider integrations stored in the database.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-xs text-zinc-500">
                        <th className="px-4 py-2.5 font-medium">Provider</th>
                        <th className="px-4 py-2.5 font-medium">Name</th>
                        <th className="px-4 py-2.5 font-medium">Status</th>
                        <th className="px-4 py-2.5 font-medium">Config</th>
                        <th className="px-4 py-2.5 font-medium">Secret</th>
                        <th className="px-4 py-2.5 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.integrations.map((intg, i) => (
                        <tr
                          key={intg.id}
                          className={`text-zinc-300 ${
                            i < data.integrations.length - 1
                              ? "border-b border-white/10"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                            {intg.provider}
                          </td>
                          <td className="px-4 py-3">{intg.name}</td>
                          <td className="px-4 py-3">
                            <Badge tone={intg.enabled ? "green" : "red"}>
                              {intg.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {intg.hasConfig ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {intg.hasSecret ? (
                              <Lock className="h-4 w-4 text-zinc-300" />
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500">
                            {fmtDate(intg.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Security ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-zinc-300">Secret key</span>
                <Badge tone={data.security.hasSecretKey ? "green" : "red"}>
                  {data.security.hasSecretKey ? "Configured" : "Missing"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* ── Site Identity ── */}
          <Card>
            <CardHeader>
              <CardTitle>Site Identity</CardTitle>
              <CardDescription>Branding configuration.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(
                [
                  ["Site name", data.branding.siteName],
                  ["Tagline", data.branding.tagline],
                  ["Site URL", data.branding.siteUrl],
                ] as [string, string | undefined][]
              ).map(([label, value], i) => (
                <div
                  key={label}
                  className={`flex items-center justify-between px-4 py-3 ${
                    i < 2 ? "border-b border-white/10" : ""
                  }`}
                >
                  <span className="text-sm text-zinc-400">{label}</span>
                  <span className="text-sm text-zinc-200">
                    {value ?? <span className="text-zinc-600">—</span>}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
