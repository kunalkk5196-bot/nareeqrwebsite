import {
  initialUsers,
  initialMachines,
  initialProducts,
  initialQrIdentifiers,
  initialPayments,
  initialDispenses,
  initialStockTransactions,
  initialNotifications,
  initialAuditLogs,
  initialSystemSettings,
  UserEntity,
  MachineEntity,
  ProductEntity,
  QrIdentifierEntity,
  PaymentEntity,
  PaymentWebhookEntity,
  DispenseTransactionEntity,
  StockTransactionEntity,
  MachineHeartbeatEntity,
  MachineEventEntity,
  QrActivityEntity,
  NotificationEntity,
  AuditLogEntity,
  SystemSettingEntity,
} from './seed-data.js';
import { logger } from '../utils/logger.js';

class DataStore {
  public users: UserEntity[] = [...initialUsers];
  public machines: MachineEntity[] = [...initialMachines];
  public products: ProductEntity[] = [...initialProducts];
  public qrIdentifiers: QrIdentifierEntity[] = [...initialQrIdentifiers];
  public payments: PaymentEntity[] = [...initialPayments];
  public webhooks: PaymentWebhookEntity[] = [];
  public dispenses: DispenseTransactionEntity[] = [...initialDispenses];
  public stockTransactions: StockTransactionEntity[] = [...initialStockTransactions];
  public heartbeats: MachineHeartbeatEntity[] = [];
  public events: MachineEventEntity[] = [];
  public qrActivities: QrActivityEntity[] = [];
  public notifications: NotificationEntity[] = [...initialNotifications];
  public auditLogs: AuditLogEntity[] = [...initialAuditLogs];
  public settings: SystemSettingEntity[] = [...initialSystemSettings];

  constructor() {
    logger.info('In-Memory Relational DataStore initialized with 10 seed machines, 2 products, and baseline transactions');
  }

  // Helper to re-evaluate machine online/offline status based on lastSeen and timeout
  public updateMachineStatuses(timeoutSeconds: number = 300) {
    const now = Date.now();
    const thresholdMs = timeoutSeconds * 1000;

    for (const machine of this.machines) {
      if (machine.status === 'MAINTENANCE' || machine.status === 'DEACTIVATED') {
        continue;
      }
      const lastSeenMs = machine.lastSeen ? new Date(machine.lastSeen).getTime() : 0;
      const isOnline = now - lastSeenMs < thresholdMs;
      const prevStatus = machine.status;

      if (!isOnline && prevStatus === 'ONLINE') {
        machine.status = 'OFFLINE';
        machine.updatedAt = new Date().toISOString();
        // create notification
        this.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: 'MACHINE_OFFLINE',
          severity: 'CRITICAL',
          title: `Machine Offline: ${machine.machineId}`,
          message: `${machine.machineName} (${machine.location}) has gone offline. No heartbeat received for > ${Math.round(timeoutSeconds / 60)} minutes.`,
          machineId: machine.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
        this.events.unshift({
          id: `evt-${Date.now()}`,
          machineId: machine.id,
          eventType: 'OFFLINE_DETECTED',
          severity: 'WARNING',
          details: `Heartbeat missed for > ${timeoutSeconds}s`,
          isResolved: false,
          createdAt: new Date().toISOString(),
        });
      } else if (isOnline && prevStatus === 'OFFLINE') {
        machine.status = 'ONLINE';
        machine.updatedAt = new Date().toISOString();
        this.events.unshift({
          id: `evt-${Date.now()}`,
          machineId: machine.id,
          eventType: 'ONLINE_RESTORED',
          severity: 'INFO',
          details: 'Machine re-established connection and heartbeat',
          isResolved: true,
          resolvedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  public deleteMachinePermanently(machineId: string) {
    this.machines = this.machines.filter((m) => m.id !== machineId);
    this.qrIdentifiers = this.qrIdentifiers.filter((q) => q.machineId !== machineId);
    this.payments = this.payments.filter((p) => p.machineId !== machineId);
    this.dispenses = this.dispenses.filter((d) => d.machineId !== machineId);
    this.stockTransactions = this.stockTransactions.filter((s) => s.machineId !== machineId);
    this.heartbeats = this.heartbeats.filter((h) => h.machineId !== machineId);
    this.events = this.events.filter((e) => e.machineId !== machineId);
    this.qrActivities = this.qrActivities.filter((q) => q.machineId !== machineId);
    this.notifications = this.notifications.filter((n) => n.machineId !== machineId);
  }

  // Get single machine by ID with joined relations
  public getMachineWithDetails(idOrMachineId: string) {
    const machine = this.machines.find(
      (m) => m.id === idOrMachineId || m.machineId.toUpperCase() === idOrMachineId.toUpperCase()
    );
    if (!machine) return null;

    const qrCodes = this.qrIdentifiers.filter((q) => q.machineId === machine.id && q.isActive);
    const machinePayments = this.payments.filter((p) => p.machineId === machine.id);
    const machineDispenses = this.dispenses.filter((d) => d.machineId === machine.id);
    const machineStockHistory = this.stockTransactions
      .filter((s) => s.machineId === machine.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const machineHeartbeats = this.heartbeats
      .filter((h) => h.machineId === machine.id)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, 50);
    const machineEvents = this.events
      .filter((e) => e.machineId === machine.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const qrScans = this.qrActivities.filter((qa) => qa.machineId === machine.id);

    // Compute metrics
    const today = new Date().toISOString().split('T')[0];
    const todayDispenses = machineDispenses.filter(
      (d) => d.status === 'SUCCESS' && d.createdAt.startsWith(today)
    ).length;
    const todayRevenue = machinePayments
      .filter((p) => p.status === 'SUCCESS' && p.createdAt.startsWith(today))
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPadsDispensed = machineDispenses.filter((d) => d.status === 'SUCCESS').length;
    const totalRevenue = machinePayments
      .filter((p) => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + p.amount, 0);

    // PhonePe vs Razorpay stats
    const phonepePayments = machinePayments.filter((p) => p.gateway === 'PHONEPE');
    const razorpayPayments = machinePayments.filter((p) => p.gateway === 'RAZORPAY');

    const phonepeQr = qrCodes.find((q) => q.gateway === 'PHONEPE');
    const razorpayQr = qrCodes.find((q) => q.gateway === 'RAZORPAY');

    const phonepeScans = qrScans
      .filter((q) => q.gateway === 'PHONEPE')
      .reduce((acc, curr) => (curr.scanCount !== null && curr.scanCount !== undefined ? acc + curr.scanCount : acc), 0);
    const razorpayScans = qrScans
      .filter((q) => q.gateway === 'RAZORPAY')
      .reduce((acc, curr) => (curr.scanCount !== null && curr.scanCount !== undefined ? acc + curr.scanCount : acc), 0);

    return {
      machine,
      qrCodes,
      stats: {
        todayDispensed: todayDispenses,
        todayRevenue,
        totalPadsDispensed,
        totalRevenue,
        totalTransactions: machinePayments.length,
        phonepe: {
          identifier: phonepeQr ? phonepeQr.identifier : null,
          scans: qrScans.some((q) => q.gateway === 'PHONEPE' && q.scanCount !== null) ? phonepeScans : null,
          successfulTransactions: phonepePayments.filter((p) => p.status === 'SUCCESS').length,
          failedTransactions: phonepePayments.filter((p) => p.status === 'FAILED').length,
          revenue: phonepePayments.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0),
        },
        razorpay: {
          identifier: razorpayQr ? razorpayQr.identifier : null,
          scans: qrScans.some((q) => q.gateway === 'RAZORPAY' && q.scanCount !== null) ? razorpayScans : null,
          successfulTransactions: razorpayPayments.filter((p) => p.status === 'SUCCESS').length,
          failedTransactions: razorpayPayments.filter((p) => p.status === 'FAILED').length,
          revenue: razorpayPayments.filter((p) => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount, 0),
        },
      },
      latestHeartbeat: machineHeartbeats[0] || null,
      recentPayments: machinePayments.slice(-20).reverse(),
      recentDispenses: machineDispenses.slice(-20).reverse(),
      recentStockHistory: machineStockHistory.slice(0, 20),
      recentHeartbeats: machineHeartbeats.slice(0, 10),
      events: machineEvents.slice(0, 20),
    };
  }
}

export const db = new DataStore();
