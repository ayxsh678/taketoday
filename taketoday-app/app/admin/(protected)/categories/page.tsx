"use client";

import { useEffect, useState } from "react";
import { ModulePage } from "@/components/admin/ModulePage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
    priority: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Transform the data to match our expected format
      // We'll need to get article counts for each category
      interface Category {
        id: string;
        name: string;
        slug: string;
      }
      
      const categoriesWithStats = await Promise.all(
        data.categories.map(async (category: Category) => {
          // Get article count for this category
          const articlesResponse = await fetch(`/api/admin/articles?category=${category.slug}`);
          const articlesData = await articlesResponse.json();
          const count = articlesData.articles.length;
          
          // For priority, we'll use a default value or calculate based on something
          // For now, let's use a placeholder
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            count: count,
            priority: count > 0 ? 80 : 0, // Placeholder priority
          };
        })
      );
      
      setCategories(categoriesWithStats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategorySlug.trim()) {
      alert("Please provide both name and slug");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName,
          slug: newCategorySlug,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add the new category to our list
      setCategories(prev => [
        ...prev,
        {
          id: data.category.id,
          name: data.category.name,
          slug: data.category.slug,
          count: 0,
          priority: 0,
        }
      ]);
      
      // Clear the form
      setNewCategoryName("");
      setNewCategorySlug("");
    } catch (err) {
      console.error("Failed to create category:", err);
      alert("Failed to create category. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ModulePage moduleKey="categories" />
      <Card>
        <CardHeader>
          <CardTitle>Editorial Taxonomy</CardTitle>
          <CardDescription>Category health, story coverage, and public navigation readiness.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Create category form */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Category Name
                </label>
                <Input
                  className="mt-2"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Category Slug
                </label>
                <Input
                  className="mt-2"
                  value={newCategorySlug}
                  onChange={(e) => setNewCategorySlug(e.target.value)}
                  placeholder="Enter category slug (e.g., technology)"
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleCreateCategory} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Add Category"}
                </Button>
              </div>
            </div>
            
            {/* Categories table */}
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
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-zinc-400">
                        Loading categories...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-red-400">
                        {error}
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-zinc-400">
                        No categories found
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category.slug} className="hover:bg-white/[0.03]">
                        <td className="px-4 py-4 font-medium text-white">{category.name}</td>
                        <td className="px-4 py-4 font-mono text-xs text-zinc-400">{category.slug}</td>
                        <td className="px-4 py-4 text-zinc-300">{category.count}</td>
                        <td className="px-4 py-4 text-zinc-300">{category.priority}</td>
                        <td className="px-4 py-4">
                          <Badge tone="green">active</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
