'use client'

import React from 'react'
import { Pencil, Search, ClipboardList, FileText, DollarSign, Flag, Briefcase, Check, HelpCircle, Settings, Mail, Calendar } from 'lucide-react'

interface SidebarProps {
  currentStage: number
  completedStages: number[]
  onOpenEmail?: () => void
  onOpenMeeting?: () => void
}

const STAGES = [
  { num: 1, icon: Pencil, label: 'Business Idea' },
  { num: 2, icon: Search, label: 'Research' },
  { num: 3, icon: ClipboardList, label: 'Execution Plan' },
  { num: 4, icon: FileText, label: 'Filing & Docs' },
  { num: 5, icon: DollarSign, label: 'Financial Setup' },
  { num: 6, icon: Flag, label: 'Launch Ready' },
]

export default function Sidebar({ currentStage, completedStages, onOpenEmail, onOpenMeeting }: SidebarProps) {
  return (
    <div className="w-[200px] min-h-screen flex flex-col border-r border-[#1E293B] bg-[#0B1120]">
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#6366F1] flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">FounderPath</span>
      </div>

      <div className="px-5 mb-4">
        <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-medium mb-1">Journey Progress</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-[#1E293B] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6366F1] rounded-full transition-all duration-500"
              style={{ width: `${(completedStages.length / 6) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[#94A3B8] font-medium">{completedStages.length}/6</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col px-3 py-1 gap-0.5">
        {STAGES.map((stage) => {
          const isCompleted = completedStages.includes(stage.num)
          const isActive = currentStage === stage.num
          const Icon = stage.icon

          return (
            <div
              key={stage.num}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-default ${
                isActive
                  ? 'bg-[#6366F1]/10 text-[#A5B4FC]'
                  : isCompleted
                  ? 'text-[#94A3B8]'
                  : 'text-[#CBD5E1]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isCompleted
                    ? 'bg-[#10B981] text-white'
                    : isActive
                    ? 'bg-[#6366F1]/20 text-[#A5B4FC] ring-1 ring-[#6366F1]/40'
                    : 'bg-[#334155] text-[#94A3B8]'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-[#A5B4FC]' : isCompleted ? 'text-[#94A3B8]' : 'text-[#CBD5E1]'}`}>
                {stage.label}
              </span>
              {isCompleted && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              )}
            </div>
          )
        })}
      </nav>

      <div className="px-3 pb-2">
        <p className="text-[10px] uppercase tracking-widest text-[#94A3B8] font-medium px-3 mb-1.5">Tools</p>
        <div onClick={onOpenEmail} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#CBD5E1] hover:bg-[#6366F1]/10 hover:text-[#A5B4FC] transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-[#334155] flex items-center justify-center shrink-0">
            <Mail className="w-3 h-3 text-[#94A3B8]" />
          </div>
          <span className="text-xs font-medium">Send Email</span>
        </div>
        <div onClick={onOpenMeeting} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#CBD5E1] hover:bg-[#6366F1]/10 hover:text-[#A5B4FC] transition-colors cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-[#334155] flex items-center justify-center shrink-0">
            <Calendar className="w-3 h-3 text-[#94A3B8]" />
          </div>
          <span className="text-xs font-medium">Schedule Meeting</span>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-0.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#1E293B]/50 transition-colors cursor-pointer">
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-[11px]">Help</span>
        </div>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#94A3B8] hover:bg-[#1E293B]/50 transition-colors cursor-pointer">
          <Settings className="w-3.5 h-3.5" />
          <span className="text-[11px]">Settings</span>
        </div>
      </div>

      <div className="px-5 pb-4 border-t border-[#1E293B] pt-3">
        <p className="text-[10px] text-[#94A3B8]">Powered by Lyzr</p>
      </div>
    </div>
  )
}
