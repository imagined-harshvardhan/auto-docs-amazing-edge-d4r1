'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { VscArrowLeft, VscGitCommit, VscRefresh, VscChromeClose, VscChevronDown, VscChevronRight, VscFile, VscCheck, VscError, VscCode } from 'react-icons/vsc'

interface ChangeItem {
  file_path: string
  change_type: string
  description: string
  impact: string
}

interface ChangeReport {
  summary: string
  total_changes: number
  categories: {
    api_endpoints: ChangeItem[]
    schemas: ChangeItem[]
    configs: ChangeItem[]
    dependencies: ChangeItem[]
    code_patterns: ChangeItem[]
  }
}

interface Documentation {
  api_docs: string
  readme_sections: string
  changelog_entry: string
  summary: string
}

interface PublishResult {
  status: string
  branch_name: string
  pr_url: string
  pr_number: number
  commit_message: string
  files_updated: string[]
}

export interface AnalysisResult {
  change_report: ChangeReport
  documentation: Documentation
  pr: {
    id: string
    title: string
    pr_number: number
    author: string
    branch: string
  }
  analyzed_at: string
}

interface ReviewSectionProps {
  analysisResult: AnalysisResult | null
  isAnalyzing: boolean
  isPublishing: boolean
  publishResult: PublishResult | null
  onGoBack: () => void
  onCommitPush: (documentation: Documentation) => void
  onRegenerate: () => void
  onDiscard: () => void
  activeAgentId: string | null
  publishError: string | null
}

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  api_endpoints: { label: 'API Endpoints', color: 'text-amber-400' },
  schemas: { label: 'Schemas', color: 'text-blue-400' },
  configs: { label: 'Configuration', color: 'text-emerald-400' },
  dependencies: { label: 'Dependencies', color: 'text-purple-400' },
  code_patterns: { label: 'Code Patterns', color: 'text-pink-400' },
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

export default function ReviewSection({
  analysisResult,
  isAnalyzing,
  isPublishing,
  publishResult,
  onGoBack,
  onCommitPush,
  onRegenerate,
  onDiscard,
  activeAgentId,
  publishError,
}: ReviewSectionProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    api_endpoints: true,
    schemas: true,
    configs: false,
    dependencies: false,
    code_patterns: false,
  })
  const [editedDocs, setEditedDocs] = React.useState<Documentation | null>(null)
  const [activeDocTab, setActiveDocTab] = React.useState('api_docs')

  React.useEffect(() => {
    if (analysisResult?.documentation) {
      setEditedDocs({ ...analysisResult.documentation })
    }
  }, [analysisResult])

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getCategoryItems = (key: string): ChangeItem[] => {
    const cats = analysisResult?.change_report?.categories
    if (!cats) return []
    const items = (cats as Record<string, ChangeItem[]>)[key]
    return Array.isArray(items) ? items : []
  }

  if (isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col gap-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onGoBack} className="text-muted-foreground hover:text-foreground">
            <VscArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
        <Card className="bg-card border border-accent/30 shadow-lg shadow-black/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="h-8 w-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            </div>
            <h3 className="text-lg font-serif font-medium mb-2">Analyzing Code Changes</h3>
            <p className="text-sm text-muted-foreground mb-6">The coordinator agent is parsing your PR diff and generating documentation...</p>
            <div className="max-w-md mx-auto space-y-3">
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-4/5 bg-muted" />
              <Skeleton className="h-4 w-3/5 bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <VscCode className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-serif font-medium mb-2">No Analysis Results</h3>
        <p className="text-sm text-muted-foreground mb-4">Select a PR from the dashboard to start analyzing.</p>
        <Button variant="ghost" onClick={onGoBack} className="text-accent hover:text-accent/80">
          <VscArrowLeft className="h-4 w-4 mr-1" /> Go to Dashboard
        </Button>
      </div>
    )
  }

  const changeReport = analysisResult.change_report
  const docs = editedDocs || analysisResult.documentation

  return (
    <div className="flex-1 flex flex-col gap-4 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onGoBack} className="text-muted-foreground hover:text-foreground">
            <VscArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-serif font-semibold">PR #{analysisResult.pr?.pr_number ?? '--'}: {analysisResult.pr?.title ?? 'Analysis'}</h2>
            <p className="text-xs text-muted-foreground">by {analysisResult.pr?.author ?? 'unknown'} on {analysisResult.pr?.branch ?? '--'} | Analyzed {analysisResult.analyzed_at ?? '--'}</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
          {changeReport?.total_changes ?? 0} changes detected
        </Badge>
      </div>

      {/* Publish Success */}
      {publishResult && (
        <Card className="bg-emerald-950/30 border border-emerald-700/40 shadow-lg shadow-black/20">
          <CardContent className="p-4 flex items-start gap-3">
            <VscCheck className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-emerald-300 text-sm">Documentation Published</h4>
              <p className="text-xs text-emerald-400/70 mt-1">Branch: <span className="font-mono">{publishResult.branch_name ?? '--'}</span></p>
              <p className="text-xs text-emerald-400/70">Commit: {publishResult.commit_message ?? '--'}</p>
              {publishResult.pr_url && (
                <a href={publishResult.pr_url} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-300 underline mt-1 inline-block">
                  View PR #{publishResult.pr_number ?? '--'}
                </a>
              )}
              {Array.isArray(publishResult.files_updated) && publishResult.files_updated.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-emerald-400/70 mb-1">Files updated:</p>
                  {publishResult.files_updated.map((f, i) => (
                    <p key={i} className="text-xs font-mono text-emerald-300/60">{f}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {publishError && (
        <Card className="bg-red-950/30 border border-red-700/40 shadow-lg shadow-black/20">
          <CardContent className="p-4 flex items-start gap-3">
            <VscError className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-300 text-sm">Publish Failed</h4>
              <p className="text-xs text-red-400/70 mt-1">{publishError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two-panel split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
        {/* Left Panel: Changes */}
        <Card className="bg-card border border-border shadow-lg shadow-black/20 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-sm font-serif">Detected Changes</CardTitle>
            <p className="text-xs text-muted-foreground">{changeReport?.summary ?? 'Analysis complete'}</p>
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="pt-0 space-y-2">
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const items = getCategoryItems(key)
                if (items.length === 0) return null
                const expanded = expandedCategories[key] ?? false
                return (
                  <div key={key} className="border border-border rounded-lg overflow-hidden">
                    <button onClick={() => toggleCategory(key)} className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        {expanded ? <VscChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <VscChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-secondary">{items.length}</Badge>
                      </div>
                    </button>
                    {expanded && (
                      <div className="border-t border-border">
                        {items.map((item, idx) => (
                          <div key={idx} className="p-3 border-b border-border/50 last:border-b-0">
                            <div className="flex items-center gap-2 mb-1">
                              <VscFile className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs font-mono text-accent truncate">{item.file_path ?? '--'}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-secondary ml-auto flex-shrink-0">{item.change_type ?? '--'}</Badge>
                            </div>
                            <p className="text-xs text-foreground/80 ml-5">{item.description ?? ''}</p>
                            {item.impact && <p className="text-xs text-muted-foreground ml-5 mt-1">Impact: {item.impact}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </ScrollArea>
        </Card>

        {/* Right Panel: Documentation */}
        <Card className="bg-card border border-border shadow-lg shadow-black/20 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-sm font-serif">Generated Documentation</CardTitle>
            <p className="text-xs text-muted-foreground">{docs?.summary ?? 'Documentation generated'}</p>
          </CardHeader>
          <Tabs value={activeDocTab} onValueChange={setActiveDocTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 bg-secondary flex-shrink-0">
              <TabsTrigger value="api_docs" className="text-xs">API Docs</TabsTrigger>
              <TabsTrigger value="readme" className="text-xs">README</TabsTrigger>
              <TabsTrigger value="changelog" className="text-xs">Changelog</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <TabsContent value="api_docs" className="px-4 pb-4 mt-3">
                <Textarea
                  value={docs?.api_docs ?? ''}
                  onChange={(e) => setEditedDocs(prev => prev ? { ...prev, api_docs: e.target.value } : prev)}
                  className="min-h-[300px] font-mono text-xs bg-secondary border-border resize-none"
                  placeholder="API documentation will appear here..."
                />
              </TabsContent>
              <TabsContent value="readme" className="px-4 pb-4 mt-3">
                <Textarea
                  value={docs?.readme_sections ?? ''}
                  onChange={(e) => setEditedDocs(prev => prev ? { ...prev, readme_sections: e.target.value } : prev)}
                  className="min-h-[300px] font-mono text-xs bg-secondary border-border resize-none"
                  placeholder="README sections will appear here..."
                />
              </TabsContent>
              <TabsContent value="changelog" className="px-4 pb-4 mt-3">
                <Textarea
                  value={docs?.changelog_entry ?? ''}
                  onChange={(e) => setEditedDocs(prev => prev ? { ...prev, changelog_entry: e.target.value } : prev)}
                  className="min-h-[300px] font-mono text-xs bg-secondary border-border resize-none"
                  placeholder="Changelog entry will appear here..."
                />
              </TabsContent>
              <TabsContent value="preview" className="px-4 pb-4 mt-3">
                <div className="prose prose-invert prose-sm max-w-none">
                  {renderMarkdown(docs?.api_docs ?? '')}
                  <Separator className="my-4" />
                  {renderMarkdown(docs?.readme_sections ?? '')}
                  <Separator className="my-4" />
                  {renderMarkdown(docs?.changelog_entry ?? '')}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onDiscard} className="text-muted-foreground hover:text-destructive">
          <VscChromeClose className="h-4 w-4 mr-1" /> Discard
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isAnalyzing} className="border-border text-foreground hover:bg-secondary">
            <VscRefresh className="h-4 w-4 mr-1" /> Regenerate
          </Button>
          <Button
            size="sm"
            onClick={() => docs && onCommitPush(docs)}
            disabled={isPublishing || !docs || !!publishResult}
            className="bg-accent text-accent-foreground hover:bg-accent/80 font-medium"
          >
            {isPublishing ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground animate-spin" />
                Publishing...
              </span>
            ) : publishResult ? (
              <span className="flex items-center gap-1.5"><VscCheck className="h-4 w-4" /> Published</span>
            ) : (
              <span className="flex items-center gap-1.5"><VscGitCommit className="h-4 w-4" /> Commit & Push</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
