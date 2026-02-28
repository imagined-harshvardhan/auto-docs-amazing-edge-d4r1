'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { VscDashboard, VscHistory, VscSettingsGear, VscMenu, VscChromeClose, VscGitCommit, VscRepo } from 'react-icons/vsc'

import DashboardSection from './sections/DashboardSection'
import type { MergedPR } from './sections/DashboardSection'
import ReviewSection from './sections/ReviewSection'
import type { AnalysisResult } from './sections/ReviewSection'
import HistorySection from './sections/HistorySection'
import type { HistoryEntry } from './sections/HistorySection'
import SettingsSection from './sections/SettingsSection'
import type { AppSettings } from './sections/SettingsSection'
import OnboardingSection from './sections/OnboardingSection'
import type { OnboardingConfig, OnboardingResult, SourceMode } from './sections/OnboardingSection'

const COORDINATOR_AGENT_ID = '69a271e024f2adeb72b9fd14'
const PUBLISHER_AGENT_ID = '69a271e1f18a4f26754c8a98'
const ONBOARDING_AGENT_ID = '69a277988e6d0e51fd5cd32f'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const MOCK_PRS: MergedPR[] = [
  { id: '1', title: 'Add user authentication middleware', author: 'sarah.chen', author_avatar: '', merge_date: '2026-02-27', branch: 'main', files_changed: 12, additions: 340, deletions: 45, categories: ['api', 'config', 'code'], pr_number: 487, status: 'pending' },
  { id: '2', title: 'Migrate payments to Stripe v3 API', author: 'james.wright', author_avatar: '', merge_date: '2026-02-26', branch: 'main', files_changed: 8, additions: 220, deletions: 180, categories: ['api', 'deps', 'schema'], pr_number: 486, status: 'pending' },
  { id: '3', title: 'Add PostgreSQL connection pooling', author: 'maria.garcia', author_avatar: '', merge_date: '2026-02-25', branch: 'develop', files_changed: 5, additions: 95, deletions: 30, categories: ['config', 'deps'], pr_number: 485, status: 'analyzed' },
  { id: '4', title: 'Refactor error handling across services', author: 'alex.kumar', author_avatar: '', merge_date: '2026-02-24', branch: 'main', files_changed: 22, additions: 410, deletions: 290, categories: ['code', 'api'], pr_number: 484, status: 'pending' },
  { id: '5', title: 'Update user schema with profile fields', author: 'lisa.park', author_avatar: '', merge_date: '2026-02-23', branch: 'develop', files_changed: 6, additions: 150, deletions: 20, categories: ['schema', 'api'], pr_number: 483, status: 'committed' },
  { id: '6', title: 'Add Redis caching layer for sessions', author: 'sarah.chen', author_avatar: '', merge_date: '2026-02-22', branch: 'main', files_changed: 9, additions: 275, deletions: 55, categories: ['config', 'code', 'deps'], pr_number: 482, status: 'pending' },
]

const MOCK_HISTORY: HistoryEntry[] = [
  { id: 'h1', pr_name: 'Update user schema with profile fields', pr_number: 483, date_analyzed: '2026-02-23', changes_detected: 8, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/483', change_summary: 'Added profile_picture, bio, and social_links fields to User schema. Updated API endpoints for profile management.' },
  { id: 'h2', pr_name: 'Add PostgreSQL connection pooling', pr_number: 485, date_analyzed: '2026-02-25', changes_detected: 4, status: 'pending', github_pr_url: 'https://github.com/org/repo/pull/485', change_summary: 'Configured pgBouncer connection pooling. Updated database config with pool size and timeout settings.' },
  { id: 'h3', pr_name: 'Implement rate limiting middleware', pr_number: 479, date_analyzed: '2026-02-20', changes_detected: 6, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/479', change_summary: 'Added express-rate-limit with sliding window. New config for rate limit tiers per API key.' },
  { id: 'h4', pr_name: 'Migrate to TypeScript strict mode', pr_number: 475, date_analyzed: '2026-02-18', changes_detected: 32, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/475', change_summary: 'Enabled strict TypeScript checking. Fixed 32 type errors across 18 files. Updated tsconfig.json.' },
  { id: 'h5', pr_name: 'Add WebSocket support for notifications', pr_number: 471, date_analyzed: '2026-02-15', changes_detected: 11, status: 'discarded', github_pr_url: 'https://github.com/org/repo/pull/471', change_summary: 'WebSocket server setup with Socket.IO. New notification events and channel subscriptions.' },
  { id: 'h6', pr_name: 'Update Docker compose for dev env', pr_number: 468, date_analyzed: '2026-02-12', changes_detected: 3, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/468', change_summary: 'Updated docker-compose.yml with new service definitions. Added health checks and volume mounts.' },
  { id: 'h7', pr_name: 'Refactor auth token validation', pr_number: 465, date_analyzed: '2026-02-10', changes_detected: 7, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/465', change_summary: 'Replaced custom JWT validation with jose library. Updated refresh token flow and session management.' },
  { id: 'h8', pr_name: 'Add GraphQL subscriptions', pr_number: 460, date_analyzed: '2026-02-08', changes_detected: 14, status: 'pending', github_pr_url: 'https://github.com/org/repo/pull/460', change_summary: 'New subscription resolvers for real-time data. Updated schema with subscription types.' },
  { id: 'h9', pr_name: 'Optimize database queries for reports', pr_number: 456, date_analyzed: '2026-02-05', changes_detected: 5, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/456', change_summary: 'Added database indexes for report queries. Optimized N+1 queries with eager loading.' },
  { id: 'h10', pr_name: 'Add OpenAPI spec generation', pr_number: 452, date_analyzed: '2026-02-03', changes_detected: 9, status: 'committed', github_pr_url: 'https://github.com/org/repo/pull/452', change_summary: 'Auto-generate OpenAPI 3.0 spec from decorators. Added Swagger UI endpoint at /api/docs.' },
]

const DEFAULT_SETTINGS: AppSettings = {
  repoUrl: 'https://github.com/acme/backend-api',
  monitoredBranches: ['main', 'develop'],
  docPaths: ['docs/', 'README.md', 'CHANGELOG.md'],
  preferences: { apiEndpoints: true, schemas: true, configs: true, dependencies: true, codeExamples: true },
  outputFormat: 'markdown',
}

type Screen = 'dashboard' | 'review' | 'history' | 'settings' | 'onboarding'

const NAV_ITEMS: { key: Screen; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: VscDashboard },
  { key: 'onboarding', label: 'Onboarding', Icon: VscRepo },
  { key: 'history', label: 'History', Icon: VscHistory },
  { key: 'settings', label: 'Settings', Icon: VscSettingsGear },
]

const AGENTS = [
  { id: COORDINATOR_AGENT_ID, name: 'Documentation Coordinator', purpose: 'Analyzes PR diffs and generates documentation' },
  { id: PUBLISHER_AGENT_ID, name: 'Documentation Publisher', purpose: 'Commits documentation updates to repository' },
  { id: ONBOARDING_AGENT_ID, name: 'Repository Onboarding', purpose: 'Generates project docs from PR history' },
]

export default function Page() {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard')
  const [selectedPR, setSelectedPR] = useState<MergedPR | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [publishResult, setPublishResult] = useState<{ status: string; branch_name: string; pr_url: string; pr_number: number; commit_message: string; files_updated: string[] } | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>(MOCK_HISTORY)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSampleData, setShowSampleData] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | null>(null)
  const [isOnboarding, setIsOnboarding] = useState(false)

  const handleAnalyzePR = useCallback(async (pr: MergedPR) => {
    setSelectedPR(pr)
    setIsAnalyzing(true)
    setActiveAgentId(COORDINATOR_AGENT_ID)
    setAgentError(null)
    setPublishResult(null)
    setPublishError(null)
    setActiveScreen('review')

    try {
      const message = `Analyze this PR diff and generate documentation updates:\n\nPR Title: ${pr.title}\nPR Author: ${pr.author}\nPR Number: #${pr.pr_number}\nBranch: ${pr.branch}\nFiles Changed: ${pr.files_changed}\nAdditions: +${pr.additions}\nDeletions: -${pr.deletions}\nCategories: ${Array.isArray(pr.categories) ? pr.categories.join(', ') : ''}\n\nDiff Content:\nNo diff content available - analyze based on PR metadata`
      const result = await callAIAgent(message, COORDINATOR_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result as Record<string, unknown> | undefined
        const changeReport = (data?.change_report as Record<string, unknown>) ?? {}
        const cats = (changeReport?.categories as Record<string, unknown>) ?? {}
        const documentation = (data?.documentation as Record<string, unknown>) ?? {}

        const analysisData: AnalysisResult = {
          change_report: {
            summary: (changeReport?.summary as string) ?? 'Analysis complete',
            total_changes: (changeReport?.total_changes as number) ?? 0,
            categories: {
              api_endpoints: Array.isArray(cats?.api_endpoints) ? cats.api_endpoints : [],
              schemas: Array.isArray(cats?.schemas) ? cats.schemas : [],
              configs: Array.isArray(cats?.configs) ? cats.configs : [],
              dependencies: Array.isArray(cats?.dependencies) ? cats.dependencies : [],
              code_patterns: Array.isArray(cats?.code_patterns) ? cats.code_patterns : [],
            },
          },
          documentation: {
            api_docs: (documentation?.api_docs as string) ?? '',
            readme_sections: (documentation?.readme_sections as string) ?? '',
            changelog_entry: (documentation?.changelog_entry as string) ?? '',
            summary: (documentation?.summary as string) ?? '',
          },
          pr: { id: pr.id, title: pr.title, pr_number: pr.pr_number, author: pr.author, branch: pr.branch },
          analyzed_at: new Date().toLocaleString(),
        }
        setAnalysisResult(analysisData)
      } else {
        setAgentError(result?.error ?? 'Analysis failed')
      }
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsAnalyzing(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleCommitPush = useCallback(async (documentation: { api_docs: string; readme_sections: string; changelog_entry: string; summary: string }) => {
    if (!analysisResult) return
    setIsPublishing(true)
    setActiveAgentId(PUBLISHER_AGENT_ID)
    setPublishError(null)

    try {
      const message = `Commit these documentation updates to the repository:\n\nRepository: ${settings.repoUrl}\nBranch: docs/update-pr-${analysisResult.pr?.pr_number ?? 'unknown'}\nPR: #${analysisResult.pr?.pr_number ?? ''} - ${analysisResult.pr?.title ?? ''}\n\nDocumentation Content:\n${JSON.stringify(documentation, null, 2)}`
      const result = await callAIAgent(message, PUBLISHER_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result as Record<string, unknown> | undefined
        const pub = (data?.publish_result as Record<string, unknown>) ?? data ?? {}
        setPublishResult({
          status: (pub?.status as string) ?? 'success',
          branch_name: (pub?.branch_name as string) ?? '',
          pr_url: (pub?.pr_url as string) ?? '',
          pr_number: (pub?.pr_number as number) ?? 0,
          commit_message: (pub?.commit_message as string) ?? '',
          files_updated: Array.isArray(pub?.files_updated) ? pub.files_updated as string[] : [],
        })

        const newEntry: HistoryEntry = {
          id: `h-${Date.now()}`,
          pr_name: analysisResult.pr?.title ?? 'Unknown PR',
          pr_number: analysisResult.pr?.pr_number ?? 0,
          date_analyzed: new Date().toISOString().split('T')[0],
          changes_detected: analysisResult.change_report?.total_changes ?? 0,
          status: 'committed',
          github_pr_url: (pub?.pr_url as string) ?? '',
          change_summary: analysisResult.change_report?.summary ?? '',
        }
        setHistoryEntries(prev => [newEntry, ...prev])
      } else {
        setPublishError(result?.error ?? 'Publish failed')
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsPublishing(false)
      setActiveAgentId(null)
    }
  }, [analysisResult, settings.repoUrl])

  const handleRegenerate = useCallback(() => {
    if (selectedPR) handleAnalyzePR(selectedPR)
  }, [selectedPR, handleAnalyzePR])

  const handleDiscard = useCallback(() => {
    setAnalysisResult(null)
    setPublishResult(null)
    setPublishError(null)
    setActiveScreen('dashboard')
  }, [])

  const handleStartOnboarding = useCallback(async (config: OnboardingConfig) => {
    setIsOnboarding(true)
    setActiveAgentId(ONBOARDING_AGENT_ID)
    setAgentError(null)

    try {
      const includeList = Object.entries(config.includeOptions)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(', ')

      const sourceLabel = config.sourceMode === 'commits' ? 'commits' : 'closed PRs'
      const sourceInstruction = config.sourceMode === 'commits'
        ? `Source Mode: commits\nIMPORTANT: This repository may have no pull requests. Read the recent commit history directly instead. Analyze commit messages, changed files, and patterns in the last ${config.prCount} commits to build documentation.\n\nNumber of recent commits to analyze: ${config.prCount}`
        : `Source Mode: pull_requests\nNumber of recent closed PRs to analyze: ${config.prCount}`

      const message = `Analyze the repository and generate comprehensive project documentation for onboarding.\n\nRepository: ${config.repoUrl}\nBranches: ${config.branches.join(', ')}\n${sourceInstruction}\nInclude: ${includeList}\n\nPlease analyze the recent ${sourceLabel} from this repository and generate comprehensive documentation covering: project overview, technology stack, API reference, setup guide, development patterns, and changelog summary.`

      const result = await callAIAgent(message, ONBOARDING_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result as Record<string, unknown> | undefined
        const docs = (data?.onboarding_docs as Record<string, unknown>) ?? data ?? {}

        setOnboardingResult({
          docs: {
            project_overview: (docs?.project_overview as string) ?? '',
            technology_stack: (docs?.technology_stack as string) ?? '',
            api_reference: (docs?.api_reference as string) ?? '',
            setup_guide: (docs?.setup_guide as string) ?? '',
            development_patterns: (docs?.development_patterns as string) ?? '',
            changelog_summary: (docs?.changelog_summary as string) ?? '',
            full_readme: (docs?.full_readme as string) ?? '',
          },
          analyzed_at: new Date().toLocaleString(),
          prs_analyzed: config.prCount,
          repo_url: config.repoUrl,
          source_mode: config.sourceMode,
        })
      } else {
        setAgentError(result?.error ?? 'Onboarding analysis failed')
      }
    } catch (err) {
      setAgentError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsOnboarding(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleCommitOnboardingDocs = useCallback(async (docs: OnboardingResult['docs']) => {
    setIsPublishing(true)
    setActiveAgentId(PUBLISHER_AGENT_ID)
    setPublishError(null)
    setPublishResult(null)

    try {
      const message = `Commit these comprehensive project documentation files to the repository:\n\nRepository: ${settings.repoUrl}\nBranch: docs/onboarding-docs\n\nDocumentation Content:\n${JSON.stringify(docs, null, 2)}\n\nPlease create a PR with all the generated documentation files including README.md, docs/architecture.md, docs/api-reference.md, docs/setup-guide.md, docs/development-patterns.md, and CHANGELOG.md.`
      const result = await callAIAgent(message, PUBLISHER_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result as Record<string, unknown> | undefined
        const pub = (data?.publish_result as Record<string, unknown>) ?? data ?? {}
        setPublishResult({
          status: (pub?.status as string) ?? 'success',
          branch_name: (pub?.branch_name as string) ?? '',
          pr_url: (pub?.pr_url as string) ?? '',
          pr_number: (pub?.pr_number as number) ?? 0,
          commit_message: (pub?.commit_message as string) ?? '',
          files_updated: Array.isArray(pub?.files_updated) ? pub.files_updated as string[] : [],
        })
      } else {
        setPublishError(result?.error ?? 'Publish failed')
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setIsPublishing(false)
      setActiveAgentId(null)
    }
  }, [settings.repoUrl])

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-card border-r border-border flex flex-col transition-all duration-300 flex-shrink-0`}>
          <div className="p-4 flex items-center justify-between border-b border-border">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <VscGitCommit className="h-5 w-5 text-accent" />
                <span className="text-sm font-serif font-semibold tracking-tight">DocSync</span>
              </div>
            )}
            <button onClick={() => setSidebarCollapsed(prev => !prev)} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              {sidebarCollapsed ? <VscMenu className="h-4 w-4" /> : <VscChromeClose className="h-4 w-4" />}
            </button>
          </div>

          <nav className="flex-1 py-3 px-2 space-y-1">
            {NAV_ITEMS.map(({ key, label, Icon }) => {
              const isActive = activeScreen === key || (key === 'dashboard' && activeScreen === 'review')
              return (
                <button
                  key={key}
                  onClick={() => setActiveScreen(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
              )
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-3 border-t border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Agents</p>
              <div className="space-y-2">
                {AGENTS.map((agent) => (
                  <div key={agent.id} className="flex items-start gap-2">
                    <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${activeAgentId === agent.id ? 'bg-accent animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{agent.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {agentError && (
            <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-2 flex items-center justify-between">
              <p className="text-sm text-destructive">{agentError}</p>
              <button onClick={() => setAgentError(null)} className="text-destructive hover:text-destructive/80">
                <VscChromeClose className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {activeScreen === 'dashboard' && (
            <DashboardSection
              prs={MOCK_PRS}
              isAnalyzing={isAnalyzing}
              onAnalyzePR={handleAnalyzePR}
              showSampleData={showSampleData}
              onToggleSampleData={setShowSampleData}
              activeAgentId={activeAgentId}
            />
          )}

          {activeScreen === 'review' && (
            <ReviewSection
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
              isPublishing={isPublishing}
              publishResult={publishResult}
              onGoBack={() => setActiveScreen('dashboard')}
              onCommitPush={handleCommitPush}
              onRegenerate={handleRegenerate}
              onDiscard={handleDiscard}
              activeAgentId={activeAgentId}
              publishError={publishError}
            />
          )}

          {activeScreen === 'history' && (
            <HistorySection entries={historyEntries} showSampleData={showSampleData} />
          )}

          {activeScreen === 'settings' && (
            <SettingsSection settings={settings} onSettingsChange={setSettings} />
          )}

          {activeScreen === 'onboarding' && (
            <OnboardingSection
              isAnalyzing={isOnboarding}
              onStartAnalysis={handleStartOnboarding}
              analysisResult={onboardingResult}
              onCommitDocs={handleCommitOnboardingDocs}
              isPublishing={isPublishing}
              publishResult={publishResult}
              publishError={publishError}
              onBackToDashboard={() => { setOnboardingResult(null); setActiveScreen('dashboard') }}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
