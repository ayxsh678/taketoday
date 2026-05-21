import { ArrowRight, CheckCircle2, Lock, Search, Sparkles } from "lucide-react";
import { auditEvents, moduleBlueprints, type ModuleKey } from "@/lib/admin/modules";
import { engagementSeries, roleMatrix, socialPlatforms } from "@/lib/admin/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { MiniChart } from "@/components/admin/MiniChart";
import { useAdminStore } from "@/components/admin/admin-store";
import { useState, useEffect, useCallback, useRef } from "react";

export function ModulePage({ moduleKey }: { moduleKey: ModuleKey }) {
  const blueprint = moduleBlueprints[moduleKey];
  const { role, setSelectedCategory } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [draftInstructions, setDraftInstructions] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setIsSearching(true);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Set new timeout
    searchDebounceRef.current = setTimeout(() => {
      // Perform search based on module
      performSearch(value);
      setIsSearching(false);
    }, 300); // 300ms debounce
  }, []);

  // Debounced filter handler
  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
    
    // Clear previous timeout
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }
    
    // Set new timeout
    filterDebounceRef.current = setTimeout(() => {
      // Apply filter based on module
      applyFilter(value);
    }, 300); // 300ms debounce
  }, []);

  // Perform search based on module
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      let results = [];
      // In a real implementation, we would call the appropriate API endpoint
      // For now, we'll simulate with mock data based on module
      switch (moduleKey) {
        case "content":
          // Search articles - using mock data for now
          const mockArticles = [
            { id: "1", headline: "OpenAI launches enterprise workspace controls", author: "TakeToday Desk", tags: ["OpenAI", "Enterprise AI", "Governance"] },
            { id: "2", headline: "India's UPI merchant caps create a new fintech battleground", author: "Meera Iyer", tags: ["UPI", "Fintech", "India"] },
            { id: "3", headline: "Nvidia's datacenter run rate keeps pressure on cloud buyers", author: "Aarav Shah", tags: ["Nvidia", "Cloud", "Chips"] },
            { id: "4", headline: "Creator economy teams move from tools to AI production stacks", author: "TakeToday Desk", tags: ["Creator Economy", "AI Tools", "Startups"] },
          ];
          results = mockArticles.filter(article => 
            article.headline.toLowerCase().includes(query.toLowerCase()) ||
            article.author.toLowerCase().includes(query.toLowerCase()) ||
            article.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          );
          break;
        case "ai":
          // Search AI jobs - using mock data for now
          const mockAiJobs = [
            { id: "1", title: "Rewrite article", type: "rewrite" },
            { id: "2", title: "Generate hashtags", type: "hashtags" },
            { id: "3", title: "Run fact-check", type: "fact-check" },
            { id: "4", title: "Create debate", type: "debate" },
          ];
          results = mockAiJobs.filter(job => 
            job.title.toLowerCase().includes(query.toLowerCase()) ||
            job.type.toLowerCase().includes(query.toLowerCase())
          );
          break;
        // Add more cases for other modules as needed
        default:
          results = [];
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  }, [moduleKey]);

  // Apply filter based on module
  const applyFilter = useCallback(async (filter: string) => {
    if (!filter.trim()) {
      // Reset to default view
      return;
    }

    try {
      // In a real implementation, we would filter the data based on the selected filter
      // For now, we'll just log the filter
      console.log(`Applying filter: ${filter} for module: ${moduleKey}`);
    } catch (error) {
      console.error("Filter error:", error);
    }
  }, [moduleKey]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (filterDebounceRef.current) {
        clearTimeout(filterDebounceRef.current);
      }
    };
  }, []);

  // Handle draft instructions change
  const handleDraftInstructionsChange = useCallback((value: string) => {
    setDraftInstructions(value);
  }, []);

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex-1">
          <Badge tone="blue">{blueprint.eyebrow}</Badge>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">{blueprint.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">{blueprint.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {blueprint.actions.slice(0, 3).map((action, index) => (
            <Button 
              key={action} 
              variant={index === 0 ? "primary" : "secondary"} 
              className="px-6 py-3"
            >
              {action}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid gap-8 sm:grid-cols-[1.3fr_0.9fr]">
        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Operational Workspace</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Fast controls for the module’s most common workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                placeholder="Search records, people, sources..." 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-12"
                isLoading={isSearching}
              />
              <Input 
                placeholder="Filter by status, role, platform..." 
                value={filterValue}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {blueprint.actions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-6 py-4 text-left text-sm font-medium text-zinc-200 transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/[0.1]"
                >
                  {action}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              ))}
            </div>
            <Textarea 
              placeholder="Draft instructions, review notes, source URLs, or API payload notes..." 
              value={draftInstructions}
              onChange={(e) => handleDraftInstructionsChange(e.target.value)}
              className="h-32"
            />
          </CardContent>
        </Card>

         <Card className="border border-white/5">
           <CardHeader className="pb-4">
             <CardTitle className="text-lg font-semibold">Controls and Security</CardTitle>
             <CardDescription className="mt-1 text-sm text-zinc-400">
               Production controls wired for RBAC, auditability, and safe automation.
             </CardDescription>
           </CardHeader>
           <CardContent className="pt-4 space-y-4">
             <div className="space-y-3">
               {/* RBAC Enforced - Dynamic based on user role */}
               <div 
                 className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
               >
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                 <div>
                   <p className="font-medium">RBAC enforced</p>
                   <p className="text-xs text-zinc-400">
                     Role-based access control active for {role || 'unknown'} role
                   </p>
                 </div>
               </div>
               
               {/* Audit logs captured */}
               <div 
                 className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
               >
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                 Audit logs captured
               </div>
               
               {/* Rate-limit ready */}
               <div 
                 className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
               >
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                 Rate-limit ready
               </div>
               
               {/* Validation via Zod */}
               <div 
                 className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
               >
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                 Validation via Zod
               </div>
               
               {/* 2FA-ready sessions */}
               <div 
                 className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
               >
                 <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                 2FA-ready sessions
               </div>
             </div>
           </CardContent>
         </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Performance Signal</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Interactive chart surface for module-level outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <MiniChart data={engagementSeries} className="h-48 w-full" />
          </CardContent>
        </Card>

        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">AI Actions</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Assistant patterns ready for OpenAI or Claude providers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {["Summarize", "Rewrite", "Generate hashtags", "Bullish perspective", "Bearish perspective"].map((item) => (
              <Button 
                key={item} 
                variant="secondary" 
                className="w-full flex items-center justify-between px-5 py-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4" />
                  {item}
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {moduleKey === "users" && (
        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Permission Matrix</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              Role boundaries for the current admin architecture.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 md:grid-cols-2">
            {roleMatrix.map((role) => (
              <div 
                key={role.role} 
                className="flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-3">
                  <Badge tone="violet" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">{role.role}</span>
                  </Badge>
                </div>
                <p className="text-sm text-zinc-300 leading-6">{role.access}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {moduleKey === "social" && (
        <Card className="border border-white/5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Platform Preview</CardTitle>
            <CardDescription className="mt-1 text-sm text-zinc-400">
              One composer, platform-specific rendering and retry logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid gap-4 md:grid-cols-3">
            {socialPlatforms.map((platform) => (
              <div 
                key={platform} 
                className="flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-zinc-950/20 px-5 py-4 transition-colors hover:bg-zinc-950/30"
              >
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4" />
                  <span className="font-medium text-white">{platform}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300 leading-6">
                  Preview, schedule, publish, and inspect retries for {platform}.
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Audit Trail</CardTitle>
          <CardDescription className="mt-1 text-sm text-zinc-400">
            Every sensitive action should write here before shipping to production.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {auditEvents.map((event) => (
            <div 
              key={`${event.actor}-${event.at}`} 
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.03]"
            >
              <span className="flex items-center gap-3">
                <span className="text-white">{event.actor}</span> {event.event}
              </span>
              <span className="text-zinc-400">{event.at}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
