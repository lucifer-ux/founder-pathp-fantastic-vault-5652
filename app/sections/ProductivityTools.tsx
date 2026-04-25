'use client'

import React, { useState } from 'react'
import { Mail, Calendar, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { callAIAgent } from '@/lib/aiAgent'

const SUPPORT_AGENT_ID = '69ec5421eac603bbd2d82e8c'

interface ProductivityToolsProps {
  mode: 'email' | 'meeting'
  onClose: () => void
}

export default function ProductivityTools({ mode, onClose }: ProductivityToolsProps) {
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '' })
  const [meetingForm, setMeetingForm] = useState({ title: '', datetime: '', duration: '30', attendees: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) return
    setLoading(true)
    setResult(null)
    try {
      const message = `Send an email to ${emailForm.to} with subject "${emailForm.subject}" and body: ${emailForm.body}`
      const res = await callAIAgent(message, SUPPORT_AGENT_ID)
      if (res?.success) {
        const responseText = res?.response?.result?.answer ?? res?.response?.result?.text ?? res?.response?.message ?? 'Email sent successfully.'
        setResult({ success: true, message: typeof responseText === 'string' ? responseText : 'Email sent successfully.' })
        setEmailForm({ to: '', subject: '', body: '' })
      } else {
        setResult({ success: false, message: res?.error ?? res?.response?.message ?? 'Failed to send email. Please try again.' })
      }
    } catch (err: any) {
      setResult({ success: false, message: err?.message ?? 'Connection error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleMeeting = async () => {
    if (!meetingForm.title || !meetingForm.datetime || !meetingForm.attendees) return
    setLoading(true)
    setResult(null)
    try {
      const durationLabel = meetingForm.duration === '30' ? '30 minutes' : meetingForm.duration === '60' ? '1 hour' : '2 hours'
      const descPart = meetingForm.description ? ` Description: ${meetingForm.description}` : ''
      const message = `Schedule a Google Meet meeting titled "${meetingForm.title}" on ${meetingForm.datetime} for ${durationLabel} with attendees: ${meetingForm.attendees}.${descPart}`
      const res = await callAIAgent(message, SUPPORT_AGENT_ID)
      if (res?.success) {
        const responseText = res?.response?.result?.answer ?? res?.response?.result?.text ?? res?.response?.message ?? 'Meeting scheduled successfully.'
        setResult({ success: true, message: typeof responseText === 'string' ? responseText : 'Meeting scheduled successfully.' })
        setMeetingForm({ title: '', datetime: '', duration: '30', attendees: '', description: '' })
      } else {
        setResult({ success: false, message: res?.error ?? res?.response?.message ?? 'Failed to schedule meeting. Please try again.' })
      }
    } catch (err: any) {
      setResult({ success: false, message: err?.message ?? 'Connection error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0F1629] border border-[#1E293B] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6366F1]/15 flex items-center justify-center">
              {mode === 'email' ? (
                <Mail className="w-4 h-4 text-[#818CF8]" />
              ) : (
                <Calendar className="w-4 h-4 text-[#818CF8]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {mode === 'email' ? 'Send Email' : 'Schedule Meeting'}
              </h3>
              <p className="text-[10px] text-[#94A3B8]">Powered by Support Companion AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#1E293B] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {mode === 'email' ? (
            <>
              <div>
                <Label htmlFor="email-to" className="text-xs text-[#CBD5E1] mb-1.5 block">To *</Label>
                <Input
                  id="email-to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="email-subject" className="text-xs text-[#CBD5E1] mb-1.5 block">Subject *</Label>
                <Input
                  id="email-subject"
                  placeholder="Meeting follow-up"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="email-body" className="text-xs text-[#CBD5E1] mb-1.5 block">Body *</Label>
                <Textarea
                  id="email-body"
                  placeholder="Type your email message here..."
                  value={emailForm.body}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                  rows={5}
                  className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50 resize-none"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleSendEmail}
                disabled={loading || !emailForm.to || !emailForm.subject || !emailForm.body}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white h-10"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : 'Send via AI'}
              </Button>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="meeting-title" className="text-xs text-[#CBD5E1] mb-1.5 block">Title *</Label>
                <Input
                  id="meeting-title"
                  placeholder="Project kickoff meeting"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="meeting-datetime" className="text-xs text-[#CBD5E1] mb-1.5 block">Date & Time *</Label>
                  <Input
                    id="meeting-datetime"
                    type="datetime-local"
                    value={meetingForm.datetime}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, datetime: e.target.value }))}
                    className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="meeting-duration" className="text-xs text-[#CBD5E1] mb-1.5 block">Duration</Label>
                  <select
                    id="meeting-duration"
                    value={meetingForm.duration}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md bg-[#1E293B] border border-[#334155] text-sm text-white focus:border-[#6366F1]/50 outline-none"
                    disabled={loading}
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="meeting-attendees" className="text-xs text-[#CBD5E1] mb-1.5 block">Attendees *</Label>
                <Input
                  id="meeting-attendees"
                  type="text"
                  placeholder="alice@example.com, bob@example.com"
                  value={meetingForm.attendees}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, attendees: e.target.value }))}
                  className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50"
                  disabled={loading}
                />
                <p className="text-[10px] text-[#64748B] mt-1">Separate multiple emails with commas</p>
              </div>
              <div>
                <Label htmlFor="meeting-desc" className="text-xs text-[#CBD5E1] mb-1.5 block">Description (optional)</Label>
                <Textarea
                  id="meeting-desc"
                  placeholder="Meeting agenda or notes..."
                  value={meetingForm.description}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="bg-[#1E293B] border-[#334155] text-sm text-white placeholder:text-[#64748B] focus:border-[#6366F1]/50 resize-none"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleScheduleMeeting}
                disabled={loading || !meetingForm.title || !meetingForm.datetime || !meetingForm.attendees}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white h-10"
              >
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Scheduling...</> : 'Schedule via AI'}
              </Button>
            </>
          )}

          {result && (
            <div className={`flex items-start gap-2.5 p-3 rounded-lg border ${result.success ? 'bg-[#10B981]/10 border-[#10B981]/20' : 'bg-red-500/10 border-red-500/20'}`}>
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <p className={`text-xs leading-relaxed ${result.success ? 'text-[#10B981]' : 'text-red-400'}`}>{result.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
