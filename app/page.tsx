'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Briefcase, Search, ClipboardList, FileText, DollarSign, Flag, MessageCircle, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { callAIAgent } from '@/lib/aiAgent'
import Sidebar from './sections/Sidebar'
import ChatInterface, { ChatMsg, ThinkingState } from './sections/ChatInterface'
import BusinessPlanPanel from './sections/BusinessPlanPanel'
import ProductivityTools from './sections/ProductivityTools'
import DataCollectionPopup from './sections/DataCollectionPopup'

const INTAKE_QUESTIONS = [
  'Who is your primary target market — are you selling to everyday consumers (B2C), businesses (B2B), or both? And are you focusing on a specific age group or tech-savvy audience?',
  'Which region or country are you planning to operate and register your business in? For example, India, USA, UK, or elsewhere?',
  'How do you plan to generate revenue — will you sell products at a fixed price, offer subscriptions, bundle deals, or perhaps a mix of these?',
]

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
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-[#6366F1] text-white rounded-md text-sm hover:bg-[#4F46E5] transition-colors">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const AGENTS = {
  IDEA: '69ec536725ead3c1187be8df',
  COMPLIANCE: '69ec53dc25ead3c1187be8f9',
  EXECUTION: '69ec53eba57e78ed3c81ed33',
  FILING: '69ec53fba57e78ed3c81ed37',
  FINANCIAL: '69ec54087da557a418920bc0',
  PLATFORM: '69ec5416faf2562dd1132bea',
  SUPPORT: '69ec5421eac603bbd2d82e8c',
}

const THINKING_DESCS: Record<number, { name: string; desc: string }> = {
  1: { name: 'Idea Intake Agent', desc: 'Analyzing your business concept and preparing clarifying questions...' },
  2: { name: 'Compliance Research Orchestrator', desc: 'Coordinating Business Licensing, Legal Compliance, IP Patent, and Regulatory Risk research agents...' },
  3: { name: 'Execution Orchestrator', desc: 'Coordinating Entity Formation, Licensing Permits, Tax Registration, and IP Filing agents to build your execution plan...' },
  4: { name: 'Filing & Guidance Agent', desc: 'Preparing step-by-step filing guidance and document checklists...' },
  5: { name: 'Financial Setup Agent', desc: 'Researching banking options, payment infrastructure, financial aid, and accounting tools...' },
  6: { name: 'Platform Builder Agent', desc: 'Assessing online presence needs, generating platform recommendations and journey summary...' },
}

const STAGE_AGENTS: Record<number, string> = {
  1: AGENTS.IDEA,
  2: AGENTS.COMPLIANCE,
  3: AGENTS.EXECUTION,
  4: AGENTS.FILING,
  5: AGENTS.FINANCIAL,
  6: AGENTS.PLATFORM,
}

const AGENT_INFO = [
  { id: AGENTS.IDEA, name: 'Idea Intake', icon: Briefcase },
  { id: AGENTS.COMPLIANCE, name: 'Compliance', icon: Search },
  { id: AGENTS.EXECUTION, name: 'Execution', icon: ClipboardList },
  { id: AGENTS.FILING, name: 'Filing', icon: FileText },
  { id: AGENTS.FINANCIAL, name: 'Financial', icon: DollarSign },
  { id: AGENTS.PLATFORM, name: 'Platform', icon: Flag },
  { id: AGENTS.SUPPORT, name: 'Support', icon: MessageCircle },
]

let msgCounter = 0
function makeId() {
  msgCounter += 1
  return `msg-${msgCounter}`
}

const SAMPLE_BRIEF = {
  business_name: 'GreenLeaf Analytics',
  business_type: 'SaaS / Technology',
  target_region: 'United States (Delaware incorporation)',
  revenue_model: 'Subscription-based with tiered pricing',
  recommended_structure: 'LLC',
  structure_reasoning: 'Provides liability protection with pass-through taxation, ideal for a tech startup with fewer than 10 initial members.',
  target_market: 'Small to mid-size businesses in agriculture and sustainability',
  key_products_services: 'AI-powered crop analytics dashboard, carbon footprint tracking, sustainability reports',
  initial_compliance_considerations: 'Data privacy (CCPA), agricultural data regulations, SaaS terms of service',
}

const SAMPLE_COMPLIANCE_REPORT = {
  executive_summary: 'Comprehensive compliance research completed for GreenLeaf Analytics. The business requires Delaware LLC formation, EIN registration, CCPA compliance for data privacy, agricultural data handling policies, and trademark protection for the brand and AI algorithms.',
  business_registrations: '**Delaware LLC Registration** - File Certificate of Formation with Delaware Division of Corporations. Filing fee: $90. Timeline: 1-2 business days.\n\n**Foreign LLC Registration** - Register as a foreign LLC in your operating state if different from Delaware.\n\n**EIN (Employer Identification Number)** - Apply via IRS Form SS-4. Free and can be obtained online immediately.',
  legal_obligations: '**Data Privacy (CCPA)** - Implement privacy policy, data deletion requests, opt-out mechanisms. Risk level: Medium.\n\n**Terms of Service** - Draft comprehensive SaaS-specific ToS covering subscription terms, data usage, liability limitations. Risk level: Low.\n\n**Agricultural Data** - Adopt AG Data Transparent principles, farmer data ownership policies. Risk level: Medium.',
  ip_analysis: '**Trademark** - File USPTO trademark application for GreenLeaf Analytics brand name and logo. Estimated cost: $250-350 per class. Timeline: 8-12 months.\n\n**Patent** - Consider provisional patent for proprietary AI crop analytics algorithm. Consult patent attorney. Timeline: 12-18 months.\n\n**Copyright** - Automatic protection upon creation for software code and documentation. Register for enhanced enforcement.',
  regulatory_requirements: '**SOC 2 Compliance** - Implement for data security and customer trust. Recommended for SaaS businesses handling sensitive data.\n\n**Cross-state Tax** - Monitor economic nexus thresholds in states with customers.\n\n**Environmental Data Accuracy** - Include disclaimers, validate data sources, maintain audit trails.',
  government_schemes: '**USDA SBIR Program** - Up to $100,000 (Phase I) for agriculture technology businesses.\n\n**NSF SBIR/STTR** - Up to $275,000 (Phase I) for technology commercialization.\n\n**State-level AgTech Incentives** - Check for state-specific agricultural technology grants and tax incentives.',
  total_estimated_cost: '$500 - $2,500',
  total_estimated_timeline: '4-8 weeks',
  priority_actions: '1. File Delaware LLC Certificate of Formation\n2. Obtain EIN from IRS\n3. Draft CCPA-compliant Privacy Policy\n4. File USPTO trademark application\n5. Implement Terms of Service for SaaS platform',
}

const SAMPLE_EXECUTION_DASHBOARD = {
  summary: 'Execution plan created with 4 parallel workstreams for GreenLeaf Analytics launch.',
  before_launch: '**Entity Formation**\n1. File Certificate of Formation in Delaware ($90, 1-2 days)\n2. Obtain EIN from IRS (free, same day)\n3. Draft Operating Agreement ($500-1500, 1 week)\n4. Register as Foreign LLC if needed (varies, 2-4 weeks)\n\n**Licensing & Permits**\n1. Apply for state business license ($50-300, 1-2 weeks)\n2. Register for sales tax if applicable (free, 1 week)\n\n**Tax Registration**\n1. Register for Delaware franchise tax (automatic with formation)\n2. Set up accounting system ($30-50/month, 1 week)',
  at_launch: '**Platform Setup**\n1. Deploy SaaS application on production infrastructure\n2. Configure payment processing (Stripe/Paddle)\n3. Set up customer support channels\n4. Publish privacy policy and terms of service\n\n**Marketing**\n1. Launch landing page with SEO optimization\n2. Begin content marketing campaign\n3. Activate LinkedIn thought leadership strategy',
  post_launch: '**Growth & Compliance**\n1. Monitor CCPA compliance and data requests\n2. Track economic nexus for multi-state tax obligations\n3. File trademark application with USPTO\n4. Consider provisional patent for AI algorithms\n5. Set up payroll when hiring ($40-100/month)',
  total_tasks: '15',
  online_tasks: '10',
  offline_tasks: '5',
  critical_path: 'Entity Formation > EIN > Bank Account > Payment Processing > Launch. The critical path takes approximately 3-4 weeks to complete before the platform can accept revenue.',
  total_estimated_cost: '$1,500 - $5,000',
  total_estimated_timeline: '6-12 weeks',
}

const SAMPLE_FILING_DATA = {
  message: 'Step-by-step filing guidance prepared for GreenLeaf Analytics.',
  current_task: {
    task_type: 'Entity Formation',
    task_name: 'File Certificate of Formation (Delaware)',
    status: 'ready',
    steps: [
      'Visit Delaware Division of Corporations website (corp.delaware.gov)',
      'Select "LLC" under entity type and complete the online form',
      'Provide registered agent name and address in Delaware',
      'Pay the $90 filing fee via credit card or ACH',
      'Receive confirmation and entity number within 1-2 business days',
    ],
    documents_needed: [
      'Government-issued photo ID for all members',
      'Business address documentation',
      'Registered agent information (can use a registered agent service)',
      'Operating Agreement (recommended but not required for filing)',
    ],
    tips: 'Consider using a registered agent service like Northwest ($125/year) or Incfile ($119/year) if you are not physically located in Delaware. This provides a physical Delaware address for official correspondence.',
  },
  progress: {
    percentage: 15,
    completed: 1,
    total: 7,
  },
  next_task_preview: 'Obtain EIN from IRS - Can be done online immediately after entity formation. Visit irs.gov and complete Form SS-4.',
}

const SAMPLE_FINANCIAL_DATA = {
  message: 'Financial setup recommendations completed for GreenLeaf Analytics.',
  bank_account: {
    recommendations: '**Mercury** - Best for startups with no monthly fees, easy API integration, and startup-friendly features. $0/month.\n\n**Relay** - Profit-first banking with automatic categorization and budgeting tools. $0/month.\n\n**Chase Business Complete** - Extensive branch network with robust business tools. $15/month (waivable with $2,000 minimum balance).',
    required_documents: '- EIN confirmation letter from IRS\n- Certificate of Formation (certified copy)\n- Operating Agreement\n- Government-issued ID of all members/managers\n- Business address verification document',
    steps: '1. Choose a banking provider based on your needs\n2. Gather all required documents listed above\n3. Apply online or visit a branch (for Chase)\n4. Fund the initial deposit (Mercury: $0, Chase: $25 recommended)\n5. Set up online banking, bill pay, and payment methods\n6. Order business debit cards if needed',
    comparison: 'Mercury: $0/month, best for tech startups and API integration\nRelay: $0/month, best for profit-first budgeting\nChase: $15/month (waivable), best for branch access and established tools',
  },
  payments: {
    recommendations: '**Stripe** - Industry standard for SaaS subscription billing at 2.9% + $0.30 per transaction. Features include recurring billing, invoicing, tax collection, and excellent developer tools.\n\n**Paddle** - Merchant of Record model at 5% + $0.50 per transaction. Handles global tax compliance automatically, reducing your operational overhead significantly.',
    comparison: 'Stripe: 2.9% + $0.30/txn - Best for SaaS billing with maximum flexibility\nPaddle: 5% + $0.50/txn - Best for global tax handling and reduced compliance burden',
    setup_steps: '1. Create a business account with your chosen payment provider\n2. Complete business verification and identity checks\n3. Configure subscription plans and pricing tiers\n4. Integrate the payment SDK into your application\n5. Test thoroughly with sandbox/test mode before going live',
  },
  financial_aid: {
    loans: '**SBA Microloan** - Up to $50,000 with a 6-year maximum term at approximately 8% interest. Best suited for initial operational costs and working capital needs.',
    grants: '**USDA SBIR Program** - Up to $100,000 (Phase I) for small businesses in agriculture technology. Rolling deadline with quarterly review cycles.\n\n**NSF SBIR/STTR** - Up to $275,000 (Phase I) for technology commercialization. Quarterly submission deadlines.',
    startup_programs: '**Y Combinator** - $500K standard investment for 7% equity. Batch-based accelerator program with extensive mentorship network.\n\n**Techstars Farm to Fork** - Agriculture-focused accelerator with $120K investment. Specialized mentorship for AgTech startups.',
    eligibility_summary: 'GreenLeaf Analytics qualifies for agricultural technology grants (USDA SBIR) and general technology commercialization programs (NSF SBIR/STTR). The LLC structure is compatible with all listed funding sources. Apply for USDA SBIR first as it has the most relevant focus.',
  },
  accounting: {
    recommendations: '**QuickBooks Online** ($30/month) - All-in-one accounting solution with payroll integration, invoicing, and tax preparation tools.\n\n**Xero** ($15/month) - Clean, modern interface with strong third-party integrations and multi-currency support.',
    comparison: 'QuickBooks: $30/month - Best for combined payroll and accounting\nXero: $15/month - Best for clean UI and international features',
    setup_steps: '1. Choose your accounting software based on needs and budget\n2. Connect your business bank account for automatic transaction import\n3. Set up your chart of accounts (use standard templates)\n4. Configure tax categories and applicable tax rates\n5. Set up recurring invoice templates for subscription billing\n6. Schedule monthly reconciliation reminders',
  },
}

const SAMPLE_PLATFORM_DATA = {
  message: 'Platform and launch strategy prepared for GreenLeaf Analytics.',
  platform_recommendations: [
    { platform: 'Website (Next.js + Vercel)', purpose: 'Marketing site and SaaS application hosting', recommendation: 'Build with Next.js for SEO-friendly pages and deploy on Vercel for automatic scaling and preview deployments. Cost: $0-20/month. Timeline: 2-4 weeks for MVP.' },
    { platform: 'Email (Google Workspace)', purpose: 'Professional business email and collaboration', recommendation: 'Set up Google Workspace with custom domain (team@greenleafanalytics.com). Cost: $6/user/month. Includes Drive, Calendar, and Meet.' },
    { platform: 'Content Marketing', purpose: 'SEO and thought leadership in AgTech space', recommendation: 'Publish blog posts on sustainable farming analytics, carbon tracking best practices, and AI in agriculture. Target long-tail AgTech keywords for organic search traffic. Priority: High.' },
    { platform: 'LinkedIn', purpose: 'Professional networking and B2B lead generation', recommendation: 'Establish thought leadership through regular posts about AgTech innovation. Connect with agricultural cooperatives, sustainability officers, and farm technology buyers. Priority: High.' },
  ],
  lyzr_architect_prompt: 'Build a SaaS analytics dashboard for GreenLeaf Analytics that includes: AI-powered crop analytics visualization with interactive charts, carbon footprint tracking with historical trends, sustainability report generator with PDF export, user authentication with tier-based access control (Free, Pro, Enterprise plans), Stripe subscription billing integration with usage metering, and a responsive dashboard with data filtering, search, and CSV/PDF export capabilities. Use Next.js 14 with App Router, Tailwind CSS, and shadcn/ui components.',
  journey_summary: {
    stages_completed: 'All 6 stages completed: Idea Intake, Compliance Research, Execution Planning, Filing & Documentation, Financial Setup, and Platform Launch strategy.',
    reference_numbers: 'Delaware LLC filing reference will be assigned upon submission. EIN will be provided instantly upon IRS application. USPTO trademark serial number assigned upon filing.',
    upcoming_dates: '- Week 1-2: File Certificate of Formation in Delaware\n- Week 2: Obtain EIN from IRS (same day online)\n- Week 3-4: Open business bank account\n- Week 4-6: MVP development sprint\n- Week 5-8: Beta testing with 5-10 pilot farms\n- Week 9-12: Public launch campaign',
    ongoing_obligations: '- Delaware franchise tax: $300/year minimum (due June 1)\n- Annual report filing with Delaware Division of Corporations\n- CCPA compliance monitoring and data request handling\n- Quarterly estimated federal tax payments\n- Monthly accounting reconciliation\n- Trademark maintenance filings (years 5-6 window)',
  },
  next_steps: [
    'File Certificate of Formation with Delaware Division of Corporations ($90)',
    'Apply for EIN through IRS online portal (free, immediate)',
    'Open business bank account with Mercury or Relay',
    'Draft Operating Agreement with all LLC members',
    'Begin MVP development with Next.js + Vercel stack',
    'Apply for USDA SBIR Program grant (up to $100K)',
  ],
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [thinking, setThinking] = useState<ThinkingState | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStage, setCurrentStage] = useState(1)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [briefConfirmed, setBriefConfirmed] = useState(false)
  const [briefData, setBriefData] = useState<any>(null)
  const [complianceReport, setComplianceReport] = useState<any>(null)
  const [executionDashboard, setExecutionDashboard] = useState<any>(null)
  const [filingProgress, setFilingProgress] = useState<any>(null)
  const [financialData, setFinancialData] = useState<any>(null)
  const [platformData, setPlatformData] = useState<any>(null)
  const [showSample, setShowSample] = useState(false)
  const [editingBrief, setEditingBrief] = useState(false)
  const [editFields, setEditFields] = useState<any>({})
  const [toolsModal, setToolsModal] = useState<'email' | 'meeting' | null>(null)
  const [intakeStep, setIntakeStep] = useState(0)
  const [intakeAnswers, setIntakeAnswers] = useState({ idea: '', targetMarket: '', region: '', revenueModel: '' })
  const [showDataPopup, setShowDataPopup] = useState(false)
  const autoRunningRef = useRef(false)

  const addMessage = useCallback((msg: Omit<ChatMsg, 'id'>) => {
    const m = { ...msg, id: makeId() }
    setMessages(prev => [...prev, m])
    return m.id
  }, [])

  const completeStage = useCallback((stage: number) => {
    setCompletedStages(prev => prev.includes(stage) ? prev : [...prev, stage])
    setCurrentStage(stage < 6 ? stage + 1 : stage)
  }, [])

  const STAGE_MOCK_DATA: Record<number, any> = {
    2: SAMPLE_COMPLIANCE_REPORT,
    3: SAMPLE_EXECUTION_DASHBOARD,
    4: SAMPLE_FILING_DATA,
    5: SAMPLE_FINANCIAL_DATA,
    6: SAMPLE_PLATFORM_DATA,
  }

  const getMockFallback = useCallback((stage: number) => {
    const mock = STAGE_MOCK_DATA[stage]
    if (!mock) return null
    if (stage === 2) return { message: 'Compliance research complete (sample data - agent timed out).', master_report: mock }
    if (stage === 3) return { message: 'Execution plan ready (sample data - agent timed out).', execution_dashboard: mock }
    if (stage === 4) return { ...mock, message: 'Filing guidance ready (sample data - agent timed out).' }
    if (stage === 5) return { ...mock, message: 'Financial setup complete (sample data - agent timed out).' }
    if (stage === 6) return { ...mock, message: 'Launch plan ready (sample data - agent timed out).' }
    return mock
  }, [])

  const callAgent = useCallback(async (stage: number, message: string): Promise<any> => {
    const agentId = STAGE_AGENTS[stage]
    if (!agentId) return null

    const thinkInfo = THINKING_DESCS[stage]
    setThinking({ active: true, agentName: thinkInfo?.name ?? 'Agent', description: thinkInfo?.desc ?? 'Processing...', stage })
    setLoading(true)

    try {
      const result = await callAIAgent(message, agentId)
      setThinking(null)

      if (result?.success && result?.response?.result) {
        return result.response.result
      }

      // Check if it was a timeout — fallback to mock data
      const isTimeout = result?.error?.toLowerCase()?.includes('timed out') || result?.response?.message?.toLowerCase()?.includes('timed out')
      if (isTimeout) {
        const mockData = getMockFallback(stage)
        if (mockData) {
          addMessage({ role: 'system', text: `${thinkInfo?.name ?? 'Agent'} timed out after 2 minutes. Using sample data to continue the workflow.` })
          return mockData
        }
      }

      const errMsg = result?.response?.message ?? result?.error ?? 'Agent did not return a valid response. Please try again.'
      addMessage({ role: 'agent', agentName: thinkInfo?.name ?? 'Agent', agentStage: stage, error: errMsg, retryFn: () => runStage(stage, message) })
      return null
    } catch (err: any) {
      setThinking(null)

      // On any error, fallback to mock data for stages 2-6
      const mockData = getMockFallback(stage)
      if (mockData) {
        addMessage({ role: 'system', text: `${thinkInfo?.name ?? 'Agent'} encountered an error. Using sample data to continue the workflow.` })
        setLoading(false)
        return mockData
      }

      addMessage({ role: 'agent', agentName: thinkInfo?.name ?? 'Agent', agentStage: stage, error: err?.message ?? 'Connection error. Please try again.', retryFn: () => runStage(stage, message) })
      return null
    } finally {
      setLoading(false)
    }
  }, [addMessage, getMockFallback])

  const runStage = useCallback(async (stage: number, message: string) => {
    const data = await callAgent(stage, message)
    if (!data) return false

    if (stage === 1) {
      const agentText = data?.message ?? ''
      const questions = Array.isArray(data?.questions) ? data.questions : []
      if (data?.business_brief && data.business_brief?.business_name) {
        setBriefData(data.business_brief)
        addMessage({ role: 'agent', agentName: 'Idea Intake Agent', agentStage: 1, text: agentText, questions, data: data.business_brief, dataType: 'brief' })
      } else {
        addMessage({ role: 'agent', agentName: 'Idea Intake Agent', agentStage: 1, text: agentText, questions })
      }
    } else if (stage === 2) {
      const report = data?.master_report
      if (report) setComplianceReport(report)
      addMessage({ role: 'agent', agentName: 'Compliance Research Orchestrator', agentStage: 2, text: data?.message ?? 'Compliance research complete.', data: report, dataType: 'compliance' })
      completeStage(2)
    } else if (stage === 3) {
      const dashboard = data?.execution_dashboard
      if (dashboard) setExecutionDashboard(dashboard)
      addMessage({ role: 'agent', agentName: 'Execution Orchestrator', agentStage: 3, text: data?.message ?? 'Execution plan ready.', data: dashboard, dataType: 'execution' })
      completeStage(3)
    } else if (stage === 4) {
      setFilingProgress(data)
      addMessage({ role: 'agent', agentName: 'Filing & Guidance Agent', agentStage: 4, text: data?.message ?? 'Filing guidance ready.', data, dataType: 'filing' })
      completeStage(4)
    } else if (stage === 5) {
      setFinancialData(data)
      addMessage({ role: 'agent', agentName: 'Financial Setup Agent', agentStage: 5, text: data?.message ?? 'Financial setup complete.', data, dataType: 'financial' })
      completeStage(5)
    } else if (stage === 6) {
      setPlatformData(data)
      addMessage({ role: 'agent', agentName: 'Platform Builder Agent', agentStage: 6, text: data?.message ?? 'Launch plan ready.', data, dataType: 'platform' })
      completeStage(6)
    }
    return true
  }, [callAgent, addMessage, completeStage])

  const runSampleStages = useCallback(async () => {
    if (autoRunningRef.current) return
    autoRunningRef.current = true

    addMessage({ role: 'system', text: 'Brief confirmed. Running AI agents on sample data...' })

    const sampleStages: { stage: number; agentName: string; text: string; data: any; dataType: ChatMsg['dataType']; setter: (d: any) => void }[] = [
      { stage: 2, agentName: 'Compliance Research Orchestrator', text: 'Compliance research complete. Key findings: Delaware LLC registration required, CCPA compliance needed, trademark protection recommended.', data: SAMPLE_COMPLIANCE_REPORT, dataType: 'compliance', setter: setComplianceReport },
      { stage: 3, agentName: 'Execution Orchestrator', text: 'Execution plan ready with 15 tasks across 3 phases. Critical path: Entity Formation > EIN > Bank Account > Payment Processing > Launch.', data: SAMPLE_EXECUTION_DASHBOARD, dataType: 'execution', setter: setExecutionDashboard },
      { stage: 4, agentName: 'Filing & Guidance Agent', text: 'Filing guidance ready. First task: File Certificate of Formation in Delaware. 7 total tasks identified with step-by-step instructions.', data: SAMPLE_FILING_DATA, dataType: 'filing', setter: setFilingProgress },
      { stage: 5, agentName: 'Financial Setup Agent', text: 'Financial setup complete. Recommended: Mercury for banking, Stripe for payments, QuickBooks for accounting. USDA SBIR grant eligibility confirmed.', data: SAMPLE_FINANCIAL_DATA, dataType: 'financial', setter: setFinancialData },
      { stage: 6, agentName: 'Platform Builder Agent', text: 'Launch plan ready. Recommended stack: Next.js + Vercel. 12-week timeline from entity formation to public launch.', data: SAMPLE_PLATFORM_DATA, dataType: 'platform', setter: setPlatformData },
    ]

    for (const s of sampleStages) {
      setThinking({ active: true, agentName: s.agentName, description: THINKING_DESCS[s.stage]?.desc ?? 'Processing...', stage: s.stage })
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 2000))
      setThinking(null)
      setLoading(false)
      s.setter(s.data)
      addMessage({ role: 'agent', agentName: s.agentName, agentStage: s.stage, text: s.text, data: s.data, dataType: s.dataType })
      completeStage(s.stage)
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    addMessage({ role: 'system', text: 'All 6 stages complete. Your sample business journey plan is ready -- expand each section in the right panel for details.' })
    autoRunningRef.current = false
  }, [addMessage, completeStage])

  const runAutoStages = useCallback(async (brief: any) => {
    if (autoRunningRef.current) return
    autoRunningRef.current = true
    const briefStr = JSON.stringify(brief)

    addMessage({ role: 'system', text: 'Brief confirmed. Starting automated research and planning...' })

    for (let stage = 2; stage <= 6; stage++) {
      const ok = await runStage(stage, briefStr)
      if (!ok) {
        autoRunningRef.current = false
        return
      }
    }
    addMessage({ role: 'system', text: 'All stages complete. Your business journey plan is ready in the right panel.' })
    autoRunningRef.current = false
  }, [runStage, addMessage])

  const handleConfirmBrief = useCallback(() => {
    const finalBrief = editingBrief ? editFields : briefData
    setBriefData(finalBrief)
    setBriefConfirmed(true)
    setEditingBrief(false)
    completeStage(1)
    if (showSample) {
      runSampleStages()
    } else {
      runAutoStages(finalBrief)
    }
  }, [editingBrief, editFields, briefData, completeStage, runAutoStages, runSampleStages, showSample])

  const handleDataPopupConfirm = useCallback((data: { idea: string; targetMarket: string; region: string; revenueModel: string }) => {
    setIntakeAnswers(data)
    setShowDataPopup(false)
    addMessage({ role: 'system', text: 'Business details confirmed. Analyzing your business idea...' })
    const combinedMessage = `Business Idea: ${data.idea}\nTarget Market: ${data.targetMarket}\nOperating Region: ${data.region}\nRevenue Model: ${data.revenueModel}`
    runStage(1, combinedMessage)
  }, [addMessage, runStage])

  const handleSendMessage = useCallback(async (text: string) => {
    addMessage({ role: 'user', text })

    // Handle intake Q&A flow (before brief is confirmed and before all questions are asked)
    if (!briefConfirmed && intakeStep >= 0 && intakeStep < 3 && !showSample) {
      if (intakeStep === 0) {
        // First message is the business idea — store it and ask Q1
        setIntakeAnswers(prev => ({ ...prev, idea: text }))
        setIntakeStep(1)
        setTimeout(() => {
          addMessage({ role: 'agent', agentName: 'Idea Intake Agent', agentStage: 1, text: INTAKE_QUESTIONS[0] })
        }, 600)
        return
      }
      if (intakeStep === 1) {
        // Answer to Q1 — store and ask Q2
        setIntakeAnswers(prev => ({ ...prev, targetMarket: text }))
        setIntakeStep(2)
        setTimeout(() => {
          addMessage({ role: 'agent', agentName: 'Idea Intake Agent', agentStage: 1, text: INTAKE_QUESTIONS[1] })
        }, 600)
        return
      }
      if (intakeStep === 2) {
        // Answer to Q2 — store and ask Q3
        setIntakeAnswers(prev => ({ ...prev, region: text }))
        setIntakeStep(3)
        setTimeout(() => {
          addMessage({ role: 'agent', agentName: 'Idea Intake Agent', agentStage: 1, text: INTAKE_QUESTIONS[2] })
        }, 600)
        return
      }
    }

    // Answer to Q3 — store and show popup
    if (!briefConfirmed && intakeStep === 3 && !showSample) {
      const updatedAnswers = { ...intakeAnswers, revenueModel: text }
      setIntakeAnswers(updatedAnswers)
      setIntakeStep(4)
      setTimeout(() => {
        setShowDataPopup(true)
      }, 400)
      return
    }

    // Support or post-brief questions
    const isSupport = /^(help:|question:|support:)/i.test(text) || (briefConfirmed && !autoRunningRef.current && completedStages.includes(6))
    if (isSupport || (briefConfirmed && !autoRunningRef.current)) {
      setThinking({ active: true, agentName: 'Support Companion', description: 'Looking up relevant information for your question...', stage: 0 })
      setLoading(true)
      try {
        const result = await callAIAgent(text, AGENTS.SUPPORT)
        setThinking(null)
        setLoading(false)
        if (result?.success && result?.response?.result) {
          const d = result.response.result
          const tips = Array.isArray(d?.tips) ? d.tips : []
          const related = Array.isArray(d?.related_topics) ? d.related_topics : []
          let fullText = d?.answer ?? ''
          if (tips.length > 0) fullText += '\n\n**Tips:**\n' + tips.map((t: string) => `- ${t}`).join('\n')
          if (related.length > 0) fullText += '\n\n**Related Topics:** ' + related.join(', ')
          addMessage({ role: 'agent', agentName: 'Support Companion', text: fullText, dataType: 'support' })
        } else {
          addMessage({ role: 'agent', agentName: 'Support Companion', error: result?.response?.message ?? 'Could not get an answer. Please try again.' })
        }
      } catch {
        setThinking(null)
        setLoading(false)
        addMessage({ role: 'agent', agentName: 'Support Companion', error: 'Connection error.' })
      }
      return
    }

    await runStage(1, text)
  }, [addMessage, briefConfirmed, completedStages, runStage, intakeStep, intakeAnswers, showSample])

  const handleToggleSample = useCallback((on: boolean) => {
    setShowSample(on)
    if (on) {
      setBriefData(SAMPLE_BRIEF)
      setBriefConfirmed(false)
      setCompletedStages([])
      setCurrentStage(1)
      setIntakeStep(0)
      setIntakeAnswers({ idea: '', targetMarket: '', region: '', revenueModel: '' })
      setShowDataPopup(false)
      setMessages([
        { id: makeId(), role: 'user', text: 'I want to build an AI-powered crop analytics platform for sustainable farming.' },
        { id: makeId(), role: 'agent', agentName: 'Idea Intake Agent', agentStage: 1, text: 'I have analyzed your concept and generated a Business Brief for GreenLeaf Analytics. Please review the details and confirm or edit as needed.', data: SAMPLE_BRIEF, dataType: 'brief' },
      ])
    } else {
      setBriefData(null)
      setBriefConfirmed(false)
      setCompletedStages([])
      setCurrentStage(1)
      setIntakeStep(0)
      setIntakeAnswers({ idea: '', targetMarket: '', region: '', revenueModel: '' })
      setShowDataPopup(false)
      setComplianceReport(null)
      setExecutionDashboard(null)
      setFilingProgress(null)
      setFinancialData(null)
      setPlatformData(null)
      setMessages([])
    }
  }, [])

  return (
    <ErrorBoundary>
      <div className="min-h-screen h-screen bg-background text-foreground flex overflow-hidden">
        <Sidebar currentStage={currentStage} completedStages={completedStages} onOpenEmail={() => setToolsModal('email')} onOpenMeeting={() => setToolsModal('meeting')} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E293B] bg-[#0B1120]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {AGENT_INFO.slice(0, 6).map((agent, i) => {
                  const isCompleted = completedStages.includes(i + 1)
                  const isActive = currentStage === i + 1
                  const isThinking = thinking?.stage === i + 1
                  return (
                    <React.Fragment key={agent.id}>
                      <div className="flex items-center gap-1" title={agent.name}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium transition-all ${
                          isCompleted ? 'bg-[#10B981] text-white' :
                          isThinking ? 'bg-[#6366F1] text-white animate-pulse' :
                          isActive ? 'bg-[#6366F1]/20 text-[#818CF8] ring-1 ring-[#6366F1]/40' :
                          'bg-[#334155] text-[#CBD5E1]'
                        }`}>
                          {isCompleted ? <Check className="w-2.5 h-2.5" /> : i + 1}
                        </div>
                      </div>
                      {i < 5 && (
                        <div className={`w-4 h-[2px] rounded-full ${isCompleted ? 'bg-[#10B981]' : 'bg-[#475569]'}`} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
              <Badge variant="outline" className="text-[10px] bg-[#6366F1]/10 text-[#818CF8] border-[#6366F1]/30 ml-2">
                {completedStages.length === 6 ? 'Complete' : `Stage ${currentStage} of 6`}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch id="sample-toggle" checked={showSample} onCheckedChange={handleToggleSample} />
                <Label htmlFor="sample-toggle" className="text-[10px] text-[#94A3B8] cursor-pointer">Sample Mode</Label>
              </div>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0" style={{ flex: '0 0 62%' }}>
              <ChatInterface
                messages={messages}
                thinking={thinking}
                onSendMessage={handleSendMessage}
                loading={loading}
                briefConfirmed={briefConfirmed}
                briefData={briefData}
                onConfirmBrief={handleConfirmBrief}
                onEditBrief={() => { setEditFields({ ...briefData }); setEditingBrief(true) }}
                editingBrief={editingBrief}
                editFields={editFields}
                onEditFieldChange={(key, value) => setEditFields((prev: any) => ({ ...prev, [key]: value }))}
                onDoneEditing={() => setEditingBrief(false)}
              />
            </div>
            <div style={{ flex: '0 0 38%' }}>
              <BusinessPlanPanel
                briefData={briefData}
                complianceReport={complianceReport}
                executionDashboard={executionDashboard}
                filingProgress={filingProgress}
                financialData={financialData}
                platformData={platformData}
                completedStages={completedStages}
              />
            </div>
          </div>
        </div>
        {toolsModal && (
          <ProductivityTools mode={toolsModal} onClose={() => setToolsModal(null)} />
        )}
        {showDataPopup && (
          <DataCollectionPopup
            data={intakeAnswers}
            onConfirm={handleDataPopupConfirm}
            onClose={() => setShowDataPopup(false)}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
