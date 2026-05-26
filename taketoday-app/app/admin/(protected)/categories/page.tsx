import { adminArticles } from "@/lib/admin/data";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const categories = Array.from(
  adminArticles.reduce((map, article) => {
    const current = map.get(article.category) ?? { count: 0, priority: 0 };
    map.set(article.category, {
      count: current.count + 1,
      priority: Math.max(current.priority, article.priorityScore),
    });
    return map;
  }, new Map<string, { count: number; priority: number }>()),
).map(([name, stats]) => ({ name, ...stats, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }));

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <ModulePage moduleKey="categories" />
      <Card>
        <CardHeader>
          <CardTitle>Editorial Taxonomy</CardTitle>
          <CardDescription>Category health, story coverage, and public navigation readiness.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Stories</th>
                  <th className="px-4 py-3 font-medium">Top Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {categories.map((category) => (
                  <tr key={category.slug} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-4 font-medium text-white">{category.name}</td>
                    <td className="px-4 py-4 font-mono text-xs text-zinc-400">{category.slug}</td>
                    <td className="px-4 py-4 text-zinc-300">{category.count}</td>
                    <td className="px-4 py-4 text-zinc-300">{category.priority}</td>
                    <td className="px-4 py-4">
                      <Badge tone="green">active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
