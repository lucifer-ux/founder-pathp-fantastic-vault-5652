'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Search, ClipboardList, FileText, DollarSign, Flag, Cpu, HelpCircle, ChevronDown, ChevronUp, ArrowRight, Clock, Zap, Database, ShieldCheck, FileCheck, Loader2, Send, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

export interface ChatMsg {
  id: string
  role: 'user' | 'agent' | 'system'
  agentName?: string
  agentStage?: number
  text?: string
  data?: any
  dataType?: 'brief' | 'compliance' | 'execution' | 'filing' | 'financial' | 'platform' | 'support'
  questions?: string[]
  error?: string
  retryFn?: () => void
}

export interface ThinkingState {
  active: boolean
  agentName: string
  description: string
  stage: number
}

interface ChatInterfaceProps {
  messages: ChatMsg[]
  thinking: ThinkingState | null
  onSendMessage: (msg: string) => void
  loading: boolean
  briefConfirmed: boolean
  briefData: any
  onConfirmBrief: () => void
  onEditBrief: () => void
  editingBrief: boolean
  editFields: any
  onEditFieldChange: (key: string, value: string) => void
  onDoneEditing: () => void
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
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

function safeStringify(val: unknown): string {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (Array.isArray(val)) {
    return val.map((item) => {
      if (typeof item === 'string') return item
      if (typeof item === 'object' && item !== null) {
        return Object.entries(item).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(', ')
      }
      return String(item)
    }).join('; ')
  }
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
      .join(', ')
  }
  return String(val)
}

const STAGE_ICONS: Record<number, React.ElementType> = {
  2: Search,
  3: ClipboardList,
  4: FileText,
  5: DollarSign,
  6: Flag,
}

const BRIEF_FIELDS: { key: string; label: string }[] = [
  { key: 'business_name', label: 'Business Name' },
  { key: 'business_type', label: 'Business Type' },
  { key: 'target_region', label: 'Target Region' },
  { key: 'revenue_model', label: 'Revenue Model' },
  { key: 'recommended_structure', label: 'Structure' },
  { key: 'target_market', label: 'Target Market' },
  { key: 'key_products_services', label: 'Products / Services' },
  { key: 'initial_compliance_considerations', label: 'Compliance Notes' },
]

const THINKING_PHASES: Record<number, string[]> = {
  0: ['Looking up relevant information...', 'Searching knowledge base...', 'Preparing response...'],
  1: ['Analyzing your business concept...', 'Evaluating market viability...', 'Generating clarifying questions...', 'Drafting business brief...'],
  2: ['Researching business licensing requirements...', 'Checking legal compliance frameworks...', 'Analyzing IP and patent landscape...', 'Evaluating regulatory risks...', 'Compiling master compliance report...'],
  3: ['Planning entity formation steps...', 'Mapping licensing and permits...', 'Setting up tax registration flow...', 'Coordinating IP filing timeline...', 'Building execution dashboard...'],
  4: ['Generating step-by-step filing guides...', 'Preparing document checklists...', 'Identifying required forms...', 'Compiling filing instructions...'],
  5: ['Researching banking options...', 'Evaluating payment processors...', 'Finding applicable grants and loans...', 'Comparing accounting tools...', 'Finalizing financial setup plan...'],
  6: ['Assessing online presence needs...', 'Generating platform recommendations...', 'Building launch timeline...', 'Preparing journey summary...'],
}

const PHASE_ICONS: React.ElementType[] = [Cpu, Database, ShieldCheck, FileCheck, Zap]

function ThinkingIndicator({ thinking }: { thinking: ThinkingState }) {
  const [elapsed, setElapsed] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
    setElapsed(0)
    setPhaseIndex(0)
  }, [thinking.agentName, thinking.stage])

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const phases = THINKING_PHASES[thinking.stage] ?? THINKING_PHASES[0]
    const interval = setInterval(() => {
      setPhaseIndex(prev => (prev + 1) % phases.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [thinking.stage])

  const phases = THINKING_PHASES[thinking.stage] ?? THINKING_PHASES[0]
  const currentPhase = phases[phaseIndex]
  const PhaseIcon = PHASE_ICONS[phaseIndex % PHASE_ICONS.length]

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] w-full bg-[#111827] border border-[#6366F1]/20 rounded-xl px-4 py-3 shadow-lg shadow-[#6366F1]/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-[#6366F1]/15 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-[#818CF8] animate-spin" />
          </div>
          <span className="text-xs font-semibold text-[#818CF8]">{thinking.agentName}</span>
          {thinking.stage > 0 && (
            <Badge className="bg-[#6366F1]/10 text-[#818CF8] border-0 text-[9px]">Stage {thinking.stage}/6</Badge>
          )}
          <div className="ml-auto flex items-center gap-1.5 bg-[#1E293B] rounded-full px-2 py-0.5">
            <Clock className="w-3 h-3 text-[#94A3B8]" />
            <span className="text-[10px] font-mono text-[#94A3B8]">{formatTime(elapsed)}</span>
          </div>
        </div>

        <p className="text-xs text-[#CBD5E1] mb-3">{thinking.description}</p>

        <div className="bg-[#0B1120] rounded-lg p-2.5 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <PhaseIcon className="w-3.5 h-3.5 text-[#A5B4FC] animate-pulse" />
            <span className="text-[11px] text-[#A5B4FC] font-medium transition-all duration-500">{currentPhase}</span>
          </div>
          <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#6366F1] rounded-full animate-progress-bar" />
          </div>
        </div>

        {elapsed > 30 && (
          <p className="text-[10px] text-[#64748B] mt-1">
            {elapsed > 90 ? 'Complex multi-agent research in progress -- this may take a couple of minutes...' :
             elapsed > 60 ? 'Still working -- coordinating multiple research agents...' :
             'AI agents are researching thoroughly -- hang tight...'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ChatInterface({
  messages,
  thinking,
  onSendMessage,
  loading,
  briefConfirmed,
  briefData,
  onConfirmBrief,
  onEditBrief,
  editingBrief,
  editFields,
  onEditFieldChange,
  onDoneEditing,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [collapsedMsgs, setCollapsedMsgs] = useState<Set<string>>(new Set())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleCollapse = (id: string) => {
    setCollapsedMsgs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderAgentResult(msg: ChatMsg) {
    const collapsed = collapsedMsgs.has(msg.id)
    const stageIcon = msg.agentStage ? STAGE_ICONS[msg.agentStage] : null
    const StageIcon = stageIcon ?? Cpu

    return (
      <div className="max-w-[90%]">
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
          <button onClick={() => toggleCollapse(msg.id)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[#1A2035] transition-colors">
            <div className="w-6 h-6 rounded-md bg-[#6366F1]/15 flex items-center justify-center shrink-0">
              <StageIcon className="w-3.5 h-3.5 text-[#818CF8]" />
            </div>
            <span className="text-xs font-medium text-[#818CF8]">{msg.agentName ?? 'Agent'}</span>
            {collapsed ? <ChevronDown className="w-3.5 h-3.5 ml-auto text-[#64748B]" /> : <ChevronUp className="w-3.5 h-3.5 ml-auto text-[#64748B]" />}
          </button>
          {!collapsed && (
            <div className="px-4 pb-4 pt-1">
              {msg.text && <div className="text-sm text-foreground/90 leading-relaxed">{renderMarkdown(msg.text)}</div>}
              {Array.isArray(msg.questions) && msg.questions.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {msg.questions.map((q, j) => (
                    <div key={j} className="text-sm bg-[#6366F1]/5 border border-[#6366F1]/10 rounded-lg px-3 py-2 text-foreground/80">{q}</div>
                  ))}
                </div>
              )}
              {msg.dataType === 'brief' && briefData && !briefConfirmed && renderBriefCard()}
              {msg.data && msg.dataType !== 'brief' && renderDataSummary(msg)}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderBriefCard() {
    return (
      <Card className="mt-3 border-[#6366F1]/20 bg-[#0F1629]">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-[#6366F1]/15 text-[#818CF8] border-0 text-[10px]">Business Brief</Badge>
            <span className="text-sm font-medium">{briefData?.business_name ?? 'Untitled'}</span>
          </div>
          {editingBrief ? (
            <div className="space-y-2">
              {BRIEF_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</label>
                  <input value={editFields?.[key] ?? ''} onChange={(e) => onEditFieldChange(key, e.target.value)} className="w-full mt-0.5 px-2 py-1.5 text-sm bg-[#1E293B] border border-[#334155] rounded-md text-foreground outline-none focus:border-[#6366F1]/50" />
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={onDoneEditing} className="mt-2 text-xs">Done Editing</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {BRIEF_FIELDS.map(({ key, label }) => (
                <div key={key} className={key === 'key_products_services' || key === 'initial_compliance_considerations' ? 'col-span-2' : ''}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-xs mt-0.5">{briefData?.[key] ?? '-'}</p>
                </div>
              ))}
            </div>
          )}
          {briefData?.structure_reasoning && (
            <div className="bg-[#1E293B] rounded-lg p-2 mt-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Reasoning</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{briefData.structure_reasoning}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={onEditBrief} className="text-xs border-[#334155]">Edit</Button>
            <Button size="sm" onClick={onConfirmBrief} className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white">
              Confirm and Continue
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  function renderDataSummary(msg: ChatMsg) {
    const d = msg.data
    if (!d || typeof d !== 'object') return null
    const entries = Object.entries(d).filter(([k]) => k !== 'message')
    if (entries.length === 0) return null
    return (
      <div className="mt-3 space-y-2">
        {entries.slice(0, 4).map(([key, val]) => {
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          if (typeof val === 'string') {
            return (
              <div key={key} className="bg-[#1E293B]/50 rounded-lg p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#64748B] mb-1">{label}</p>
                <div className="text-xs text-foreground/80">{renderMarkdown(val)}</div>
              </div>
            )
          }
          if (Array.isArray(val)) {
            return (
              <div key={key} className="bg-[#1E293B]/50 rounded-lg p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#64748B] mb-1">{label}</p>
                <p className="text-xs text-foreground/70">{val.length} items -- see details in side panel</p>
              </div>
            )
          }
          if (val && typeof val === 'object') {
            const subEntries = Object.entries(val as Record<string, unknown>)
            return (
              <div key={key} className="bg-[#1E293B]/50 rounded-lg p-2">
                <p className="text-[10px] uppercase tracking-wider text-[#64748B] mb-1">{label}</p>
                {subEntries.slice(0, 3).map(([sk, sv]) => {
                  const displayed = safeStringify(sv)
                  return (
                    <div key={sk} className="mb-1">
                      <span className="text-[10px] text-[#64748B]">{sk.replace(/_/g, ' ')}: </span>
                      <span className="text-xs">{displayed.slice(0, 120)}{displayed.length > 120 ? '...' : ''}</span>
                    </div>
                  )
                })}
                {subEntries.length > 3 && <p className="text-[10px] text-[#64748B]">+{subEntries.length - 3} more fields in side panel</p>}
              </div>
            )
          }
          return null
        })}
        {entries.length > 4 && <p className="text-[10px] text-[#64748B]">See full details in Your Business Journey panel</p>}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="px-4 py-6 space-y-4 min-h-full flex flex-col justify-end">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/10 flex items-center justify-center mx-auto mb-5">
                  <Cpu className="w-7 h-7 text-[#818CF8]" />
                </div>
                <h2 className="text-xl font-bold mb-2">Start your business journey</h2>
                <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">Describe your business idea and our AI agents will guide you through research, compliance, filing, financials, and launch.</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['SaaS platform for...', 'E-commerce store selling...', 'Consulting firm focused on...'].map((hint, i) => (
                    <button key={i} onClick={() => setInput(hint)} className="text-xs bg-[#1E293B] hover:bg-[#334155] px-3 py-1.5 rounded-full text-[#94A3B8] hover:text-foreground transition-colors border border-[#334155]/50">{hint}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[75%] bg-[#6366F1] text-white rounded-2xl rounded-br-md px-4 py-2.5">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              )
            }
            if (msg.role === 'system') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <p className="text-xs text-[#94A3B8] bg-[#1E293B]/60 px-3 py-1.5 rounded-full">{msg.text}</p>
                </div>
              )
            }
            if (msg.error) {
              return (
                <div key={msg.id} className="max-w-[85%]">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <p className="text-sm text-red-400 mb-2">{msg.error}</p>
                    {msg.retryFn && (
                      <Button size="sm" variant="outline" onClick={msg.retryFn} className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10">
                        <RotateCcw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                    )}
                  </div>
                </div>
              )
            }
            return (
              <div key={msg.id} className="flex justify-start">
                {renderAgentResult(msg)}
              </div>
            )
          })}

          {thinking?.active && (
            <ThinkingIndicator thinking={thinking} />
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-[#1E293B] bg-[#0B1120] px-4 py-3">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={briefConfirmed ? 'Ask a question about your business setup...' : 'Describe your business idea...'}
              rows={1}
              className="w-full resize-none bg-[#1E293B]/50 border border-[#334155] rounded-xl px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/50 transition-colors"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
          </div>
          <Button onClick={handleSend} disabled={!input.trim() || loading} size="sm" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-xl h-10 w-10 p-0 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2">
          <HelpCircle className="w-3 h-3 text-[#94A3B8]" />
          <p className="text-[10px] text-[#94A3B8]">Press Shift+Enter for new line. Start with &quot;help:&quot; for support.</p>
        </div>
      </div>
    </div>
  )
}
