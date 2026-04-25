'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, ChevronRight, Pencil, Search, ClipboardList, FileText, DollarSign, Flag, Clipboard } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { copyToClipboard } from '@/lib/clipboard'

interface BusinessPlanPanelProps {
  briefData: any
  complianceReport: any
  executionDashboard: any
  filingProgress: any
  financialData: any
  platformData: any
  completedStages: number[]
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-xs mt-2 mb-0.5">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-sm mt-2 mb-0.5">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-sm mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-3 list-disc text-xs">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-3 list-decimal text-xs">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-0.5" />
        return <p key={i} className="text-xs">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part)
}

function safeToString(value: any): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item: any) => {
      if (typeof item === 'string') return `- ${item}`
      if (typeof item === 'object' && item !== null) {
        return `- ${Object.entries(item).map(([k, v]) => `**${k.replace(/_/g, ' ')}**: ${v}`).join(' | ')}`
      }
      return `- ${String(item)}`
    }).join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `**${k.replace(/_/g, ' ')}**: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n')
  }
  return String(value)
}

interface SectionBlockProps {
  title: string
  icon: React.ElementType
  completed: boolean
  children: React.ReactNode
  defaultOpen?: boolean
}

function SectionBlock({ title, icon: Icon, completed, children, defaultOpen = false }: SectionBlockProps) {
  const [open, setOpen] = useState(defaultOpen)

  if (!completed) {
    return (
      <div className="border border-[#1E293B]/50 rounded-lg p-3 opacity-70">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#334155] flex items-center justify-center">
            <Icon className="w-3 h-3 text-[#94A3B8]" />
          </div>
          <span className="text-xs text-[#CBD5E1]">{title}</span>
          <Badge variant="outline" className="ml-auto text-[9px] border-[#475569] text-[#94A3B8]">Pending</Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#1E293B] rounded-lg overflow-hidden bg-[#111827]/50">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#1A2035] transition-colors">
        <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-medium">{title}</span>
        <Badge className="ml-auto text-[9px] bg-[#10B981]/10 text-[#10B981] border-0">Complete</Badge>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />}
      </button>
      {open && <div className="px-3 pb-3 border-t border-[#1E293B]/50">{children}</div>}
    </div>
  )
}

function DataField({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined) return null
  const displayValue = safeToString(value)
  if (!displayValue) return null
  const isLong = displayValue.length > 100
  return (
    <div className="mt-2">
      <p className="text-[10px] uppercase tracking-wider text-[#64748B] mb-0.5">{label}</p>
      {isLong ? renderMarkdown(displayValue) : <p className="text-xs text-foreground/80">{displayValue}</p>}
    </div>
  )
}

export default function BusinessPlanPanel({
  briefData,
  complianceReport,
  executionDashboard,
  filingProgress,
  financialData,
  platformData,
  completedStages,
}: BusinessPlanPanelProps) {
  const stagesTotal = 6
  const completedCount = completedStages.length

  return (
    <div className="w-full h-full flex flex-col border-l border-[#1E293B] bg-[#0A0E1C]">
      <div className="px-4 py-3 border-b border-[#1E293B]">
        <h2 className="text-sm font-bold">Your Business Journey</h2>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
            <div className="h-full bg-[#6366F1] rounded-full transition-all duration-500" style={{ width: `${(completedCount / stagesTotal) * 100}%` }} />
          </div>
          <span className="text-[10px] text-[#94A3B8]">{completedCount}/{stagesTotal}</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          <SectionBlock title="Business Brief" icon={Pencil} completed={completedStages.includes(1)} defaultOpen={true}>
            {briefData && (
              <div className="space-y-1 pt-2">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <DataField label="Name" value={briefData?.business_name} />
                  <DataField label="Type" value={briefData?.business_type} />
                  <DataField label="Region" value={briefData?.target_region} />
                  <DataField label="Revenue" value={briefData?.revenue_model} />
                  <DataField label="Structure" value={briefData?.recommended_structure} />
                  <DataField label="Market" value={briefData?.target_market} />
                </div>
                <DataField label="Products / Services" value={briefData?.key_products_services} />
                <DataField label="Compliance Notes" value={briefData?.initial_compliance_considerations} />
                {briefData?.structure_reasoning && (
                  <div className="mt-2 bg-[#1E293B]/50 rounded p-2">
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Reasoning</p>
                    <p className="text-[11px] text-foreground/70 mt-0.5">{briefData.structure_reasoning}</p>
                  </div>
                )}
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Compliance Report" icon={Search} completed={completedStages.includes(2)}>
            {complianceReport && (
              <div className="space-y-1 pt-2">
                <DataField label="Executive Summary" value={complianceReport?.executive_summary} />
                <DataField label="Business Registrations" value={complianceReport?.business_registrations} />
                <DataField label="Legal Obligations" value={complianceReport?.legal_obligations} />
                <DataField label="IP Analysis" value={complianceReport?.ip_analysis} />
                <DataField label="Regulatory Requirements" value={complianceReport?.regulatory_requirements} />
                <DataField label="Government Schemes" value={complianceReport?.government_schemes} />
                <div className="flex gap-3 mt-2">
                  <div className="bg-[#1E293B]/50 rounded p-2 flex-1">
                    <p className="text-[10px] text-[#64748B]">Est. Cost</p>
                    <p className="text-xs font-medium text-[#818CF8]">{complianceReport?.total_estimated_cost ?? '-'}</p>
                  </div>
                  <div className="bg-[#1E293B]/50 rounded p-2 flex-1">
                    <p className="text-[10px] text-[#64748B]">Timeline</p>
                    <p className="text-xs font-medium text-[#818CF8]">{complianceReport?.total_estimated_timeline ?? '-'}</p>
                  </div>
                </div>
                <DataField label="Priority Actions" value={complianceReport?.priority_actions} />
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Execution Plan" icon={ClipboardList} completed={completedStages.includes(3)}>
            {executionDashboard && (
              <div className="space-y-1 pt-2">
                <DataField label="Before Launch" value={executionDashboard?.before_launch} />
                <DataField label="At Launch" value={executionDashboard?.at_launch} />
                <DataField label="Post Launch" value={executionDashboard?.post_launch} />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-[#1E293B]/50 rounded p-2 text-center">
                    <p className="text-[10px] text-[#64748B]">Total</p>
                    <p className="text-xs font-medium">{executionDashboard?.total_tasks ?? '-'}</p>
                  </div>
                  <div className="bg-[#1E293B]/50 rounded p-2 text-center">
                    <p className="text-[10px] text-[#64748B]">Online</p>
                    <p className="text-xs font-medium">{executionDashboard?.online_tasks ?? '-'}</p>
                  </div>
                  <div className="bg-[#1E293B]/50 rounded p-2 text-center">
                    <p className="text-[10px] text-[#64748B]">Offline</p>
                    <p className="text-xs font-medium">{executionDashboard?.offline_tasks ?? '-'}</p>
                  </div>
                </div>
                <DataField label="Critical Path" value={executionDashboard?.critical_path} />
                <div className="flex gap-3 mt-2">
                  <div className="bg-[#1E293B]/50 rounded p-2 flex-1">
                    <p className="text-[10px] text-[#64748B]">Est. Cost</p>
                    <p className="text-xs font-medium text-[#818CF8]">{executionDashboard?.total_estimated_cost ?? '-'}</p>
                  </div>
                  <div className="bg-[#1E293B]/50 rounded p-2 flex-1">
                    <p className="text-[10px] text-[#64748B]">Timeline</p>
                    <p className="text-xs font-medium text-[#818CF8]">{executionDashboard?.total_estimated_timeline ?? '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Filing Progress" icon={FileText} completed={completedStages.includes(4)}>
            {filingProgress && (
              <div className="space-y-1 pt-2">
                {filingProgress?.current_task && (
                  <div className="bg-[#1E293B]/50 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[9px] border-[#334155]">{filingProgress.current_task?.task_type ?? 'Task'}</Badge>
                      <span className="text-xs font-medium">{filingProgress.current_task?.task_name ?? ''}</span>
                    </div>
                    <Badge className={`text-[9px] ${filingProgress.current_task?.status === 'completed' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'} border-0`}>{filingProgress.current_task?.status ?? 'pending'}</Badge>
                    {Array.isArray(filingProgress.current_task?.steps) && filingProgress.current_task.steps.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Steps</p>
                        {filingProgress.current_task.steps.map((s: any, i: number) => (
                          <p key={i} className="text-[11px] text-foreground/70 ml-2">- {typeof s === 'string' ? s : safeToString(s)}</p>
                        ))}
                      </div>
                    )}
                    {Array.isArray(filingProgress.current_task?.documents_needed) && filingProgress.current_task.documents_needed.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wider">Documents Needed</p>
                        {filingProgress.current_task.documents_needed.map((d: any, i: number) => (
                          <p key={i} className="text-[11px] text-foreground/70 ml-2">- {typeof d === 'string' ? d : safeToString(d)}</p>
                        ))}
                      </div>
                    )}
                    <DataField label="Tips" value={filingProgress.current_task?.tips} />
                  </div>
                )}
                {filingProgress?.progress && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                        <div className="h-full bg-[#6366F1] rounded-full" style={{ width: `${filingProgress.progress?.percentage ?? 0}%` }} />
                      </div>
                      <span className="text-[10px] text-[#64748B]">{filingProgress.progress?.completed ?? 0}/{filingProgress.progress?.total ?? 0}</span>
                    </div>
                  </div>
                )}
                <DataField label="Next Task" value={filingProgress?.next_task_preview} />
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Financial Setup" icon={DollarSign} completed={completedStages.includes(5)}>
            {financialData && (
              <div className="space-y-1 pt-2">
                {financialData?.bank_account && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium mt-1">Banking</p>
                    <DataField label="Recommendations" value={financialData.bank_account?.recommendations} />
                    <DataField label="Required Docs" value={financialData.bank_account?.required_documents} />
                    <DataField label="Steps" value={financialData.bank_account?.steps} />
                    <DataField label="Comparison" value={financialData.bank_account?.comparison} />
                  </div>
                )}
                {financialData?.payments && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium mt-2">Payments</p>
                    <DataField label="Recommendations" value={financialData.payments?.recommendations} />
                    <DataField label="Comparison" value={financialData.payments?.comparison} />
                    <DataField label="Setup Steps" value={financialData.payments?.setup_steps} />
                  </div>
                )}
                {financialData?.financial_aid && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium mt-2">Financial Aid</p>
                    <DataField label="Loans" value={financialData.financial_aid?.loans} />
                    <DataField label="Grants" value={financialData.financial_aid?.grants} />
                    <DataField label="Startup Programs" value={financialData.financial_aid?.startup_programs} />
                    <DataField label="Eligibility" value={financialData.financial_aid?.eligibility_summary} />
                  </div>
                )}
                {financialData?.accounting && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium mt-2">Accounting</p>
                    <DataField label="Recommendations" value={financialData.accounting?.recommendations} />
                    <DataField label="Comparison" value={financialData.accounting?.comparison} />
                    <DataField label="Setup Steps" value={financialData.accounting?.setup_steps} />
                  </div>
                )}
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Launch Ready" icon={Flag} completed={completedStages.includes(6)}>
            {platformData && (
              <div className="space-y-1 pt-2">
                {Array.isArray(platformData?.platform_recommendations) && platformData.platform_recommendations.map((p: any, i: number) => (
                  <div key={i} className="bg-[#1E293B]/50 rounded p-2 mb-1">
                    <p className="text-xs font-medium">{typeof p === 'string' ? p : (p?.platform ?? 'Platform')}</p>
                    {typeof p === 'object' && p?.purpose && <p className="text-[10px] text-[#64748B]">{p.purpose}</p>}
                    {typeof p === 'object' && p?.recommendation && <DataField label="Recommendation" value={p.recommendation} />}
                  </div>
                ))}
                {platformData?.lyzr_architect_prompt && (
                  <div className="bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-lg p-2 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] uppercase tracking-wider text-[#818CF8]">Lyzr Architect Prompt</p>
                      <button onClick={() => copyToClipboard(typeof platformData.lyzr_architect_prompt === 'string' ? platformData.lyzr_architect_prompt : '')} className="text-[10px] text-[#64748B] hover:text-foreground flex items-center gap-1">
                        <Clipboard className="w-3 h-3" /> Copy
                      </button>
                    </div>
                    <p className="text-[11px] text-foreground/70">{typeof platformData.lyzr_architect_prompt === 'string' ? platformData.lyzr_architect_prompt.slice(0, 200) : ''}...</p>
                  </div>
                )}
                {platformData?.journey_summary && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium">Journey Summary</p>
                    <DataField label="Stages Completed" value={platformData.journey_summary?.stages_completed} />
                    <DataField label="Reference Numbers" value={platformData.journey_summary?.reference_numbers} />
                    <DataField label="Upcoming Dates" value={platformData.journey_summary?.upcoming_dates} />
                    <DataField label="Ongoing Obligations" value={platformData.journey_summary?.ongoing_obligations} />
                  </div>
                )}
                {Array.isArray(platformData?.next_steps) && platformData.next_steps.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#64748B] font-medium">Next Steps</p>
                    {platformData.next_steps.map((s: any, i: number) => (
                      <div key={i} className="flex items-start gap-1.5 mt-1">
                        <div className="w-4 h-4 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[9px] text-[#64748B]">{i + 1}</span>
                        </div>
                        <p className="text-[11px] text-foreground/80">{typeof s === 'string' ? s : safeToString(s)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </SectionBlock>
        </div>
      </ScrollArea>
    </div>
  )
}
