'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { VscGitPullRequest, VscFile, VscGitMerge, VscSearch } from 'react-icons/vsc'

export interface MergedPR {
  id: string
  title: string
  author: string
  author_avatar: string
  merge_date: string
  branch: string
  files_changed: number
  additions: number
  deletions: number
  categories: string[]
  pr_number: number
  status: 'pending' | 'analyzed' | 'committed' | 'discarded'
}

interface DashboardSectionProps {
  prs: MergedPR[]
  isAnalyzing: boolean
  onAnalyzePR: (pr: MergedPR) => void
  showSampleData: boolean
  onToggleSampleData: (val: boolean) => void
  activeAgentId: string | null
}

const CATEGORY_COLORS: Record<string, string> = {
  api: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  schema: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  config: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  deps: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  code: 'bg-pink-900/40 text-pink-300 border-pink-700/50',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  analyzed: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  committed: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  discarded: 'bg-red-900/40 text-red-300 border-red-700/50',
}

export default function DashboardSection({
  prs,
  isAnalyzing,
  onAnalyzePR,
  showSampleData,
  onToggleSampleData,
  activeAgentId,
}: DashboardSectionProps) {
  const [branchFilter, setBranchFilter] = React.useState('all')
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredPRs = React.useMemo(() => {
    let filtered = prs
    if (branchFilter !== 'all') {
      filtered = filtered.filter(pr => pr.branch === branchFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(pr =>
        pr.title.toLowerCase().includes(q) || pr.author.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [prs, branchFilter, searchQuery])

  const pendingCount = prs.filter(p => p.status === 'pending').length
  const analyzedCount = prs.filter(p => p.status === 'analyzed' || p.status === 'committed').length
  const uniqueBranches = Array.from(new Set(prs.map(p => p.branch)))

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
      {/* Top bar: Title + Sample Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor merged pull requests and trigger documentation analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
          <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={onToggleSampleData} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border border-border shadow-lg shadow-black/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
              <VscGitPullRequest className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pending PRs</p>
              <p className="text-2xl font-semibold">{showSampleData ? pendingCount : 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg shadow-black/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-900/30 flex items-center justify-center">
              <VscGitMerge className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last Analyzed</p>
              <p className="text-sm font-medium">{showSampleData ? '2 hours ago' : '--'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg shadow-black/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <VscFile className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Doc Updates</p>
              <p className="text-2xl font-semibold">{showSampleData ? analyzedCount : 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <VscSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search PRs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px] bg-secondary border-border">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {uniqueBranches.map(b => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* PR List */}
      <ScrollArea className="flex-1">
        {!showSampleData ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <VscGitPullRequest className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-serif font-medium mb-2">No PRs to display</h3>
            <p className="text-sm text-muted-foreground max-w-md">Enable Sample Data to see example merged pull requests, or connect your repository in Settings to start monitoring.</p>
          </div>
        ) : filteredPRs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No PRs match your filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3 pr-4">
            {filteredPRs.map((pr) => (
              <Card key={pr.id} className="bg-card border border-border shadow-lg shadow-black/20 hover:border-accent/50 transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <VscGitPullRequest className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-xs text-muted-foreground font-mono">#{pr.pr_number}</span>
                        <Badge variant="outline" className={STATUS_COLORS[pr.status] || 'bg-secondary'}>
                          {pr.status}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-sm truncate">{pr.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <div className="h-4 w-4 rounded-full bg-accent/30 flex items-center justify-center text-[9px] font-bold text-accent-foreground">
                            {pr.author.charAt(0).toUpperCase()}
                          </div>
                          {pr.author}
                        </span>
                        <span>{pr.merge_date}</span>
                        <span className="font-mono">{pr.branch}</span>
                        <span className="flex items-center gap-1">
                          <VscFile className="h-3 w-3" />
                          {pr.files_changed} files
                        </span>
                        <span className="text-emerald-400">+{pr.additions}</span>
                        <span className="text-red-400">-{pr.deletions}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        {Array.isArray(pr.categories) && pr.categories.map((cat) => (
                          <Badge key={cat} variant="outline" className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[cat] || 'bg-secondary'}`}>
                            {cat.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={isAnalyzing || pr.status === 'committed'}
                      onClick={() => onAnalyzePR(pr)}
                      className="bg-accent text-accent-foreground hover:bg-accent/80 font-medium text-xs shrink-0"
                    >
                      {isAnalyzing && activeAgentId ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                          Analyzing...
                        </span>
                      ) : pr.status === 'committed' ? 'Committed' : 'Analyze PR'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Loading skeleton overlay */}
      {isAnalyzing && (
        <Card className="bg-card border border-accent/30 shadow-lg shadow-black/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-4 w-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
              <p className="text-sm text-accent font-medium">Analyzing code changes...</p>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
