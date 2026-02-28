'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VscHistory, VscChevronDown, VscChevronRight, VscLinkExternal } from 'react-icons/vsc'

export interface HistoryEntry {
  id: string
  pr_name: string
  pr_number: number
  date_analyzed: string
  changes_detected: number
  status: 'committed' | 'pending' | 'discarded'
  github_pr_url: string
  change_summary: string
}

interface HistorySectionProps {
  entries: HistoryEntry[]
  showSampleData: boolean
}

const STATUS_COLORS: Record<string, string> = {
  committed: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  pending: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  discarded: 'bg-red-900/40 text-red-300 border-red-700/50',
}

export default function HistorySection({ entries, showSampleData }: HistorySectionProps) {
  const [expandedRow, setExpandedRow] = React.useState<string | null>(null)
  const [sortField, setSortField] = React.useState<'date_analyzed' | 'changes_detected' | 'status'>('date_analyzed')
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc')

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const sortedEntries = React.useMemo(() => {
    const sorted = [...entries]
    sorted.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date_analyzed') {
        cmp = a.date_analyzed.localeCompare(b.date_analyzed)
      } else if (sortField === 'changes_detected') {
        cmp = a.changes_detected - b.changes_detected
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [entries, sortField, sortDir])

  const displayEntries = showSampleData ? sortedEntries : []

  function SortIndicator({ field }: { field: typeof sortField }) {
    if (sortField !== field) return null
    return <span className="ml-1 text-accent">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
      <div>
        <h1 className="text-2xl font-serif font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Review past documentation analysis and publishing activity</p>
      </div>

      <Card className="bg-card border border-border shadow-lg shadow-black/20 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-sm font-serif flex items-center gap-2">
            <VscHistory className="h-4 w-4 text-accent" />
            Analysis History
            {displayEntries.length > 0 && (
              <Badge variant="outline" className="bg-secondary text-xs">{displayEntries.length} entries</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-1">
          <CardContent className="pt-0">
            {displayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <VscHistory className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-base font-serif font-medium mb-2">No history yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {showSampleData ? 'No entries found.' : 'Analyze a PR from the Dashboard to start building your documentation history.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground text-xs w-8"></TableHead>
                    <TableHead className="text-muted-foreground text-xs">PR Name</TableHead>
                    <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort('date_analyzed')}>
                      Date Analyzed<SortIndicator field="date_analyzed" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort('changes_detected')}>
                      Changes<SortIndicator field="changes_detected" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                      Status<SortIndicator field="status" />
                    </TableHead>
                    <TableHead className="text-muted-foreground text-xs">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayEntries.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <TableRow
                        className="border-border cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => setExpandedRow(prev => prev === entry.id ? null : entry.id)}
                      >
                        <TableCell className="py-3">
                          {expandedRow === entry.id ? (
                            <VscChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <VscChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <div>
                            <span className="text-sm font-medium">{entry.pr_name}</span>
                            <span className="text-xs text-muted-foreground font-mono ml-2">#{entry.pr_number}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-muted-foreground">{entry.date_analyzed}</TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm font-mono">{entry.changes_detected}</span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[entry.status] || 'bg-secondary'}`}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          {entry.github_pr_url && (
                            <a
                              href={entry.github_pr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:text-accent/80 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <VscLinkExternal className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRow === entry.id && (
                        <TableRow className="border-border bg-secondary/20">
                          <TableCell colSpan={6} className="py-3 px-8">
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium text-foreground mb-1">Change Summary</p>
                              <p>{entry.change_summary || 'No summary available.'}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  )
}
