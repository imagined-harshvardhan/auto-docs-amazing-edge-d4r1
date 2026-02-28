'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VscSettingsGear, VscCheck, VscAdd, VscChromeClose } from 'react-icons/vsc'

export interface AppSettings {
  repoUrl: string
  monitoredBranches: string[]
  docPaths: string[]
  preferences: {
    apiEndpoints: boolean
    schemas: boolean
    configs: boolean
    dependencies: boolean
    codeExamples: boolean
  }
  outputFormat: 'markdown' | 'rst'
}

interface SettingsSectionProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export default function SettingsSection({ settings, onSettingsChange }: SettingsSectionProps) {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings)
  const [saved, setSaved] = React.useState(false)
  const [newBranch, setNewBranch] = React.useState('')
  const [newDocPath, setNewDocPath] = React.useState('')

  const handleSave = () => {
    onSettingsChange(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addBranch = () => {
    if (newBranch.trim() && !localSettings.monitoredBranches.includes(newBranch.trim())) {
      setLocalSettings(prev => ({
        ...prev,
        monitoredBranches: [...prev.monitoredBranches, newBranch.trim()],
      }))
      setNewBranch('')
    }
  }

  const removeBranch = (branch: string) => {
    setLocalSettings(prev => ({
      ...prev,
      monitoredBranches: prev.monitoredBranches.filter(b => b !== branch),
    }))
  }

  const addDocPath = () => {
    if (newDocPath.trim() && !localSettings.docPaths.includes(newDocPath.trim())) {
      setLocalSettings(prev => ({
        ...prev,
        docPaths: [...prev.docPaths, newDocPath.trim()],
      }))
      setNewDocPath('')
    }
  }

  const removeDocPath = (path: string) => {
    setLocalSettings(prev => ({
      ...prev,
      docPaths: prev.docPaths.filter(p => p !== path),
    }))
  }

  const togglePref = (key: keyof AppSettings['preferences']) => {
    setLocalSettings(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: !prev.preferences[key] },
    }))
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
      <div>
        <h1 className="text-2xl font-serif font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure repository monitoring and documentation preferences</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4 max-w-2xl">
          {/* Repository Configuration */}
          <Card className="bg-card border border-border shadow-lg shadow-black/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-serif flex items-center gap-2">
                <VscSettingsGear className="h-4 w-4 text-accent" />
                Repository Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="repo-url" className="text-xs text-muted-foreground">Repository URL</Label>
                <Input
                  id="repo-url"
                  value={localSettings.repoUrl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, repoUrl: e.target.value }))}
                  placeholder="https://github.com/org/repo"
                  className="bg-secondary border-border mt-1 font-mono text-sm"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Monitored Branches</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBranch()}
                    placeholder="e.g. main, develop"
                    className="bg-secondary border-border font-mono text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={addBranch} className="border-border shrink-0">
                    <VscAdd className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Array.isArray(localSettings.monitoredBranches) && localSettings.monitoredBranches.map((branch) => (
                    <Badge key={branch} variant="outline" className="bg-secondary text-xs flex items-center gap-1">
                      <span className="font-mono">{branch}</span>
                      <button onClick={() => removeBranch(branch)} className="hover:text-destructive transition-colors">
                        <VscChromeClose className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Documentation File Paths</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newDocPath}
                    onChange={(e) => setNewDocPath(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDocPath()}
                    placeholder="e.g. docs/, README.md"
                    className="bg-secondary border-border font-mono text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={addDocPath} className="border-border shrink-0">
                    <VscAdd className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {Array.isArray(localSettings.docPaths) && localSettings.docPaths.map((path) => (
                    <Badge key={path} variant="outline" className="bg-secondary text-xs flex items-center gap-1">
                      <span className="font-mono">{path}</span>
                      <button onClick={() => removeDocPath(path)} className="hover:text-destructive transition-colors">
                        <VscChromeClose className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documentation Preferences */}
          <Card className="bg-card border border-border shadow-lg shadow-black/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-serif">Documentation Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'apiEndpoints' as const, label: 'API Endpoints', desc: 'Track changes to REST/GraphQL endpoints' },
                { key: 'schemas' as const, label: 'Database Schemas', desc: 'Monitor schema migrations and model changes' },
                { key: 'configs' as const, label: 'Configuration Files', desc: 'Detect changes in config and env files' },
                { key: 'dependencies' as const, label: 'Dependencies', desc: 'Track package.json, requirements.txt changes' },
                { key: 'codeExamples' as const, label: 'Code Examples', desc: 'Generate usage examples for changed functions' },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.desc}</p>
                  </div>
                  <Switch
                    checked={localSettings.preferences[pref.key]}
                    onCheckedChange={() => togglePref(pref.key)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Output Format */}
          <Card className="bg-card border border-border shadow-lg shadow-black/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-serif">Output Format</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={localSettings.outputFormat}
                onValueChange={(val) => setLocalSettings(prev => ({ ...prev, outputFormat: val as 'markdown' | 'rst' }))}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="markdown" id="fmt-md" />
                  <Label htmlFor="fmt-md" className="flex flex-col cursor-pointer">
                    <span className="text-sm font-medium">Markdown (.md)</span>
                    <span className="text-xs text-muted-foreground">Standard GitHub-flavored markdown</span>
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="rst" id="fmt-rst" />
                  <Label htmlFor="fmt-rst" className="flex flex-col cursor-pointer">
                    <span className="text-sm font-medium">reStructuredText (.rst)</span>
                    <span className="text-xs text-muted-foreground">Sphinx-compatible documentation format</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* GitHub Connection Status */}
          <Card className="bg-card border border-border shadow-lg shadow-black/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-serif">Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm">GitHub API Connected</span>
                <Badge variant="outline" className="bg-emerald-900/30 text-emerald-300 border-emerald-700/50 text-xs ml-auto">Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center gap-3 pb-4">
            <Button
              onClick={handleSave}
              className="bg-accent text-accent-foreground hover:bg-accent/80 font-medium"
            >
              {saved ? (
                <span className="flex items-center gap-1.5"><VscCheck className="h-4 w-4" /> Saved</span>
              ) : (
                'Save Settings'
              )}
            </Button>
            {saved && <span className="text-xs text-emerald-400">Settings saved successfully</span>}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
