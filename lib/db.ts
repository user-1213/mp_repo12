// Shared singleton in-memory data store
// All API routes import from here so data persists across requests

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // plain for demo (would be bcrypt hashed in prod)
  role: "employee" | "agent" | "admin";
  department?: string;
  skills?: string[];
  workload?: number;       // current open tickets assigned
  successRate?: number;     // 0-1, fraction of tickets resolved successfully
  resolvedCount?: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "escalated" | "resolved" | "closed";
  createdBy: string;         // userId
  createdByName: string;
  assignedTo?: string;       // agentId
  assignedToName?: string;
  assignedSkillMatch?: number;
  routingReason?: string;
  chatSessionId?: string;    // if created from chatbot
  aiClassification?: {
    category: string;
    priority: string;
    confidence: number;
  };
  notes: TicketNote[];
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface TicketNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface TimelineEntry {
  id: string;
  action: string;
  details: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  embedding: number[] | null;
  successCount: number;
  totalUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: {
    confidence?: number;
    confidenceBreakdown?: { similarity: number; llmConfidence: number; successRate: number };
    classification?: { category: string; priority: string; confidence: number };
    similarArticles?: { id: string; title: string; similarity: number }[];
    suggestedSteps?: string[];
    rootCause?: string;
    action?: "auto-resolve" | "suggest" | "escalate";
  };
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  status: "active" | "resolved" | "ticket-created";
  lastQuery?: string;
  lastClassification?: { category: string; priority: string; confidence: number };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "assignment" | "escalation" | "status-change" | "note" | "sla-warning";
  title: string;
  message: string;
  ticketId?: string;
  read: boolean;
  createdAt: string;
}

// ── Pre-seeded data ──────────────────────────────────────────

const users: User[] = [
  // Employees
  { id: "emp-1", name: "Alice Johnson", email: "alice@company.com", password: "password123", role: "employee", department: "Marketing", createdAt: "2025-01-15T09:00:00Z" },
  { id: "emp-2", name: "Bob Smith", email: "bob@company.com", password: "password123", role: "employee", department: "Sales", createdAt: "2025-02-01T09:00:00Z" },
  { id: "emp-3", name: "Carol Williams", email: "carol@company.com", password: "password123", role: "employee", department: "Engineering", createdAt: "2025-01-20T09:00:00Z" },
  // Agents
  { id: "agent-1", name: "David Chen", email: "david@itsupport.com", password: "password123", role: "agent", skills: ["Network", "Security", "Hardware"], workload: 3, successRate: 0.92, resolvedCount: 147, createdAt: "2024-06-01T09:00:00Z" },
  { id: "agent-2", name: "Eva Martinez", email: "eva@itsupport.com", password: "password123", role: "agent", skills: ["Software", "Account", "Email"], workload: 2, successRate: 0.88, resolvedCount: 123, createdAt: "2024-07-15T09:00:00Z" },
  { id: "agent-3", name: "Frank Wilson", email: "frank@itsupport.com", password: "password123", role: "agent", skills: ["Performance", "Network", "Software", "Hardware"], workload: 4, successRate: 0.95, resolvedCount: 189, createdAt: "2024-03-01T09:00:00Z" },
  // Admin
  { id: "admin-1", name: "Grace Lee", email: "admin@company.com", password: "admin123", role: "admin", createdAt: "2024-01-01T09:00:00Z" },
];

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

const tickets: Ticket[] = [
  {
    id: "TKT-001", title: "VPN connection dropping frequently", description: "My VPN disconnects every 15-20 minutes. I've tried restarting the client and my computer but it keeps happening. This is affecting my ability to access internal resources remotely.",
    category: "Network", priority: "high", status: "open",
    createdBy: "emp-1", createdByName: "Alice Johnson",
    assignedTo: "agent-1", assignedToName: "David Chen", assignedSkillMatch: 95, routingReason: "Network specialist with highest skill match",
    aiClassification: { category: "Network", priority: "high", confidence: 0.91 },
    notes: [], timeline: [{ id: "tl-1", action: "created", details: "Ticket created", userId: "emp-1", userName: "Alice Johnson", createdAt: h(48) }],
    createdAt: h(48), updatedAt: h(48),
  },
  {
    id: "TKT-002", title: "Cannot install Microsoft Teams update", description: "Getting error code 0x80070005 when trying to update Microsoft Teams. Tried running as administrator but still fails.",
    category: "Software", priority: "medium", status: "in-progress",
    createdBy: "emp-2", createdByName: "Bob Smith",
    assignedTo: "agent-2", assignedToName: "Eva Martinez", assignedSkillMatch: 90, routingReason: "Software specialist with low workload",
    aiClassification: { category: "Software", priority: "medium", confidence: 0.87 },
    notes: [{ id: "n-1", content: "Checking Windows Update service status and permissions", authorId: "agent-2", authorName: "Eva Martinez", createdAt: h(20) }],
    timeline: [
      { id: "tl-2a", action: "created", details: "Ticket created", userId: "emp-2", userName: "Bob Smith", createdAt: h(36) },
      { id: "tl-2b", action: "status-change", details: "Status changed to In Progress", userId: "agent-2", userName: "Eva Martinez", createdAt: h(24) },
    ],
    createdAt: h(36), updatedAt: h(20),
  },
  {
    id: "TKT-003", title: "Outlook not syncing emails", description: "My Outlook hasn't received any new emails since yesterday morning. Calendar events are also not syncing. Other colleagues in my department seem to be fine.",
    category: "Email", priority: "high", status: "open",
    createdBy: "emp-3", createdByName: "Carol Williams",
    assignedTo: "agent-2", assignedToName: "Eva Martinez", assignedSkillMatch: 88, routingReason: "Email specialist",
    aiClassification: { category: "Email", priority: "high", confidence: 0.93 },
    notes: [], timeline: [{ id: "tl-3", action: "created", details: "Ticket created", userId: "emp-3", userName: "Carol Williams", createdAt: h(18) }],
    createdAt: h(18), updatedAt: h(18),
  },
  {
    id: "TKT-004", title: "Laptop overheating and shutting down", description: "My Dell Latitude keeps overheating during video calls. The fan runs at max speed and then the laptop shuts down completely. This has happened 3 times today.",
    category: "Hardware", priority: "critical", status: "open",
    createdBy: "emp-1", createdByName: "Alice Johnson",
    assignedTo: "agent-1", assignedToName: "David Chen", assignedSkillMatch: 92, routingReason: "Hardware specialist with high success rate",
    aiClassification: { category: "Hardware", priority: "critical", confidence: 0.96 },
    notes: [], timeline: [{ id: "tl-4", action: "created", details: "Ticket created", userId: "emp-1", userName: "Alice Johnson", createdAt: h(6) }],
    createdAt: h(6), updatedAt: h(6),
  },
  {
    id: "TKT-005", title: "Password reset not working", description: "I tried resetting my password through the self-service portal but never received the reset email. Checked spam folder as well.",
    category: "Account", priority: "medium", status: "resolved",
    createdBy: "emp-2", createdByName: "Bob Smith",
    assignedTo: "agent-2", assignedToName: "Eva Martinez", assignedSkillMatch: 94, routingReason: "Account specialist",
    aiClassification: { category: "Account", priority: "medium", confidence: 0.89 },
    notes: [{ id: "n-2", content: "Reset performed manually. User's secondary email was incorrect in the system.", authorId: "agent-2", authorName: "Eva Martinez", createdAt: h(60) }],
    timeline: [
      { id: "tl-5a", action: "created", details: "Ticket created", userId: "emp-2", userName: "Bob Smith", createdAt: h(72) },
      { id: "tl-5b", action: "status-change", details: "Resolved", userId: "agent-2", userName: "Eva Martinez", createdAt: h(60) },
    ],
    createdAt: h(72), updatedAt: h(60), resolvedAt: h(60), resolution: "Manually reset password and corrected secondary email address in the system.",
  },
  {
    id: "TKT-006", title: "Slow network speed in Building B", description: "All users in Building B Floor 3 are experiencing very slow network speeds. Downloads are taking forever and video calls keep buffering.",
    category: "Network", priority: "critical", status: "in-progress",
    createdBy: "emp-3", createdByName: "Carol Williams",
    assignedTo: "agent-1", assignedToName: "David Chen", assignedSkillMatch: 97, routingReason: "Network specialist, critical priority match",
    aiClassification: { category: "Network", priority: "critical", confidence: 0.95 },
    notes: [{ id: "n-3", content: "Investigating switch configuration in Building B network closet", authorId: "agent-1", authorName: "David Chen", createdAt: h(10) }],
    timeline: [
      { id: "tl-6a", action: "created", details: "Ticket created", userId: "emp-3", userName: "Carol Williams", createdAt: h(12) },
      { id: "tl-6b", action: "status-change", details: "Status changed to In Progress", userId: "agent-1", userName: "David Chen", createdAt: h(10) },
    ],
    createdAt: h(12), updatedAt: h(10),
  },
  {
    id: "TKT-007", title: "Application crashes when generating reports", description: "The internal reporting tool crashes every time I try to generate the monthly sales report. Error message says 'Out of memory'.",
    category: "Software", priority: "high", status: "open",
    createdBy: "emp-1", createdByName: "Alice Johnson",
    assignedTo: "agent-3", assignedToName: "Frank Wilson", assignedSkillMatch: 88, routingReason: "Software + Performance specialist",
    aiClassification: { category: "Software", priority: "high", confidence: 0.84 },
    notes: [], timeline: [{ id: "tl-7", action: "created", details: "Ticket created", userId: "emp-1", userName: "Alice Johnson", createdAt: h(24) }],
    createdAt: h(24), updatedAt: h(24),
  },
  {
    id: "TKT-008", title: "Printer not responding on 2nd floor", description: "The shared printer HP LaserJet on the 2nd floor is not responding to any print jobs. The printer shows as online but jobs are stuck in the queue.",
    category: "Hardware", priority: "medium", status: "resolved",
    createdBy: "emp-2", createdByName: "Bob Smith",
    assignedTo: "agent-1", assignedToName: "David Chen", assignedSkillMatch: 85, routingReason: "Hardware specialist",
    aiClassification: { category: "Hardware", priority: "medium", confidence: 0.91 },
    notes: [{ id: "n-4", content: "Cleared print spooler and reinstalled printer driver. Working now.", authorId: "agent-1", authorName: "David Chen", createdAt: h(90) }],
    timeline: [
      { id: "tl-8a", action: "created", details: "Ticket created", userId: "emp-2", userName: "Bob Smith", createdAt: h(96) },
      { id: "tl-8b", action: "status-change", details: "Resolved", userId: "agent-1", userName: "David Chen", createdAt: h(90) },
    ],
    createdAt: h(96), updatedAt: h(90), resolvedAt: h(90), resolution: "Cleared print spooler service, removed and reinstalled printer drivers. Printer is now responding to all queued jobs.",
  },
  {
    id: "TKT-009", title: "Suspicious login attempts on my account", description: "I received multiple notifications about failed login attempts from unknown IP addresses. I'm concerned my account may be compromised.",
    category: "Security", priority: "critical", status: "escalated",
    createdBy: "emp-3", createdByName: "Carol Williams",
    assignedTo: "agent-1", assignedToName: "David Chen", assignedSkillMatch: 93, routingReason: "Security specialist, critical escalation",
    aiClassification: { category: "Security", priority: "critical", confidence: 0.97 },
    notes: [{ id: "n-5", content: "Locked account temporarily. Investigating IP addresses.", authorId: "agent-1", authorName: "David Chen", createdAt: h(3) }],
    timeline: [
      { id: "tl-9a", action: "created", details: "Ticket created", userId: "emp-3", userName: "Carol Williams", createdAt: h(4) },
      { id: "tl-9b", action: "escalated", details: "Escalated due to security concern", userId: "agent-1", userName: "David Chen", createdAt: h(3) },
    ],
    createdAt: h(4), updatedAt: h(3),
  },
  {
    id: "TKT-010", title: "Database server running slow", description: "The production database queries are taking 10x longer than usual. Application response times have increased significantly across all services.",
    category: "Performance", priority: "critical", status: "in-progress",
    createdBy: "emp-3", createdByName: "Carol Williams",
    assignedTo: "agent-3", assignedToName: "Frank Wilson", assignedSkillMatch: 96, routingReason: "Performance specialist with highest success rate",
    aiClassification: { category: "Performance", priority: "critical", confidence: 0.94 },
    notes: [{ id: "n-6", content: "Found slow query log entries. Analyzing index usage.", authorId: "agent-3", authorName: "Frank Wilson", createdAt: h(2) }],
    timeline: [
      { id: "tl-10a", action: "created", details: "Ticket created", userId: "emp-3", userName: "Carol Williams", createdAt: h(5) },
      { id: "tl-10b", action: "status-change", details: "Status changed to In Progress", userId: "agent-3", userName: "Frank Wilson", createdAt: h(2) },
    ],
    createdAt: h(5), updatedAt: h(2),
  },
  {
    id: "TKT-011", title: "Cannot access shared drive", description: "I'm unable to access the Marketing shared drive. Getting 'Access Denied' error even though I had access yesterday.",
    category: "Account", priority: "medium", status: "open",
    createdBy: "emp-1", createdByName: "Alice Johnson",
    assignedTo: "agent-2", assignedToName: "Eva Martinez", assignedSkillMatch: 90, routingReason: "Account specialist",
    aiClassification: { category: "Account", priority: "medium", confidence: 0.86 },
    notes: [], timeline: [{ id: "tl-11", action: "created", details: "Ticket created", userId: "emp-1", userName: "Alice Johnson", createdAt: h(8) }],
    createdAt: h(8), updatedAt: h(8),
  },
  {
    id: "TKT-012", title: "Wi-Fi keeps disconnecting in conference room", description: "The Wi-Fi in Conference Room A keeps disconnecting during meetings. This is very disruptive for client presentations.",
    category: "Network", priority: "high", status: "resolved",
    createdBy: "emp-2", createdByName: "Bob Smith",
    assignedTo: "agent-3", assignedToName: "Frank Wilson", assignedSkillMatch: 91, routingReason: "Network specialist",
    aiClassification: { category: "Network", priority: "high", confidence: 0.90 },
    notes: [{ id: "n-7", content: "Replaced faulty access point. Tested connectivity for 2 hours - stable.", authorId: "agent-3", authorName: "Frank Wilson", createdAt: h(48) }],
    timeline: [
      { id: "tl-12a", action: "created", details: "Ticket created", userId: "emp-2", userName: "Bob Smith", createdAt: h(72) },
      { id: "tl-12b", action: "status-change", details: "Resolved", userId: "agent-3", userName: "Frank Wilson", createdAt: h(48) },
    ],
    createdAt: h(72), updatedAt: h(48), resolvedAt: h(48), resolution: "Replaced faulty wireless access point in Conference Room A. Signal strength now at full and stable.",
  },
];

const knowledgeBase: KBArticle[] = [
  { id: "kb-1", title: "VPN Connection Troubleshooting Guide", content: "Common VPN issues and solutions: 1) Restart the VPN client application. 2) Check your internet connection stability. 3) Clear VPN cache: go to Settings > Network > VPN > Clear Cache. 4) Verify VPN server address is correct (vpn.company.com). 5) Disable any conflicting firewall rules. 6) Update VPN client to latest version. 7) If on WiFi, try switching to ethernet. 8) Contact IT if issue persists after all steps.", category: "Network", tags: ["vpn", "connection", "network", "remote"], embedding: null, successCount: 45, totalUsed: 52, createdAt: h(2000), updatedAt: h(100) },
  { id: "kb-2", title: "Microsoft Teams Installation and Update Errors", content: "Fix Teams update errors: 1) Close Teams completely (check system tray). 2) Run Windows Update first to ensure OS is current. 3) Clear Teams cache: delete contents of %appdata%/Microsoft/Teams. 4) For error 0x80070005: right-click installer > Run as Administrator. 5) If persists, uninstall Teams completely, restart, then reinstall from aka.ms/getteams. 6) Check Windows Event Viewer for detailed error logs. 7) Ensure .NET Framework 4.5+ is installed.", category: "Software", tags: ["teams", "microsoft", "update", "install", "error"], embedding: null, successCount: 38, totalUsed: 44, createdAt: h(1800), updatedAt: h(200) },
  { id: "kb-3", title: "Outlook Email Sync Issues Resolution", content: "Resolve Outlook sync problems: 1) Check Outlook is in Online mode (not Working Offline). 2) Restart Outlook application. 3) Repair Outlook profile: File > Account Settings > Email > Repair. 4) Rebuild OST file: close Outlook, rename .ost file, restart Outlook. 5) Check Exchange server status at status.company.com. 6) Verify account credentials haven't expired. 7) Run Microsoft Support and Recovery Assistant (SaRA). 8) Check mailbox size isn't exceeding quota.", category: "Email", tags: ["outlook", "email", "sync", "exchange"], embedding: null, successCount: 41, totalUsed: 47, createdAt: h(1900), updatedAt: h(150) },
  { id: "kb-4", title: "Laptop Overheating Solutions", content: "Fix laptop overheating: 1) Ensure vents are not blocked - use on hard flat surface. 2) Clean dust from vents using compressed air. 3) Check Task Manager for CPU-heavy processes and close unnecessary ones. 4) Update BIOS and chipset drivers from manufacturer website. 5) Adjust power plan: Control Panel > Power Options > Balanced. 6) Apply fresh thermal paste if laptop is >2 years old (IT hardware team). 7) Use a laptop cooling pad for heavy workloads. 8) Schedule hardware inspection if overheating persists.", category: "Hardware", tags: ["laptop", "overheating", "hardware", "temperature", "shutdown"], embedding: null, successCount: 33, totalUsed: 38, createdAt: h(1700), updatedAt: h(300) },
  { id: "kb-5", title: "Password Reset and Account Recovery", content: "Password reset procedures: 1) Go to selfservice.company.com/reset. 2) Enter your employee ID and registered email. 3) Check email (including spam/junk) for reset link. 4) If no email received, verify your secondary email in HR portal. 5) Reset link expires in 30 minutes. 6) New password requirements: min 12 chars, upper+lower+number+special. 7) If self-service fails, contact IT helpdesk with employee ID. 8) After reset, update saved passwords in all devices.", category: "Account", tags: ["password", "reset", "account", "login", "access"], embedding: null, successCount: 52, totalUsed: 58, createdAt: h(2100), updatedAt: h(50) },
  { id: "kb-6", title: "Network Speed Troubleshooting", content: "Diagnose slow network: 1) Run speed test at speedtest.company.com. 2) Compare with expected speeds for your location. 3) Try different ethernet port or WiFi network. 4) Check for network congestion during peak hours. 5) Restart your router/switch if on local network. 6) Check for large downloads/uploads consuming bandwidth. 7) Contact network team if multiple users affected - may be infrastructure issue. 8) For building-wide issues, check network switch status in building closet.", category: "Network", tags: ["network", "speed", "slow", "bandwidth", "wifi"], embedding: null, successCount: 36, totalUsed: 42, createdAt: h(1600), updatedAt: h(80) },
  { id: "kb-7", title: "Application Crash and Out of Memory Errors", content: "Fix application crashes: 1) Close unnecessary applications to free memory. 2) Check available RAM in Task Manager - should have >2GB free. 3) Clear application cache and temp files. 4) Update the application to latest version. 5) For 'Out of Memory': increase virtual memory - System Properties > Advanced > Performance > Virtual Memory. 6) Check if 32-bit app hitting 4GB limit - request 64-bit version. 7) Run System File Checker: sfc /scannow. 8) Submit crash dump to application vendor if repeated.", category: "Software", tags: ["crash", "memory", "application", "error", "performance"], embedding: null, successCount: 29, totalUsed: 35, createdAt: h(1500), updatedAt: h(120) },
  { id: "kb-8", title: "Printer Troubleshooting Guide", content: "Fix printer issues: 1) Check printer is powered on and has paper/toner. 2) Restart the print spooler service: services.msc > Print Spooler > Restart. 3) Clear print queue: delete all jobs and retry. 4) Remove and re-add the printer in Settings > Printers. 5) Update printer driver from manufacturer website. 6) Try printing a test page from printer properties. 7) Check network connectivity if network printer. 8) For USB printers, try a different USB port.", category: "Hardware", tags: ["printer", "print", "hardware", "spooler", "queue"], embedding: null, successCount: 44, totalUsed: 49, createdAt: h(2000), updatedAt: h(90) },
  { id: "kb-9", title: "Security - Suspicious Login Detection and Response", content: "Handle suspicious logins: 1) Immediately change your password from a trusted device. 2) Enable MFA if not already active: security.company.com/mfa. 3) Review recent login activity in your account security settings. 4) Note the suspicious IP addresses and timestamps. 5) Report to security team via security@company.com. 6) Run antivirus scan on all your devices. 7) Revoke all active sessions. 8) Do NOT click any links in suspicious notification emails - verify through official portal.", category: "Security", tags: ["security", "login", "suspicious", "hack", "breach", "mfa"], embedding: null, successCount: 25, totalUsed: 28, createdAt: h(1400), updatedAt: h(60) },
  { id: "kb-10", title: "Database Performance Optimization", content: "Diagnose database slowness: 1) Check active connections and running queries. 2) Identify long-running queries in slow query log. 3) Verify index usage with EXPLAIN on problematic queries. 4) Check disk I/O and CPU utilization on DB server. 5) Review recent schema or configuration changes. 6) Analyze table statistics and run OPTIMIZE TABLE if needed. 7) Check replication lag if using replicas. 8) Consider query caching and connection pooling settings.", category: "Performance", tags: ["database", "performance", "slow", "query", "optimization"], embedding: null, successCount: 22, totalUsed: 26, createdAt: h(1300), updatedAt: h(40) },
  { id: "kb-11", title: "Shared Drive Access Permissions", content: "Fix shared drive access: 1) Verify your Active Directory group membership with IT. 2) Check if drive mapping is correct: net use Z: \\\\server\\share. 3) Clear cached credentials: Control Panel > Credential Manager. 4) Try accessing via UNC path directly: \\\\server\\share. 5) Check if your account was recently modified by HR. 6) Verify VPN is connected if accessing remotely. 7) Contact drive owner to confirm sharing permissions. 8) Request access through access.company.com portal.", category: "Account", tags: ["shared", "drive", "access", "permissions", "network"], embedding: null, successCount: 35, totalUsed: 40, createdAt: h(1600), updatedAt: h(70) },
  { id: "kb-12", title: "WiFi Connectivity Issues", content: "Fix WiFi problems: 1) Forget the WiFi network and reconnect with password. 2) Restart WiFi adapter: Device Manager > Network Adapters > Disable/Enable. 3) Run Windows Network Diagnostics. 4) Update WiFi driver from manufacturer. 5) Check for IP conflicts: ipconfig /release then ipconfig /renew. 6) Move closer to access point or check for interference. 7) Try 5GHz band if available (less interference than 2.4GHz). 8) Report to facilities if access point may be faulty.", category: "Network", tags: ["wifi", "wireless", "connection", "disconnect", "signal"], embedding: null, successCount: 40, totalUsed: 46, createdAt: h(1700), updatedAt: h(110) },
  { id: "kb-13", title: "Windows Blue Screen (BSOD) Recovery", content: "Fix BSOD: 1) Note the error code displayed on blue screen. 2) Restart computer - most BSODs are one-time events. 3) Check for recent driver updates that may have caused conflict. 4) Run Windows Memory Diagnostic: mdsched.exe. 5) Check disk health: chkdsk /f /r. 6) Update all drivers via Device Manager. 7) Roll back recent Windows updates if BSOD started after an update. 8) If recurring, check minidump files in C:\\Windows\\Minidump for analysis.", category: "Hardware", tags: ["bsod", "blue screen", "crash", "windows", "hardware"], embedding: null, successCount: 30, totalUsed: 37, createdAt: h(1500), updatedAt: h(130) },
  { id: "kb-14", title: "Two-Factor Authentication Setup", content: "Set up 2FA/MFA: 1) Go to security.company.com/mfa. 2) Choose method: Authenticator app (recommended), SMS, or hardware key. 3) For authenticator app: install Microsoft Authenticator or Google Authenticator. 4) Scan the QR code displayed on screen. 5) Enter the 6-digit code to verify. 6) Save backup codes in a secure location. 7) Register at least 2 methods for backup. 8) If locked out, contact IT with your employee ID for recovery.", category: "Security", tags: ["2fa", "mfa", "authentication", "security", "setup"], embedding: null, successCount: 48, totalUsed: 52, createdAt: h(1800), updatedAt: h(80) },
  { id: "kb-15", title: "Software License Activation Issues", content: "Fix license activation: 1) Verify your license key in the IT asset management portal. 2) Check if license has expired - renew through procurement. 3) Deactivate on old device before activating on new one. 4) For volume licenses, contact IT for KMS activation. 5) Check internet connectivity (some activations need online verification). 6) Run license activation troubleshooter if available. 7) Clear license cache and re-enter key. 8) Contact software vendor if activation server is down.", category: "Software", tags: ["license", "activation", "software", "key", "subscription"], embedding: null, successCount: 27, totalUsed: 32, createdAt: h(1400), updatedAt: h(160) },
  { id: "kb-16", title: "Email Attachment Size Limits", content: "Handle email attachment issues: 1) Company email limit is 25MB per message. 2) For larger files, use OneDrive/SharePoint sharing links. 3) Compress files with ZIP before attaching. 4) Check if file type is blocked by email security policy. 5) For multiple attachments, consider splitting across emails. 6) Use company file transfer tool at transfer.company.com for files >100MB. 7) Verify recipient's email system also accepts the file size. 8) Contact IT if legitimate file types are being blocked.", category: "Email", tags: ["email", "attachment", "size", "limit", "file"], embedding: null, successCount: 33, totalUsed: 36, createdAt: h(1600), updatedAt: h(90) },
  { id: "kb-17", title: "Remote Desktop Connection Guide", content: "Fix remote desktop issues: 1) Verify target computer has remote desktop enabled. 2) Check firewall allows RDP (port 3389). 3) Connect via VPN first if accessing from outside network. 4) Use full computer name: computername.company.local. 5) Verify your account has remote desktop access permissions. 6) Try different RDP client if default fails. 7) Check if target computer is powered on and awake. 8) For slow connections, reduce color quality and disable visual effects in RDP settings.", category: "Network", tags: ["remote", "desktop", "rdp", "connection", "vpn"], embedding: null, successCount: 31, totalUsed: 36, createdAt: h(1500), updatedAt: h(100) },
  { id: "kb-18", title: "Antivirus False Positive Handling", content: "Handle antivirus false positives: 1) Do NOT disable antivirus without IT approval. 2) Check if flagged file is from a trusted source. 3) Submit file to IT security team for analysis. 4) If confirmed false positive, IT will add exception to company AV policy. 5) Do not add exceptions yourself as it may violate security policy. 6) Report the false positive to AV vendor through IT. 7) Keep AV definitions updated. 8) If blocking critical work, contact IT for temporary allowlist.", category: "Security", tags: ["antivirus", "false positive", "security", "malware", "exception"], embedding: null, successCount: 20, totalUsed: 24, createdAt: h(1300), updatedAt: h(140) },
  { id: "kb-19", title: "Monitor Display Issues", content: "Fix display problems: 1) Check all cable connections (HDMI/DisplayPort/VGA). 2) Try a different cable. 3) Update graphics driver from Device Manager. 4) Adjust resolution: Settings > Display > Resolution. 5) If flickering, check refresh rate settings (60Hz recommended). 6) For multi-monitor: detect displays in Settings > Display > Detect. 7) Reset monitor to factory settings via monitor's OSD menu. 8) Try connecting monitor to a different computer to isolate issue.", category: "Hardware", tags: ["monitor", "display", "screen", "resolution", "graphics"], embedding: null, successCount: 28, totalUsed: 33, createdAt: h(1400), updatedAt: h(120) },
  { id: "kb-20", title: "Slow Computer Performance Optimization", content: "Speed up slow computer: 1) Check Task Manager for high CPU/Memory/Disk processes. 2) Restart computer (clears memory leaks). 3) Disable unnecessary startup programs: Task Manager > Startup. 4) Run Disk Cleanup to free space. 5) Check for malware with full antivirus scan. 6) Ensure at least 15% free disk space. 7) Check if Windows Update is running in background. 8) Request RAM upgrade if consistently using >85% memory.", category: "Performance", tags: ["slow", "performance", "computer", "speed", "optimization"], embedding: null, successCount: 42, totalUsed: 48, createdAt: h(1800), updatedAt: h(60) },
  { id: "kb-21", title: "Email Phishing Identification Guide", content: "Identify phishing emails: 1) Check sender address carefully - look for misspellings. 2) Hover over links before clicking - verify URL matches expected domain. 3) Be suspicious of urgent/threatening language. 4) Don't open unexpected attachments. 5) Company will never ask for passwords via email. 6) Check for poor grammar and formatting. 7) Report phishing to phishing@company.com. 8) If you clicked a phishing link, change your password immediately and report to IT security.", category: "Security", tags: ["phishing", "email", "security", "scam", "fraud"], embedding: null, successCount: 37, totalUsed: 40, createdAt: h(1700), updatedAt: h(70) },
  { id: "kb-22", title: "New Employee IT Setup Checklist", content: "New employee setup: 1) Activate account via welcome email link. 2) Set password following company policy. 3) Set up MFA at security.company.com/mfa. 4) Install required software from software.company.com. 5) Configure VPN client for remote access. 6) Set up Outlook email profile. 7) Join required Teams channels. 8) Request access to department shared drives via access.company.com. 9) Complete security awareness training. 10) Bookmark IT self-service portal at help.company.com.", category: "Account", tags: ["new employee", "onboarding", "setup", "account", "access"], embedding: null, successCount: 50, totalUsed: 53, createdAt: h(2000), updatedAt: h(40) },
  { id: "kb-23", title: "Zoom Audio/Video Troubleshooting", content: "Fix Zoom issues: 1) Check microphone and speaker selection in Zoom settings. 2) Test audio in Zoom: Settings > Audio > Test Mic/Speaker. 3) Ensure browser/app has microphone permission. 4) Close other apps using the microphone. 5) Update Zoom to latest version. 6) Check USB headset connection. 7) For video: ensure camera is not blocked/covered. 8) Restart Zoom if audio/video is glitchy. 9) Check bandwidth - Zoom needs minimum 1.5Mbps for HD.", category: "Software", tags: ["zoom", "audio", "video", "meeting", "conference"], embedding: null, successCount: 35, totalUsed: 40, createdAt: h(1600), updatedAt: h(80) },
  { id: "kb-24", title: "Backup and Data Recovery Procedures", content: "Data recovery steps: 1) Check Recycle Bin first. 2) Company files on shared drives have nightly backups. 3) Request restore from backup via backup.company.com (up to 30 days). 4) OneDrive files: check Version History (right-click > Version History). 5) For local files: check if File History is enabled. 6) Do NOT write new data to the drive to avoid overwriting deleted files. 7) For critical data loss, contact IT immediately for professional recovery. 8) Prevention: save work to OneDrive/shared drives, not local Desktop.", category: "Software", tags: ["backup", "recovery", "data", "restore", "files"], embedding: null, successCount: 24, totalUsed: 30, createdAt: h(1500), updatedAt: h(110) },
  { id: "kb-25", title: "VPN Split Tunneling Configuration", content: "Configure VPN split tunneling: 1) Split tunneling allows direct internet access while on VPN. 2) Open VPN client settings. 3) Look for 'Split Tunnel' or 'Routing' options. 4) Enable split tunneling. 5) Add company-specific routes only (10.x.x.x, 172.16.x.x). 6) This improves video call quality while on VPN. 7) Note: some security policies may prohibit split tunneling. 8) Contact IT if you need split tunneling enabled on company VPN.", category: "Network", tags: ["vpn", "split tunnel", "routing", "performance", "network"], embedding: null, successCount: 18, totalUsed: 22, createdAt: h(1400), updatedAt: h(90) },
];

const chatSessions: ChatSession[] = [];
const notifications: Notification[] = [
  { id: "notif-1", userId: "agent-1", type: "assignment", title: "New Ticket Assigned", message: "TKT-004 (Laptop overheating) has been assigned to you - Critical priority", ticketId: "TKT-004", read: false, createdAt: h(6) },
  { id: "notif-2", userId: "agent-2", type: "assignment", title: "New Ticket Assigned", message: "TKT-003 (Outlook not syncing) has been assigned to you - High priority", ticketId: "TKT-003", read: false, createdAt: h(18) },
  { id: "notif-3", userId: "agent-1", type: "escalation", title: "Ticket Escalated", message: "TKT-009 (Suspicious login attempts) has been escalated - Critical security issue", ticketId: "TKT-009", read: true, createdAt: h(3) },
  { id: "notif-4", userId: "agent-3", type: "assignment", title: "New Ticket Assigned", message: "TKT-010 (Database server running slow) has been assigned to you - Critical priority", ticketId: "TKT-010", read: false, createdAt: h(5) },
  { id: "notif-5", userId: "agent-2", type: "sla-warning", title: "SLA Warning", message: "TKT-011 (Cannot access shared drive) is approaching SLA deadline", ticketId: "TKT-011", read: false, createdAt: h(2) },
];

// ── Exported singleton ──

export const db = {
  users,
  tickets,
  knowledgeBase,
  chatSessions,
  notifications,
};

// ── Helper functions ──

let ticketCounter = 12;
export function nextTicketId(): string {
  ticketCounter++;
  return `TKT-${String(ticketCounter).padStart(3, "0")}`;
}

let idCounter = 1000;
export function nextId(): string {
  idCounter++;
  return `id-${idCounter}`;
}
