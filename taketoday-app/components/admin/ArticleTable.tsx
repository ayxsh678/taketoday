import { MoreHorizontal } from "lucide-react";
import { adminArticles } from "@/lib/admin/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusTone = {
  draft: "neutral",
  under_review: "amber",
  approved: "blue",
  scheduled: "violet",
  published: "green",
  archived: "red",
} as const;

export function ArticleTable() {
  return (
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
                <Button variant="ghost" className="h-8 w-8 px-0" aria-label={`Open actions for ${article.headline}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
