import type {
  ActivityItem,
  CoveragePoint,
  DashboardSummary,
  Notification,
  Policy,
  Scheme,
  TrendPoint,
} from "@workspace/api-zod";

export const policies: Policy[] = [
  {
    id: 101,
    title: "National Education Policy 2020",
    category: "Education",
    ministry: "Ministry of Education",
    state: "National",
    status: "Active",
    publishedDate: "2020-07-29",
    summary:
      "A learner-centred framework focused on foundational literacy, multidisciplinary education, and equitable access.",
    tags: ["education", "skills", "foundational learning"],
    impact: "High",
  },
  {
    id: 102,
    title: "Digital Personal Data Protection Act",
    category: "Digital Governance",
    ministry: "Ministry of Electronics & IT",
    state: "National",
    status: "Active",
    publishedDate: "2023-08-11",
    summary:
      "A national framework for responsible processing of digital personal data and protection of citizen rights.",
    tags: ["data", "privacy", "digital governance"],
    impact: "High",
  },
  {
    id: 103,
    title: "PM Gati Shakti National Master Plan",
    category: "Infrastructure",
    ministry: "Ministry of Commerce & Industry",
    state: "National",
    status: "Under review",
    publishedDate: "2021-10-13",
    summary:
      "A coordinated infrastructure planning framework to improve multimodal connectivity and logistics efficiency.",
    tags: ["infrastructure", "logistics", "planning"],
    impact: "Medium",
  },
  {
    id: 104,
    title: "National Health Mission — Rajasthan",
    category: "Healthcare",
    ministry: "Department of Medical, Health & FW",
    state: "Rajasthan",
    status: "Active",
    publishedDate: "2024-04-02",
    summary:
      "State implementation guidance for strengthening primary care, maternal health, and community health services.",
    tags: ["healthcare", "primary care", "Rajasthan"],
    impact: "High",
  },
  {
    id: 105,
    title: "PM-KUSUM Renewable Agriculture Framework",
    category: "Agriculture",
    ministry: "Ministry of New & Renewable Energy",
    state: "National",
    status: "Active",
    publishedDate: "2024-05-18",
    summary:
      "Guidance for solar pumps, decentralized renewable power, and farmer income support through clean energy.",
    tags: ["agriculture", "renewable energy", "farmers"],
    impact: "Medium",
  },
  {
    id: 106,
    title: "Women-led Development Mission",
    category: "Women & Child Welfare",
    ministry: "Ministry of Women & Child Development",
    state: "National",
    status: "Draft",
    publishedDate: "2024-06-12",
    summary:
      "An outcomes framework to increase participation, safety, and economic opportunity for women and girls.",
    tags: ["women", "safety", "livelihoods"],
    impact: "High",
  },
];

export const schemes: Scheme[] = [
  {
    id: 201,
    name: "PM-KISAN",
    category: "Farmer Welfare",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    state: "National",
    benefit: "₹6,000 annual income support",
    deadline: "31 Dec 2024",
    beneficiaries: "Small and marginal farmer families",
    eligibility: ["Landholding farmer family", "Valid Aadhaar", "Bank account linked to Aadhaar"],
    description:
      "Direct income support for eligible farmer families to help meet farm input and household needs.",
    steps: ["Verify land records", "Complete e-KYC", "Submit bank details", "Track installment status"],
  },
  {
    id: 202,
    name: "Post Matric Scholarship — SC",
    category: "Scholarships",
    ministry: "Ministry of Social Justice & Empowerment",
    state: "National",
    benefit: "Tuition, maintenance, and study support",
    deadline: "15 Nov 2024",
    beneficiaries: "Students from Scheduled Caste communities",
    eligibility: ["SC certificate", "Post-matric course enrollment", "Family income within notified limit"],
    description:
      "Financial support for students continuing education after secondary school across approved institutions.",
    steps: ["Create scholarship profile", "Upload caste and income certificates", "Verify institution", "Submit application"],
  },
  {
    id: 203,
    name: "Ayushman Bharat PM-JAY",
    category: "Healthcare",
    ministry: "Ministry of Health & Family Welfare",
    state: "National",
    benefit: "Health cover up to ₹5 lakh per family",
    deadline: "Open enrollment",
    beneficiaries: "Eligible low-income households",
    eligibility: ["Household listed in SECC database", "Indian resident", "Valid identity document"],
    description:
      "Cashless access to secondary and tertiary care at empanelled public and private hospitals.",
    steps: ["Check beneficiary status", "Visit an empanelled centre", "Verify identity", "Receive e-card"],
  },
  {
    id: 204,
    name: "PMAY — Urban Housing",
    category: "Housing",
    ministry: "Ministry of Housing & Urban Affairs",
    state: "National",
    benefit: "Interest subsidy and housing assistance",
    deadline: "31 Mar 2025",
    beneficiaries: "Urban households without a pucca home",
    eligibility: ["Urban resident", "No existing pucca home", "Income within scheme band"],
    description:
      "Support for affordable housing, home ownership, and basic civic infrastructure in urban areas.",
    steps: ["Check income category", "Register through local body", "Submit documents", "Track sanction"],
  },
  {
    id: 205,
    name: "Startup India Seed Fund",
    category: "Business Support",
    ministry: "Department for Promotion of Industry & Internal Trade",
    state: "National",
    benefit: "Prototype and market-entry grant support",
    deadline: "Rolling applications",
    beneficiaries: "Early-stage startups",
    eligibility: ["Recognized startup", "Incorporated within notified period", "Scalable business idea"],
    description:
      "Seed funding support for proof of concept, prototype development, product trials, and market entry.",
    steps: ["Confirm startup recognition", "Prepare pitch and milestones", "Apply through incubator", "Respond to evaluation"],
  },
  {
    id: 206,
    name: "National Apprenticeship Promotion Scheme",
    category: "Employment Programs",
    ministry: "Ministry of Skill Development & Entrepreneurship",
    state: "National",
    benefit: "Stipend sharing and workplace training",
    deadline: "Open enrollment",
    beneficiaries: "Youth seeking on-the-job training",
    eligibility: ["Age 14+", "Minimum education per trade", "Registered apprentice profile"],
    description:
      "Workplace learning support connecting young people with employers and practical skills.",
    steps: ["Create apprentice profile", "Find a trade", "Apply to establishment", "Complete contract registration"],
  },
];

export const notifications: Notification[] = [
  { id: 1, title: "Scheme deadline approaching", message: "Post Matric Scholarship — SC closes in 24 days.", time: "2h ago", read: false, type: "deadline" },
  { id: 2, title: "Policy repository updated", message: "4 new policy documents were added this week.", time: "Yesterday", read: false, type: "policy" },
  { id: 3, title: "Eligibility match found", message: "You may be eligible for National Apprenticeship Promotion Scheme.", time: "2d ago", read: true, type: "match" },
  { id: 4, title: "Maintenance notice", message: "Reports will be refreshed tonight at 02:00 IST.", time: "4d ago", read: true, type: "system" },
];

export const activities: ActivityItem[] = [
  { id: 1, title: "Policy update", description: "Women-led Development Mission moved to draft review.", time: "18 min ago", type: "policy" },
  { id: 2, title: "New scheme indexed", description: "National Apprenticeship Promotion Scheme is now searchable.", time: "2 hours ago", type: "scheme" },
  { id: 3, title: "Report generated", description: "Q2 Citizen Engagement report is ready to export.", time: "Yesterday", type: "report" },
  { id: 4, title: "Eligibility check completed", description: "3 schemes matched your saved profile.", time: "Yesterday", type: "match" },
];

export const trend: TrendPoint[] = [
  { label: "Jan", policies: 24, schemes: 18 },
  { label: "Feb", policies: 31, schemes: 22 },
  { label: "Mar", policies: 28, schemes: 25 },
  { label: "Apr", policies: 36, schemes: 29 },
  { label: "May", policies: 42, schemes: 32 },
  { label: "Jun", policies: 49, schemes: 37 },
];

export const coverage: CoveragePoint[] = [
  { label: "Education", value: 82 },
  { label: "Healthcare", value: 76 },
  { label: "Agriculture", value: 68 },
  { label: "Employment", value: 61 },
  { label: "Housing", value: 48 },
];

export const dashboardSummary = (): DashboardSummary => ({
  policyCount: policies.length + 86,
  schemeCount: schemes.length + 42,
  activeAlerts: notifications.filter((item) => !item.read).length,
  savedItems: 12,
  trend,
  coverage,
});