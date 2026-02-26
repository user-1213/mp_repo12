import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    const db = await getDb();

    // Check if already seeded
    const existingUsers = await db.collection('users').countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json({ message: 'Database already seeded', count: existingUsers });
    }

    // Create indexes
    await db.collection('users').createIndex({ userId: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('tickets').createIndex({ ticketId: 1 }, { unique: true });
    await db.collection('tickets').createIndex({ createdBy: 1 });
    await db.collection('tickets').createIndex({ assignedTo: 1 });
    await db.collection('tickets').createIndex({ status: 1 });
    await db.collection('embeddings').createIndex({ sourceId: 1, sourceType: 1 });
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });
    await db.collection('kb_articles').createIndex({ category: 1 });

    const hash = (pw: string) => bcrypt.hashSync(pw, 10);
    const now = new Date();

    const users = [
      { userId: 'admin-001', name: 'Admin User', email: 'admin@company.com', password: hash('admin123'), role: 'admin', createdAt: now, updatedAt: now },
      { userId: 'agent-001', name: 'John Smith', email: 'john@company.com', password: hash('agent123'), role: 'agent', skills: ['Network', 'Security', 'Hardware'], experienceLevel: 'senior', activeTickets: 2, maxTickets: 10, successRate: 0.92, totalResolved: 145, createdAt: now, updatedAt: now },
      { userId: 'agent-002', name: 'Sarah Chen', email: 'sarah@company.com', password: hash('agent123'), role: 'agent', skills: ['Software', 'Email', 'Database'], experienceLevel: 'senior', activeTickets: 1, maxTickets: 10, successRate: 0.88, totalResolved: 120, createdAt: now, updatedAt: now },
      { userId: 'agent-003', name: 'Mike Johnson', email: 'mike@company.com', password: hash('agent123'), role: 'agent', skills: ['Network', 'Software', 'Hardware'], experienceLevel: 'mid', activeTickets: 0, maxTickets: 10, successRate: 0.78, totalResolved: 65, createdAt: now, updatedAt: now },
      { userId: 'emp-001', name: 'Alice Brown', email: 'alice@company.com', password: hash('emp123'), role: 'employee', createdAt: now, updatedAt: now },
      { userId: 'emp-002', name: 'Bob Wilson', email: 'bob@company.com', password: hash('emp123'), role: 'employee', createdAt: now, updatedAt: now },
    ];
    await db.collection('users').insertMany(users);

    const kbArticles = [
      { title: 'VPN Connection Troubleshooting Guide', content: 'Common VPN issues include expired certificates, incorrect server addresses, and firewall blocking. Steps: 1) Check VPN client version 2) Verify credentials 3) Check certificate expiry 4) Try alternative VPN server 5) Contact network team if persists.', category: 'Network', tags: ['vpn', 'network', 'connectivity', 'remote-access'], solution: 'Update VPN client, refresh certificates, verify server settings. If certificate expired, request new certificate from IT admin.', successCount: 89, totalUsed: 102, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'Email Configuration for Outlook', content: 'Outlook email issues: sync failures, authentication errors, profile corruption. Steps: 1) Check server settings (IMAP/SMTP) 2) Re-enter credentials 3) Repair Outlook profile 4) Clear cached credentials 5) Create new profile if needed.', category: 'Email', tags: ['email', 'outlook', 'configuration', 'sync'], solution: 'Repair Outlook profile via Control Panel > Mail > Show Profiles. Clear cached credentials from Windows Credential Manager.', successCount: 76, totalUsed: 88, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'Windows Blue Screen Error Resolution', content: 'Blue Screen of Death (BSOD) troubleshooting: check recent driver updates, run memory diagnostics, check disk health. Steps: 1) Note error code 2) Boot to Safe Mode 3) Rollback recent driver 4) Run sfc /scannow 5) Check Event Viewer 6) Run memory diagnostic.', category: 'Hardware', tags: ['bsod', 'windows', 'crash', 'hardware'], solution: 'Boot into Safe Mode, rollback recent driver updates, run system file checker (sfc /scannow) and memory diagnostics (mdsched.exe).', successCount: 54, totalUsed: 71, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'Database Connection Timeout Resolution', content: 'Database connection timeouts can be caused by network issues, connection pool exhaustion, or server overload. Steps: 1) Check database server status 2) Verify connection string 3) Increase connection timeout 4) Check connection pool settings 5) Monitor server resources.', category: 'Database', tags: ['database', 'connection', 'timeout', 'performance'], solution: 'Increase connection timeout in application config. Check and optimize connection pool size. If server overloaded, scale database resources.', successCount: 42, totalUsed: 55, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'Malware Detection and Removal', content: 'Steps for handling suspected malware: 1) Disconnect from network immediately 2) Run full antivirus scan 3) Check Task Manager for suspicious processes 4) Run Malwarebytes scan 5) Check browser extensions 6) Reset passwords if breach suspected 7) Report to security team.', category: 'Security', tags: ['malware', 'virus', 'security', 'antivirus'], solution: 'Disconnect from network, run full antivirus + Malwarebytes scan, remove detected threats, change all passwords, enable 2FA, report incident to security team.', successCount: 38, totalUsed: 45, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'Software Installation Permission Issues', content: 'When employees cannot install software due to admin restrictions. Steps: 1) Verify software is on approved list 2) Submit software request form 3) IT admin grants temporary elevation 4) Install via Software Center 5) Verify installation 6) Remove temp elevation.', category: 'Software', tags: ['software', 'installation', 'permissions', 'admin-rights'], solution: 'Use Company Portal / Software Center for approved apps. For unapproved software, submit request to IT for review and temporary admin elevation.', successCount: 67, totalUsed: 80, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'Printer Not Found on Network', content: 'Network printer issues: printer offline, cannot find printer, print queue stuck. Steps: 1) Check printer power and network cable 2) Ping printer IP address 3) Reinstall printer driver 4) Clear print spooler 5) Add printer by IP address 6) Check firewall settings.', category: 'Hardware', tags: ['printer', 'network', 'hardware', 'driver'], solution: 'Clear print spooler (net stop spooler, delete files in spool PRINTERS, net start spooler). Reinstall printer by IP address.', successCount: 58, totalUsed: 68, createdBy: 'admin-001', createdAt: now, updatedAt: now },
      { title: 'WiFi Connectivity Drops Repeatedly', content: 'Intermittent WiFi issues: frequent disconnections, slow speeds, unable to connect. Steps: 1) Forget and rejoin network 2) Update WiFi driver 3) Reset network adapter 4) Check for interference 5) Try 5GHz band 6) Reset TCP/IP stack.', category: 'Network', tags: ['wifi', 'wireless', 'connectivity', 'network'], solution: 'Run network troubleshooter, update WiFi driver from Device Manager, reset network stack. Switch to 5GHz band if available.', successCount: 71, totalUsed: 85, createdBy: 'admin-001', createdAt: now, updatedAt: now },
    ];
    await db.collection('kb_articles').insertMany(kbArticles);

    const tickets = [
      { ticketId: 'TK-001', title: 'VPN not connecting from home office', description: 'I am unable to connect to the company VPN from my home office. The client shows "Connection timed out" error after about 30 seconds of trying.', category: 'Network', priority: 'high', status: 'resolved', createdBy: 'emp-001', createdByName: 'Alice Brown', assignedTo: 'agent-001', assignedToName: 'John Smith', aiAnalysis: { category: 'Network', priority: 'high', confidence: 0.91, similarityScore: 0.88, llmConfidence: 0.90, successRate: 0.87, suggestedRootCause: 'VPN certificate expired or server address changed', suggestedSteps: ['Check VPN client version', 'Verify certificate expiry', 'Try alternative server'], reasoning: 'High similarity to past VPN issues' }, notes: [{ author: 'John Smith', authorRole: 'agent', content: 'Certificate expired. Renewed and tested successfully.', createdAt: new Date(now.getTime() - 3600000) }], resolution: 'VPN certificate was expired. Renewed certificate.', slaDeadline: new Date(now.getTime() - 86400000), createdAt: new Date(now.getTime() - 172800000), updatedAt: new Date(now.getTime() - 3600000) },
      { ticketId: 'TK-002', title: 'Outlook keeps crashing on startup', description: 'Microsoft Outlook crashes every time I try to open it. I get an error message and it closes immediately.', category: 'Email', priority: 'medium', status: 'in-progress', createdBy: 'emp-002', createdByName: 'Bob Wilson', assignedTo: 'agent-002', assignedToName: 'Sarah Chen', aiAnalysis: { category: 'Email', priority: 'medium', confidence: 0.82, similarityScore: 0.79, llmConfidence: 0.85, successRate: 0.86, suggestedRootCause: 'Corrupted Outlook profile or add-in conflict', suggestedSteps: ['Start Outlook in Safe Mode', 'Repair Outlook profile', 'Disable add-ins'], reasoning: 'Profile corruption is most common cause' }, notes: [], slaDeadline: new Date(now.getTime() + 86400000), createdAt: new Date(now.getTime() - 86400000), updatedAt: new Date(now.getTime() - 86400000) },
      { ticketId: 'TK-003', title: 'Suspicious login attempts on my account', description: 'I received multiple notifications about failed login attempts from unknown locations. Worried my account may be compromised.', category: 'Security', priority: 'critical', status: 'escalated', createdBy: 'emp-001', createdByName: 'Alice Brown', assignedTo: 'agent-001', assignedToName: 'John Smith', escalatedTo: 'admin-001', escalationReason: 'Potential security breach requires admin review', aiAnalysis: { category: 'Security', priority: 'critical', confidence: 0.45, similarityScore: 0.42, llmConfidence: 0.50, successRate: 0.84, suggestedRootCause: 'Potential brute force or credential compromise', suggestedSteps: ['Change password immediately', 'Enable MFA', 'Review access logs', 'Report to security team'], reasoning: 'Low confidence, requires expert review' }, notes: [{ author: 'John Smith', authorRole: 'agent', content: 'Escalating to admin - potential security breach.', createdAt: new Date(now.getTime() - 7200000) }], slaDeadline: new Date(now.getTime() + 7200000), createdAt: new Date(now.getTime() - 14400000), updatedAt: new Date(now.getTime() - 7200000) },
      { ticketId: 'TK-004', title: 'Cannot install required software', description: 'I need to install Python and VS Code for development but getting Access denied errors.', category: 'Software', priority: 'medium', status: 'open', createdBy: 'emp-002', createdByName: 'Bob Wilson', aiAnalysis: { category: 'Software', priority: 'medium', confidence: 0.78, similarityScore: 0.82, llmConfidence: 0.75, successRate: 0.84, suggestedRootCause: 'Standard user lacks admin privileges', suggestedSteps: ['Check Software Center', 'Submit software request', 'IT grants temporary elevation'], reasoning: 'Common permission issue' }, notes: [], slaDeadline: new Date(now.getTime() + 172800000), createdAt: new Date(now.getTime() - 3600000), updatedAt: new Date(now.getTime() - 3600000) },
    ];
    await db.collection('tickets').insertMany(tickets);

    const notifications = [
      { userId: 'agent-001', type: 'ticket_assigned', title: 'New Ticket Assigned', message: 'Ticket TK-003 (Security issue) assigned to you.', ticketId: 'TK-003', read: false, createdAt: new Date(now.getTime() - 14400000) },
      { userId: 'admin-001', type: 'ticket_escalated', title: 'Ticket Escalated', message: 'Ticket TK-003 escalated for admin review.', ticketId: 'TK-003', read: false, createdAt: new Date(now.getTime() - 7200000) },
      { userId: 'agent-002', type: 'sla_warning', title: 'SLA Warning', message: 'Ticket TK-002 approaching SLA deadline.', ticketId: 'TK-002', read: false, createdAt: new Date(now.getTime() - 3600000) },
    ];
    await db.collection('notifications').insertMany(notifications);

    return NextResponse.json({ message: 'Database seeded successfully', users: users.length, kbArticles: kbArticles.length, tickets: tickets.length });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Seed error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
