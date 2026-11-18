/**
 * @file dashboard.ts
 * @description Premium Enterprise Mock Data Source for Rental & Property Management SaaS.
 */

// 1. Executive Key Performance Indicators (KPIs)
export const stats = {
  income: 125000,          // Collected rent this billing cycle (INR)
  targetIncome: 130000,    // Target monthly rent at 100% collection
  expenses: 42000,         // Operating, utility, and maintenance expenses
  overdue: 18000,          // Overdue balance needing recovery
  netProfit: 83000,        // Net Operating Income (NOI)
  profitMargin: 66.4,      // Net profit margin percentage
  occupancyRate: 94.2,     // Portfolio occupancy percentage
  totalProperties: 8,      // Total managed estates & complexes
  totalUnits: 26,          // Total rentable units
  occupiedUnits: 24,       // Active leased units
  vacantUnits: 2,          // Ready-to-lease vacant units
  maintenanceUnits: 1,     // Units currently under repair
  growthRate: 12.5,        // Month-over-month revenue growth rate
  avgRentPerUnit: 5208,    // Average rent across occupied units
  annualRunRate: 1500000,  // Projected Annual Revenue (ARR)
  securityDepositsHeld: 340000, // Refundable security deposit escrow
};

// 2. Historical comparison data for Recharts analytics
export const rentChart = [
  { month: "Jun", paid: 90000, expected: 110000, expenses: 35000, net: 55000 },
  { month: "Jul", paid: 105000, expected: 110000, expenses: 38000, net: 67000 },
  { month: "Aug", paid: 98000, expected: 115000, expenses: 40000, net: 58000 },
  { month: "Sep", paid: 112000, expected: 115000, expenses: 39000, net: 73000 },
  { month: "Oct", paid: 125000, expected: 130000, expenses: 42000, net: 83000 },
];

// 3. Operational Expense categories
export const expenseCategories = [
  { name: "Plumbing, Electrical & Civil Repairs", amount: 16500, percentage: 39, color: "#10b981" },
  { name: "Electricity, Water & Utilities", amount: 12000, percentage: 29, color: "#0ea5e9" },
  { name: "24/7 Security & CCTV Surveillance", amount: 7500, percentage: 18, color: "#8b5cf6" },
  { name: "Housekeeping & Facility Sanitation", amount: 4000, percentage: 9, color: "#f59e0b" },
  { name: "Municipal Taxes, Insurance & Legal", amount: 2000, percentage: 5, color: "#ec4899" },
];

// 4. Managed Estates Portfolio Showcase
export const propertyPortfolios = [
  {
    id: "PROP-01",
    name: "Greenfield Heights",
    location: "Koregaon Park, Pune",
    type: "Luxury Residential",
    units: 8,
    occupied: 8,
    occupancy: 100,
    monthlyRevenue: 52000,
    status: "100% Leased",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
    tags: ["Swimming Pool", "Clubhouse", "24/7 Power"],
  },
  {
    id: "PROP-02",
    name: "Royal Palms Residency",
    location: "Banjara Hills, Hyderabad",
    type: "Gated Community Villas",
    units: 6,
    occupied: 5,
    occupancy: 83.3,
    monthlyRevenue: 45000,
    status: "1 Villa Vacant",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
    tags: ["Private Lawn", "EV Charging", "Gym"],
  },
  {
    id: "PROP-03",
    name: "Silver Oak Enclave",
    location: "Indiranagar, Bengaluru",
    type: "Studio & 1BHK Suites",
    units: 10,
    occupied: 9,
    occupancy: 90,
    monthlyRevenue: 28000,
    status: "1 Unit Vacant",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80",
    tags: ["High-speed Wi-Fi", "Metro 200m"],
  },
  {
    id: "PROP-04",
    name: "Galaxy Commercial Hub",
    location: "Andheri East, Mumbai",
    type: "Retail & Grade-A Offices",
    units: 2,
    occupied: 2,
    occupancy: 100,
    monthlyRevenue: 35000,
    status: "100% Leased",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    tags: ["Corporate Lobby", "Valet Parking"],
  },
];

// 5. Daily Checklist Tasks
export const tasks = [
  "Send WhatsApp payment reminder to Sunita Verma (Flat 101 - ₹18,000 overdue)",
  "Approve plumbing estimate of ₹2,500 for emergency leak (Ticket #MNT-104)",
  "Schedule lease renewal signing with Rahul Mehta (Shop 03 - Galaxy Hub)",
  "Quarterly solar panel & elevator safety audit at Greenfield Heights",
  "Collect digital KYC & police verification documents for new tenant (Unit 402)",
];

// 6. Recent Rent Transactions
export const recentTransactions = [
  {
    id: "TXN-9021",
    tenant: "Aarav Sharma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    property: "Greenfield Heights",
    unit: "Flat 302",
    amount: 28000,
    date: "Today, 11:42 AM",
    method: "UPI (Google Pay)",
    status: "Completed",
    phone: "+91 98201 44521",
  },
  {
    id: "TXN-9022",
    tenant: "Priya Deshmukh",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    property: "Royal Palms Residency",
    unit: "Villa 14",
    amount: 45000,
    date: "Yesterday",
    method: "Net Banking (HDFC)",
    status: "Completed",
    phone: "+91 97654 32190",
  },
  {
    id: "TXN-9023",
    tenant: "Rohan Kulkarni",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    property: "Silver Oak Enclave",
    unit: "Studio 105",
    amount: 14000,
    date: "10 Nov 2026",
    method: "Credit Card (Auto-debit)",
    status: "Pending",
    phone: "+91 94220 88912",
  },
  {
    id: "TXN-9024",
    tenant: "Sunita Verma",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    property: "Greenfield Heights",
    unit: "Flat 101",
    amount: 18000,
    date: "05 Nov 2026",
    method: "Cash / Cheque",
    status: "Overdue",
    phone: "+91 98902 11345",
  },
  {
    id: "TXN-9025",
    tenant: "Devendra Patel",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    property: "Galaxy Commercial Hub",
    unit: "Shop 01",
    amount: 35000,
    date: "04 Nov 2026",
    method: "IMPS Transfer",
    status: "Completed",
    phone: "+91 98110 56789",
  },
];

// 7. Maintenance & Repair Requests
export const maintenanceRequests = [
  {
    id: "MNT-104",
    issue: "Water pipe leakage in master bathroom",
    property: "Greenfield Heights",
    unit: "Flat 102",
    tenant: "Sameer Patil",
    priority: "Urgent",
    status: "In Progress",
    assignedTo: "Rajesh Plumbing Works",
    reportedAt: "2 hrs ago",
    costEstimate: "₹2,500",
  },
  {
    id: "MNT-105",
    issue: "Ductless AC compressor cooling issue",
    property: "Royal Palms Residency",
    unit: "Villa 08",
    tenant: "Neha Kapoor",
    priority: "Medium",
    status: "Assigned",
    assignedTo: "CoolTech Solutions",
    reportedAt: "1 day ago",
    costEstimate: "₹4,200",
  },
  {
    id: "MNT-106",
    issue: "Balcony sliding track alignment",
    property: "Silver Oak Enclave",
    unit: "Flat 404",
    tenant: "Vikram Joshi",
    priority: "Low",
    status: "Pending",
    assignedTo: "Unassigned",
    reportedAt: "2 days ago",
    costEstimate: "₹800",
  },
];

// 8. Upcoming Lease Expirations
export const upcomingLeaseExpirations = [
  {
    id: "LSE-501",
    tenant: "Rahul Mehta",
    property: "Galaxy Commercial Hub",
    unit: "Shop 03",
    expiryDate: "30 Nov 2026",
    daysLeft: 17,
    currentRent: 35000,
    status: "Renewal Pending",
  },
  {
    id: "LSE-502",
    tenant: "Ananya Sen",
    property: "Silver Oak Enclave",
    unit: "Flat 201",
    expiryDate: "15 Dec 2026",
    daysLeft: 32,
    currentRent: 22000,
    status: "Notice Dispatched",
  },
  {
    id: "LSE-503",
    tenant: "Kavita Rao",
    property: "Royal Palms Residency",
    unit: "Villa 03",
    expiryDate: "28 Dec 2026",
    daysLeft: 45,
    currentRent: 48000,
    status: "Under Negotiation",
  },
];

// 9. Real-time Live Activity Audit Feed
export const liveActivityFeed = [
  {
    id: "ACT-01",
    type: "payment",
    title: "Rent Payment Received",
    description: "₹28,000 received from Aarav Sharma (Flat 302) via UPI",
    timestamp: "12 mins ago",
    badge: "Instant Credit",
  },
  {
    id: "ACT-02",
    type: "maintenance",
    title: "Vendor Dispatched",
    description: "Rajesh Plumbing assigned to ticket #MNT-104 (Flat 102)",
    timestamp: "1 hour ago",
    badge: "In Progress",
  },
  {
    id: "ACT-03",
    type: "lease",
    title: "Lease Renewal Agreement Prepared",
    description: "Commercial lease terms sent to Rahul Mehta (Shop 03)",
    timestamp: "3 hours ago",
    badge: "Legal",
  },
  {
    id: "ACT-04",
    type: "system",
    title: "Automated Bank Reconciliation",
    description: "4 tenant transfers matched successfully with HDFC Virtual Accounts",
    timestamp: "Yesterday",
    badge: "Verified",
  },
];
