"use client";

import { useState, useEffect } from "react";
import { useAutomationService } from "@/lib/python/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow, TableCaption } from "@/components/ui/table";
import { AlertTriangle, Bot, CheckCircle2, Clock, LayoutGrid, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AutomationPage() {
  const [jobs, setJobs] = useState<Array<any>>([]);
  const [sources, setSources] = useState<Array<any>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [newSourceName, setNewSourceName] = useState<string>("");
  const [newSourceUrl, setNewSourceUrl] = useState<string>("");
  const [newSourceType, setNewSourceType] = useState<string>("rss");
  const [searchParams] = useSearchParams();
  const router = useRouter();
  
  const { client, loading, error, execute } = useAutomationService();

  // Load initial data
  useEffect(() => {
    loadJobs();
    loadSources();
  }, []);

  const loadJobs = async () => {
    execute(async () => {
      const data = await client.getJobs(undefined, 20);
      setJobs(data.jobs || []);
    });
  };

  const loadSources = async () => {
    execute(async () => {
      const data = await client.getSources();
      setSources(data.sources || []);
    });
  };

  const handleRunFullPipeline = async () => {
    setIsRunning(true);
    try {
      await execute(async () => {
        const result = await client.runFullPipeline();
        // In a real implementation, we might get a job ID back
        console.log("Full pipeline started:", result);
        // Refresh jobs after a delay
        setTimeout(() => {
          loadJobs();
          setIsRunning(false);
        }, 2000);
      });
    } catch (err) {
      setIsRunning(false);
      console.error("Failed to run pipeline:", err);
    }
  };

  const handleScrapeSources = async () => {
    setIsScraping(true);
    try {
      await execute(async () => {
        const result = await client.scrapeSources();
        console.log("Scraping completed:", result);
        // Refresh jobs and sources after a delay
        setTimeout(() => {
          loadJobs();
          loadSources();
          setIsScraping(false);
        }, 3000);
      });
    } catch (err) {
      setIsScraping(false);
      console.error("Failed to scrape sources:", err);
    }
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) return;
    
    try {
      await execute(async () => {
        const result = await client.createSource({
          name: newSourceName,
          url: newSourceUrl,
          type: newSourceType,
        });
        console.log("Source created:", result);
        // Reset form and reload sources
        setNewSourceName("");
        setNewSourceUrl("");
        setNewSourceType("rss");
        loadSources();
      });
    } catch (err) {
      console.error("Failed to create source:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'queued':
      case 'pending':
        return <Badge tone="secondary">{status.toUpperCase()}</Badge>;
      case 'running':
        return <Badge tone="primary">{status.toUpperCase()}</Badge>;
      case 'succeeded':
      case 'success':
        return <Badge tone="success">{status.toUpperCase()}</Badge>;
      case 'failed':
      case 'error':
        return <Badge tone="destructive">{status.toUpperCase()}</Badge>;
      case 'retrying':
        return <Badge tone="warning">{status.toUpperCase()}</Badge>;
      default:
        return <Badge tone="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Bot className="h-10 w-10 mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-400">Loading automation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex-1">
          <Badge tone="blue">Automation</Badge>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white lg:text-4xl">Automation Hub</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            Scheduled scraping, AI processing, and deliverable generation with single-click pipeline execution.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={handleRunFullPipeline}
            disabled={isRunning || loading}
            variant="primary"
            className="px-6 py-3"
          >
            {isRunning ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Running Pipeline...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Run Full Pipeline
              </>
            )}
          </Button>
          <Button 
            onClick={handleScrapeSources}
            disabled={isScraping || loading}
            variant="secondary"
            className="px-6 py-3"
          >
            {isScraping ? (
              <>
                <Bot className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Scrape Sources
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Automation service health and activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Service</span>
              <span className="flex items-center gap-2">
                <Circle className="h-3 w-3 
                  {loading ? 'bg-yellow-400 animate-pulse' 
                  : !error && navigator.onLine ? 'bg-green-400' : 'bg-red-400'}"/>
                <span className="text-xs">{loading ? 'Starting...' : !error && navigator.onLine ? 'Online' : 'Offline'}</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Last Activity</span>
              <span className="text-xs text-zinc-400">Just now</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Queue Depth</span>
              <span className="text-xs font-mono text-zinc-200">{jobs.filter(j => j.status === 'QUEUED' || j.status === 'RUNNING').length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
            <CardDescription>Configured news sources for scraping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Active</span>
              <span className="text-xs font-mono text-zinc-200">{sources.filter(s => s.active).length}/{sources.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Last Scrape</span>
              <span className="text-xs text-zinc-400">
                {sources.reduce((latest, source) => {
                  const sourceTime = source.lastScraped ? new Date(source.lastScraped) : new Date(0);
                  return sourceTime > latest ? sourceTime : latest;
                }, new Date(0)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Total Articles</span>
              <span className="text-xs font-mono text-zinc-200">{sources.reduce((total, source) => total + (source.articles?.length || 0), 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Output</CardTitle>
            <CardDescription>AI-generated content and deliverables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Headlines</span>
              <span className="text-xs font-mono text-zinc-200">12</span>
            </div>
            <div class="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Captions</span>
              <span className="text-xs font-mono text-zinc-200">45</span>
            </div>
            <div class="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Newsletters</span>
              <span className="text-xs font-mono text-zinc-200">3</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>Automation efficiency metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div class="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Success Rate</span>
              <span className="text-xs font-mono text-zinc-200">94%</span>
            </div>
            <div class="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Avg Job Time</span>
              <span className="text-xs font-mono text-zinc-200">2.3s</span>
            </div>
            <div class="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">Cost Saved</span>
              <span className="text-xs font-mono text-zinc-200">$127</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Queue */}
      <Card className="border border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Job Queue</CardTitle>
          <CardDescription className="mt-1 text-sm text-zinc-400">
            Recent automation jobs and their status
          </CardDescription>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => router.refresh()}>
              <Zap className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger className="h-9 w-9 px-2">
                <Button variant="ghost" size="icon">
                  <Bot className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuItem onClick={() => { /* Filter logic */ }}>
                  All Jobs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { /* Filter logic */ }}>
                  Running
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { /* Filter logic */ }}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { /* Filter logic */ }}>
                  Failed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <Bot className="h-8 w-8 mx-auto mb-4" />
              <p className="text-zinc-400">No jobs in queue</p>
            </div>
          ) : (
            <Table className="w-full">
              <TableCaption className="text-zinc-400">
                Recent automation jobs (last 20)
              </TableCaption>
              <TableHead>
                <TableRow>
                  <TableCell className="w-24">Job ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell className="w-20">Status</TableCell>
                  <TableCell className="w-20">Started</TableCell>
                  <TableCell className="w-20">Duration</TableCell>
                  <TableCell className="w-20">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="border-b border-white/5">
                    <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm text-zinc-300">{job.type}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : '-'}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-zinc-400">
                      {job.startedAt && job.completedAt ? 
                        `${Math.floor((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s` : 
                        job.startedAt ? `${Math.floor((Date.now() - new Date(job.startedAt).getTime()) / 1000)}s` : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { /* View details */ }}>
                          <Search className="h-3 w-3" />
                        </Button>
                        {job.status === 'RUNNING' || job.status === 'QUEUED' ? (
                          <Button variant="destructive" size="icon" onClick={() => { /* Cancel job */ }}>
                            <X className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Source Management */}
      <Card className="border border-white/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Source Management</CardTitle>
          <CardDescription className="mt-1 text-sm text-zinc-400">
            Configure and manage news sources for automated scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add Source Form */}
          <form onSubmit={handleAddSource} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">Source Name</label>
                <input
                  type="text"
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g., TechCrunch, Reuters, Bloomberg"
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:ring-2 focus:ring-white/[0.1]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-200 mb-1">Source URL</label>
                <input
                  type="text"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                  placeholder="e.g., https://techcrunch.com/feed/"
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:ring-2 focus:ring-white/[0.1]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-200 mb-1">Source Type</label>
              <select
                value={newSourceType}
                onChange={(e) => setNewSourceType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/[0.03] text-white focus:outline-none focus:ring-2 focus:ring-white/[0.1]"
              >
                <option value="rss">RSS Feed</option>
                <option value="website">Website Scraping</option>
                <option value="api">API Endpoint</option>
              </select>
            </div>
            <Button type="submit" variant="primary" className="w-full px-4 py-3">
              Add Source
            </Button>
          </form>

          {/* Sources List */}
          <div className="space-y-4">
            {sources.length === 0 ? (
              <div className="text-center py-6 text-zinc-400">
                <LayoutGrid className="h-8 w-8 mx-auto mb-4" />
                <p className="text-zinc-400">No sources configured. Add your first source above.</p>
              </div>
            ) : (
              <Table className="w-full">
                <TableHead>
                  <TableRow>
                    <TableCell className="w-20">Name</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell className="w-16">Type</TableCell>
                    <TableCell className="w-16">Status</TableCell>
                    <TableCell className="w-16">Last Scraped</TableCell>
                    <TableCell className="w-16">Articles</TableCell>
                    <TableCell className="w-20">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sources.map((source) => (
                    <TableRow key={source.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-sm">{source.name}</TableCell>
                      <TableCell className="text-xs break-all">{source.url}</TableCell>
                      <TableCell className="text-xs text-zinc-300">{source.type}</TableCell>
                      <TableCell>
                        <Badge 
                          tone={source.active ? 'success' : 'destructive'} 
                          size="sm"
                        >
                          {source.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {source.lastScraped ? new Date(source.lastScraped).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-zinc-400">{source.articles?.length || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => { /* Edit source */ }}>
                            <Search className="h-3 w-3" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => { /* Delete source */ }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for status indicator
function Circle({ className, ...props }: React.SVGProps<SVGCircleElement> & { className?: string }) {
  return (
    <circle cx="12" cy="12" r="10" {...props} className={className} />
  );
}

// Helper component for X icon
function X({ className, ...props }: React.SVGProps<SVGPathElement> & { className?: string }) {
  return (
    <path 
      fill-rule="evenodd" 
      d="M16.97 0l-.708-.708L12 10.29l-4.243-4.243L8.66 0l-.708.708L10.29 1.41l-4.243 4.243L0 8.66l.708.708L1.41 10.29l4.243 4.243L8.66 16l.708.708L10.29 14.59l4.243-4.243L16 8.66l.708-.708z" 
      {...props} 
      className={className} 
    />
  );
}