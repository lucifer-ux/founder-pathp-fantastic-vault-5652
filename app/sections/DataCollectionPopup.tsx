'use client'

import React, { useState } from 'react'
import { Lightbulb, Users, MapPin, DollarSign, X, Pencil, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IntakeData {
  idea: string
  targetMarket: string
  region: string
  revenueModel: string
}

interface DataCollectionPopupProps {
  data: IntakeData
  onConfirm: (data: IntakeData) => void
  onClose: () => void
}

const FIELDS: { key: keyof IntakeData; label: string; icon: React.ElementType; placeholder: string; multiline?: boolean }[] = [
  { key: 'idea', label: 'Business Idea', icon: Lightbulb, placeholder: 'Your business concept...', multiline: true },
  { key: 'targetMarket', label: 'Target Market', icon: Users, placeholder: 'e.g. B2B SaaS for small businesses' },
  { key: 'region', label: 'Operating Region', icon: MapPin, placeholder: 'e.g. United States, India' },
  { key: 'revenueModel', label: 'Revenue Model', icon: DollarSign, placeholder: 'e.g. Subscription-based pricing' },
]

export default function DataCollectionPopup({ data, onConfirm, onClose }: DataCollectionPopupProps) {
  const [formData, setFormData] = useState<IntakeData>({ ...data })
  const [editingField, setEditingField] = useState<keyof IntakeData | null>(null)

  const handleChange = (key: keyof IntakeData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    if (!formData.idea.trim() || !formData.targetMarket.trim() || !formData.region.trim() || !formData.revenueModel.trim()) return
    onConfirm(formData)
  }

  const allFilled = formData.idea.trim() && formData.targetMarket.trim() && formData.region.trim() && formData.revenueModel.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[#0F1629] border border-[#1E293B] rounded-2xl shadow-2xl shadow-[#6366F1]/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Review Your Business Details</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">Verify or edit the information before we analyze your business idea</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1E293B] hover:bg-[#334155] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-[#94A3B8]" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {FIELDS.map(({ key, label, icon: Icon, placeholder, multiline }) => {
            const isEditing = editingField === key
            return (
              <div key={key} className="group">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-5 h-5 rounded-md bg-[#6366F1]/10 flex items-center justify-center">
                    <Icon className="w-3 h-3 text-[#818CF8]" />
                  </div>
                  <label className="text-xs font-medium text-[#CBD5E1]">{label}</label>
                  {!isEditing && (
                    <button
                      onClick={() => setEditingField(key)}
                      className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-3 h-3 text-[#64748B] hover:text-[#818CF8]" />
                    </button>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    {multiline ? (
                      <textarea
                        value={formData[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                        className="flex-1 px-3 py-2 text-sm bg-[#1E293B] border border-[#6366F1]/30 rounded-lg text-white placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/60 resize-none transition-colors"
                        autoFocus
                      />
                    ) : (
                      <input
                        value={formData[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 px-3 py-2 text-sm bg-[#1E293B] border border-[#6366F1]/30 rounded-lg text-white placeholder:text-[#64748B] outline-none focus:border-[#6366F1]/60 transition-colors"
                        autoFocus
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingField(null)}
                      className="text-xs border-[#334155] text-[#94A3B8] hover:text-white self-end"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingField(key)}
                    className="px-3 py-2 text-sm bg-[#1E293B]/50 border border-[#1E293B] rounded-lg text-[#E2E8F0] cursor-pointer hover:border-[#334155] transition-colors"
                  >
                    {formData[key] || <span className="text-[#64748B]">{placeholder}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-6 pb-5 pt-2 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 text-sm border-[#334155] text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          >
            Go Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!allFilled}
            className="flex-1 text-sm bg-[#6366F1] hover:bg-[#4F46E5] text-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit & Continue
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
