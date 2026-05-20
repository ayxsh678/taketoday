import { ArticleTable } from "@/components/admin/ArticleTable";
import { ModulePage } from "@/components/admin/ModulePage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <ModulePage moduleKey="content" />
      <Card>
        <CardHeader>
          <CardTitle>Editorial Queue</CardTitle>
          <CardDescription>Advanced filters, search, pagination, and bulk actions attach to this table surface.</CardDescription>
        </CardHeader>
        <CardContent>
          <ArticleTable />
        </CardContent>
      </Card>
    </div>
  );
}
