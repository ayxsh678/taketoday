"use client";

import { useState } from "react";
import { Check, Edit3, Eye, MoreHorizontal, X } from "lucide-react";
import { adminArticles } from "@/lib/admin/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { AdminArticle } from "@/lib/admin/types";

const statusTone = {
  draft: "neutral",
  under_review: "amber",
  approved: "blue",
  scheduled: "violet",
  published: "green",
  archived: "red",
} as const;

export function ArticleTable() {
  const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null);
  const [draftHeadline, setDraftHeadline] = useState("");
  const [draftSubheadline, setDraftSubheadline] = useState("");

  const openEditor = (article: AdminArticle) => {
    setSelectedArticle(article);
    setDraftHeadline(article.headline);
    setDraftSubheadline(article.subheadline);
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-medium">Story</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Desk</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {adminArticles.map((article) => (
              <tr key={article.id} className="hover:bg-white/[0.03]">
                <td className="max-w-md px-4 py-4">
                  <p className="font-medium text-white">{article.headline}</p>
                  <p className="mt-1 clamp-1 text-zinc-500">{article.subheadline}</p>
                </td>
                <td className="px-4 py-4">
                  <Badge tone={statusTone[article.status]}>{article.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-4 text-zinc-300">{article.category}</td>
                <td className="px-4 py-4 text-zinc-300">{article.priorityScore}</td>
                <td className="px-4 py-4 text-zinc-300">{article.author}</td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" className="h-8 w-8 px-0" aria-label={`Preview ${article.headline}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 px-0"
                      aria-label={`Edit ${article.headline}`}
                      onClick={() => openEditor(article)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="h-8 w-8 px-0" aria-label={`More actions for ${article.headline}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Article editor</p>
                <h2 className="mt-1 text-lg font-semibold text-white">{selectedArticle.slug}</h2>
              </div>
              <Button variant="ghost" className="h-8 w-8 px-0" aria-label="Close editor" onClick={() => setSelectedArticle(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 p-5">
              <label className="block text-sm font-medium text-zinc-300">
                Headline
                <Input className="mt-2" value={draftHeadline} onChange={(event) => setDraftHeadline(event.target.value)} />
              </label>
              <label className="block text-sm font-medium text-zinc-300">
                Subheadline
                <Textarea className="mt-2 min-h-24" value={draftSubheadline} onChange={(event) => setDraftSubheadline(event.target.value)} />
              </label>
              <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-zinc-500">Status</p>
                  <p className="mt-1 text-white">{selectedArticle.status.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Category</p>
                  <p className="mt-1 text-white">{selectedArticle.category}</p>
                </div>
                <div>
                  <p className="text-zinc-500">Priority</p>
                  <p className="mt-1 text-white">{selectedArticle.priorityScore}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 p-5">
              <Button variant="secondary" onClick={() => setSelectedArticle(null)}>
                Cancel
              </Button>
              <Button onClick={() => setSelectedArticle(null)}>
                <Check className="h-4 w-4" />
                Save draft
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
