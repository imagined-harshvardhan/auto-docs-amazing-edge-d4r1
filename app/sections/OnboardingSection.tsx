'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  VscRepo,
  VscGitPullRequest,
  VscBook,
  VscCode,
  VscServer,
  VscTools,
  VscChecklist,
  VscDesktopDownload,
  VscGitCommit,
  VscArrowLeft,
  VscCheck,
  VscChevronRight,
  VscAdd,
  VscChromeClose,
  VscRefresh,
} from 'react-icons/vsc'

export type SourceMode = 'pull_requests' | 'commits'

export interface OnboardingConfig {
  repoUrl: string
  prCount: number
  branches: string[]
  sourceMode: SourceMode
  includeOptions: {
    architecture: boolean
    apiReference: boolean
    setupGuide: boolean
    techStack: boolean
    devPatterns: boolean
    changelog: boolean
  }
}

export interface OnboardingResult {
  docs: {
    project_overview: string
    technology_stack: string
    api_reference: string
    setup_guide: string
    development_patterns: string
    changelog_summary: string
    full_readme: string
  }
  analyzed_at: string
  prs_analyzed: number
  repo_url: string
  source_mode: SourceMode
}

interface PublishResult {
  status: string
  branch_name: string
  pr_url: string
  pr_number: number
  commit_message: string
  files_updated: string[]
}

interface OnboardingSectionProps {
  isAnalyzing: boolean
  onStartAnalysis: (config: OnboardingConfig) => void
  analysisResult: OnboardingResult | null
  onCommitDocs: (docs: OnboardingResult['docs']) => void
  isPublishing: boolean
  publishResult: PublishResult | null
  publishError: string | null
  onBackToDashboard: () => void
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('```')) return <div key={i} className="border-t border-border/30 my-1" />
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (line.startsWith('  ') && line.trim()) return <pre key={i} className="font-mono text-xs bg-secondary/50 px-3 py-1 rounded">{line}</pre>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const codeParts = text.split(/`([^`]+)`/g)
  if (codeParts.length > 1) {
    return codeParts.map((part, i) =>
      i % 2 === 1 ? <code key={i} className="font-mono text-xs bg-secondary px-1 py-0.5 rounded text-accent">{part}</code> : formatBold(part)
    )
  }
  return formatBold(text)
}

function formatBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

const DEFAULT_CONFIG: OnboardingConfig = {
  repoUrl: '',
  prCount: 20,
  branches: ['main'],
  sourceMode: 'pull_requests',
  includeOptions: {
    architecture: true,
    apiReference: true,
    setupGuide: true,
    techStack: true,
    devPatterns: true,
    changelog: true,
  },
}

const INCLUDE_OPTIONS: { key: keyof OnboardingConfig['includeOptions']; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'architecture', label: 'Architecture Overview', Icon: VscServer },
  { key: 'apiReference', label: 'API Reference', Icon: VscCode },
  { key: 'setupGuide', label: 'Setup Guide', Icon: VscTools },
  { key: 'techStack', label: 'Technology Stack', Icon: VscChecklist },
  { key: 'devPatterns', label: 'Development Patterns', Icon: VscBook },
  { key: 'changelog', label: 'Changelog', Icon: VscGitPullRequest },
]

const DOC_TABS: { key: keyof OnboardingResult['docs']; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'project_overview', label: 'Project Overview', Icon: VscRepo },
  { key: 'technology_stack', label: 'Tech Stack', Icon: VscChecklist },
  { key: 'api_reference', label: 'API Reference', Icon: VscCode },
  { key: 'setup_guide', label: 'Setup Guide', Icon: VscTools },
  { key: 'development_patterns', label: 'Dev Patterns', Icon: VscBook },
  { key: 'changelog_summary', label: 'Changelog', Icon: VscGitPullRequest },
  { key: 'full_readme', label: 'Full README', Icon: VscDesktopDownload },
]

const PROGRESS_STEPS_PR = [
  'Connecting to repository...',
  'Fetching closed PRs...',
  'Analyzing PR history...',
  'Generating documentation...',
]

const PROGRESS_STEPS_COMMITS = [
  'Connecting to repository...',
  'Reading commit history...',
  'Analyzing commit patterns...',
  'Generating documentation...',
]

export default function OnboardingSection({
  isAnalyzing,
  onStartAnalysis,
  analysisResult,
  onCommitDocs,
  isPublishing,
  publishResult,
  publishError,
  onBackToDashboard,
}: OnboardingSectionProps) {
  const [config, setConfig] = React.useState<OnboardingConfig>(DEFAULT_CONFIG)
  const [branchInput, setBranchInput] = React.useState('')
  const [activeDocTab, setActiveDocTab] = React.useState<string>('project_overview')
  const [progressStep, setProgressStep] = React.useState(0)

  const progressSteps = config.sourceMode === 'commits' ? PROGRESS_STEPS_COMMITS : PROGRESS_STEPS_PR

  React.useEffect(() => {
    if (!isAnalyzing) {
      setProgressStep(0)
      return
    }
    setProgressStep(0)
    const interval = setInterval(() => {
      setProgressStep(prev => {
        if (prev < progressSteps.length - 1) return prev + 1
        return prev
      })
    }, 2800)
    return () => clearInterval(interval)
  }, [isAnalyzing, progressSteps.length])

  const handleAddBranch = () => {
    const trimmed = branchInput.trim()
    if (trimmed && !config.branches.includes(trimmed)) {
      setConfig(prev => ({ ...prev, branches: [...prev.branches, trimmed] }))
    }
    setBranchInput('')
  }

  const handleRemoveBranch = (branch: string) => {
    setConfig(prev => ({ ...prev, branches: prev.branches.filter(b => b !== branch) }))
  }

  const handleToggleOption = (key: keyof OnboardingConfig['includeOptions']) => {
    setConfig(prev => ({
      ...prev,
      includeOptions: { ...prev.includeOptions, [key]: !prev.includeOptions[key] },
    }))
  }

  const handleExportAll = () => {
    if (!analysisResult?.docs) return
    const docs = analysisResult.docs
    const sections = [
      `# Project Overview\n\n${docs.project_overview ?? ''}`,
      `# Technology Stack\n\n${docs.technology_stack ?? ''}`,
      `# API Reference\n\n${docs.api_reference ?? ''}`,
      `# Setup Guide\n\n${docs.setup_guide ?? ''}`,
      `# Development Patterns\n\n${docs.development_patterns ?? ''}`,
      `# Changelog Summary\n\n${docs.changelog_summary ?? ''}`,
      `---\n\n# Full README\n\n${docs.full_readme ?? ''}`,
    ]
    const content = sections.join('\n\n---\n\n')
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'onboarding-docs.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const canStart = config.repoUrl.trim().length > 0 && config.branches.length > 0

  // -- Step 2: Loading / Analysis in Progress --
  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="text-muted-foreground hover:text-foreground">
            <VscArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-lg font-serif font-semibold">Onboarding Analysis</h2>
        </div>

        <Card className="bg-card border border-accent/30 shadow-lg shadow-black/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin flex-shrink-0" />
              <h3 className="text-base font-serif font-medium text-accent">Analyzing Repository</h3>
            </div>

            <div className="space-y-4 mb-6">
              {progressSteps.map((step, idx) => {
                const isDone = idx < progressStep
                const isActive = idx === progressStep
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-accent/20' : isActive ? 'bg-accent/10 border border-accent/40' : 'bg-secondary'}`}>
                      {isDone ? (
                        <VscCheck className="h-3.5 w-3.5 text-accent" />
                      ) : isActive ? (
                        <span className="h-3 w-3 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                      )}
                    </div>
                    <span className={`text-sm ${isDone ? 'text-foreground' : isActive ? 'text-accent font-medium' : 'text-muted-foreground'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">{config.sourceMode === 'commits' ? 'Reading commits...' : 'Discovering PRs...'}</p>
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-4/5 bg-muted" />
              <Skeleton className="h-4 w-3/5 bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // -- Step 3: Results View --
  if (analysisResult) {
    const docs = analysisResult.docs
    return (
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="text-muted-foreground hover:text-foreground">
              <VscArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h2 className="text-lg font-serif font-semibold">Onboarding Documentation</h2>
              <p className="text-xs text-muted-foreground">
                {analysisResult.prs_analyzed ?? 0} {analysisResult.source_mode === 'commits' ? 'commits' : 'PRs'} analyzed from{' '}
                <span className="font-mono text-accent">{analysisResult.repo_url ?? '--'}</span>
                {' '}| Generated {analysisResult.analyzed_at ?? '--'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
            <VscBook className="h-3 w-3 mr-1" /> 7 docs generated
          </Badge>
        </div>

        {/* Publish Success */}
        {publishResult && (
          <Card className="bg-emerald-950/30 border border-emerald-700/40 shadow-lg shadow-black/20 flex-shrink-0">
            <CardContent className="p-4 flex items-start gap-3">
              <VscCheck className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-emerald-300 text-sm">Documentation Committed</h4>
                <p className="text-xs text-emerald-400/70 mt-1">Branch: <span className="font-mono">{publishResult.branch_name ?? '--'}</span></p>
                {publishResult.pr_url && (
                  <a href={publishResult.pr_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-300 underline mt-1 inline-block">
                    View PR #{publishResult.pr_number ?? '--'}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {publishError && (
          <Card className="bg-red-950/30 border border-red-700/40 shadow-lg shadow-black/20 flex-shrink-0">
            <CardContent className="p-4 flex items-start gap-3">
              <VscChromeClose className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-300 text-sm">Commit Failed</h4>
                <p className="text-xs text-red-400/70 mt-1">{publishError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabbed Documentation View */}
        <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="bg-secondary flex-shrink-0 flex-wrap h-auto gap-1 p-1">
            {DOC_TABS.map(({ key, label, Icon }) => (
              <TabsTrigger key={key} value={key} className="text-xs gap-1.5 data-[state=active]:bg-accent/15 data-[state=active]:text-accent">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollArea className="flex-1 mt-3">
            {DOC_TABS.map(({ key }) => (
              <TabsContent key={key} value={key} className="m-0">
                <Card className="bg-card border border-border shadow-lg shadow-black/20">
                  <CardContent className="p-5">
                    {(docs?.[key] ?? '').length > 0 ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        {renderMarkdown(docs[key] ?? '')}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No content generated for this section.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between pt-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="text-muted-foreground hover:text-foreground">
            <VscArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setConfig(prev => ({ ...prev })); }} className="border-border text-foreground hover:bg-secondary">
              <VscRefresh className="h-4 w-4 mr-1" /> Re-analyze
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll} className="border-border text-foreground hover:bg-secondary">
              <VscDesktopDownload className="h-4 w-4 mr-1" /> Export All
            </Button>
            <Button
              size="sm"
              onClick={() => docs && onCommitDocs(docs)}
              disabled={isPublishing || !!publishResult}
              className="bg-accent text-accent-foreground hover:bg-accent/80 font-medium"
            >
              {isPublishing ? (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                  Committing...
                </span>
              ) : publishResult ? (
                <span className="flex items-center gap-1.5"><VscCheck className="h-4 w-4" /> Committed</span>
              ) : (
                <span className="flex items-center gap-1.5"><VscGitCommit className="h-4 w-4" /> Commit to Repository</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // -- Step 1: Configuration Form --
  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBackToDashboard} className="text-muted-foreground hover:text-foreground">
          <VscArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div>
          <h2 className="text-2xl font-serif font-semibold tracking-tight">Repository Onboarding</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate comprehensive project documentation by analyzing your repository's PR history or commit log</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Repository Configuration */}
        <Card className="bg-card border border-border shadow-lg shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-serif flex items-center gap-2">
              <VscRepo className="h-4 w-4 text-accent" />
              Repository Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Repo URL */}
            <div className="space-y-2">
              <Label htmlFor="repo-url" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">GitHub Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/owner/repo"
                value={config.repoUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, repoUrl: e.target.value }))}
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>

            {/* Source Mode */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Analysis Source</Label>
              <p className="text-xs text-muted-foreground mb-2">Choose what to analyze. Use commits if the repo has no PRs.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, sourceMode: 'pull_requests' }))}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-lg border text-sm transition-all duration-200 ${config.sourceMode === 'pull_requests' ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <VscGitPullRequest className="h-4 w-4 flex-shrink-0" />
                  <div className="text-left">
                    <span className="font-medium block text-xs">Pull Requests</span>
                    <span className="text-[10px] opacity-70">Closed / merged PRs</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, sourceMode: 'commits' }))}
                  className={`flex items-center gap-2.5 px-3 py-3 rounded-lg border text-sm transition-all duration-200 ${config.sourceMode === 'commits' ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <VscGitCommit className="h-4 w-4 flex-shrink-0" />
                  <div className="text-left">
                    <span className="font-medium block text-xs">Commits</span>
                    <span className="text-[10px] opacity-70">Direct commit history</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Count */}
            <div className="space-y-2">
              <Label htmlFor="pr-count" className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {config.sourceMode === 'commits' ? 'Number of Recent Commits to Analyze' : 'Number of Recent Closed PRs to Analyze'}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="pr-count"
                  type="number"
                  min={1}
                  max={config.sourceMode === 'commits' ? 100 : 50}
                  value={config.prCount}
                  onChange={(e) => setConfig(prev => ({ ...prev, prCount: Math.min(config.sourceMode === 'commits' ? 100 : 50, Math.max(1, parseInt(e.target.value) || 1)) }))}
                  className="bg-secondary border-border w-24 text-sm"
                />
                <span className="text-xs text-muted-foreground">max {config.sourceMode === 'commits' ? 100 : 50}</span>
              </div>
            </div>

            {/* Branches */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Branches to Analyze</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.branches.map(branch => (
                  <Badge key={branch} variant="outline" className="bg-accent/10 text-accent border-accent/30 gap-1 pr-1">
                    <span className="font-mono text-xs">{branch}</span>
                    <button onClick={() => handleRemoveBranch(branch)} className="ml-1 hover:text-destructive transition-colors">
                      <VscChromeClose className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add branch..."
                  value={branchInput}
                  onChange={(e) => setBranchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBranch() } }}
                  className="bg-secondary border-border text-sm flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleAddBranch} disabled={!branchInput.trim()} className="border-border hover:bg-secondary">
                  <VscAdd className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Options */}
        <Card className="bg-card border border-border shadow-lg shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-serif flex items-center gap-2">
              <VscChecklist className="h-4 w-4 text-accent" />
              Include in Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {INCLUDE_OPTIONS.map(({ key, label, Icon }) => (
              <div key={key} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </div>
                <Switch
                  checked={config.includeOptions[key]}
                  onCheckedChange={() => handleToggleOption(key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CTA Button */}
      <div className="max-w-5xl">
        <Button
          size="lg"
          onClick={() => onStartAnalysis(config)}
          disabled={!canStart || isAnalyzing}
          className="bg-accent text-accent-foreground hover:bg-accent/80 font-medium w-full sm:w-auto px-8"
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
              Starting Analysis...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <VscChevronRight className="h-4 w-4" />
              Start Onboarding Analysis
            </span>
          )}
        </Button>
        {!canStart && (
          <p className="text-xs text-muted-foreground mt-2">Enter a repository URL and at least one branch to continue.</p>
        )}
      </div>
    </div>
  )
}
