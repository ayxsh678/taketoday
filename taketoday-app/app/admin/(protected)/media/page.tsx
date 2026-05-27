"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileImage, Folder, HardDrive, RefreshCw, Search } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface MediaAsset {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  altText: string | null;
  folder: string | null;
  tags: string[];
  createdAt: string;
}

interface MediaFolder {
  id: string;
  name: string;
  assetCount: number;
  parentId: string | null;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1_024 * 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / (1_024 * 1_024)).toFixed(2)} MB`;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchMedia(folderId: string | null, q: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        ok: boolean;
        data: {
          assets: MediaAsset[];
          folders: MediaFolder[];
          total: number;
          totalBytes: number;
        };
      };
      setAssets(json.data.assets);
      setFolders(json.data.folders);
      setTotalBytes(json.data.totalBytes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load media");
    } finally {
      setLoading(false);
    }
  }

  // Fetch on mount and when folder changes
  useEffect(() => {
    void fetchMedia(currentFolderId, searchQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchMedia(currentFolderId, searchQ);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQ]);

  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <Badge tone="blue">Media</Badge>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">
          Media Library
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
          Manage images and videos across all articles and campaigns.
        </p>
      </div>

      {/* ── stats row ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <FileImage className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-2xl font-bold text-white">{assets.length}</p>
              <p className="text-xs text-zinc-500">Total assets</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <HardDrive className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-2xl font-bold text-white">{formatBytes(totalBytes)}</p>
              <p className="text-xs text-zinc-500">Storage used</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <Folder className="h-5 w-5 text-zinc-400" />
            <div>
              <p className="text-2xl font-bold text-white">{folders.length}</p>
              <p className="text-xs text-zinc-500">Folders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── search + refresh ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <Input
            className="pl-8"
            placeholder="Search media…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => void fetchMedia(currentFolderId, searchQ)}
          className="shrink-0"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-40 animate-pulse rounded-lg bg-white/4" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <>
          {/* ── folders section ── */}
          {folders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">Folders</h2>
                {currentFolderId && (
                  <button
                    onClick={() => setCurrentFolderId(null)}
                    className="text-xs text-zinc-400 hover:text-white transition"
                  >
                    ← All folders
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5.5 px-4 py-3 text-left transition hover:bg-white/10"
                  >
                    <Folder className="h-5 w-5 shrink-0 text-sky-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{folder.name}</p>
                      <p className="text-xs text-zinc-500">{folder.assetCount} assets</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* back button when in folder with no sub-folders shown */}
          {currentFolderId && folders.length === 0 && (
            <button
              onClick={() => setCurrentFolderId(null)}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              ← All folders
            </button>
          )}

          {/* ── assets grid ── */}
          {assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-white/10 py-20 text-zinc-500">
              <FileImage className="h-10 w-10 opacity-30" />
              <p className="text-sm">No assets found.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  {/* preview */}
                  <div className="aspect-square w-full overflow-hidden bg-zinc-900">
                    {asset.resourceType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.secureUrl}
                        alt={asset.altText ?? asset.publicId}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <FileImage className="h-10 w-10 text-zinc-600" />
                      </div>
                    )}
                  </div>

                  {/* meta */}
                  <CardContent className="space-y-1.5 py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral" className="text-[10px]">
                        {asset.resourceType}
                      </Badge>
                      {asset.format && (
                        <span className="text-[10px] text-zinc-500 uppercase">
                          {asset.format}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-300" title={asset.publicId}>
                      {asset.publicId.length > 40
                        ? `…${asset.publicId.slice(-37)}`
                        : asset.publicId}
                    </p>
                    <p className="text-xs text-zinc-500">{formatBytes(asset.bytes)}</p>
                    {asset.tags.length > 0 && (
                      <p className="truncate text-[10px] text-zinc-600">
                        {asset.tags.join(", ")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
