import bcrypt from 'bcryptjs';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineEntity {
  id: string;
  machineId: string;
  machineCode?: string;
  machineName: string;
  location: string;
  address?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  installationDate: string;
  iotDeviceId: string;
  simNumber?: string;
  simOperator?: string;
  imei?: string;
  productCapacity: number;
  currentStock: number;
  lowStockThreshold: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'DEACTIVATED';
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductEntity {
  id: string;
  productId: string;
  name: string;
  description?: string;
  price: number;
  sku: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QrIdentifierEntity {
  id: string;
  machineId: string;
  gateway: 'PHONEPE' | 'RAZORPAY';
  identifier: string;
  merchantId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEntity {
  id: string;
  transactionId: string;
  machineId: string;
  gateway: 'PHONEPE' | 'RAZORPAY';
  amount: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'UNKNOWN';
  providerTxnId?: string;
  productId?: string;
  quantity: number;
  failureReason?: string;
  referenceId?: string;
  webhookStatus?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWebhookEntity {
  id: string;
  paymentId?: string;
  gateway: 'PHONEPE' | 'RAZORPAY';
  eventType: string;
  payload: string;
  signature?: string;
  isValid: boolean;
  idempotencyKey: string;
  processedAt?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface DispenseTransactionEntity {
  id: string;
  dispenseId: string;
  machineId: string;
  productId: string;
  quantity: number;
  paymentId?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'JAMMED' | 'TIMEOUT';
  failureReason?: string;
  deviceConfirmation?: string;
  motorIndex: number;
  dispensedAt?: string;
  createdAt: string;
}

export interface StockTransactionEntity {
  id: string;
  machineId: string;
  productId: string;
  eventType: 'STOCK_INITIALIZED' | 'STOCK_REFILLED' | 'PAD_DISPENSED' | 'MANUAL_ADJUSTMENT' | 'STOCK_CORRECTION' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'STOCK_MISMATCH';
  previousStock: number;
  changeQuantity: number;
  newStock: number;
  reason?: string;
  performedBy?: string;
  dispenseId?: string;
  createdAt: string;
}

export interface MachineHeartbeatEntity {
  id: string;
  machineId: string;
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  reportedStock?: number;
  signalStrength?: number;
  batteryLevel?: number;
  voltage?: number;
  temperature?: number;
  motorStatus?: string;
  sensorStatus?: string;
  errorCodes?: string;
  ipAddress?: string;
  receivedAt: string;
}

export interface MachineEventEntity {
  id: string;
  machineId: string;
  eventType: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  details?: string;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface QrActivityEntity {
  id: string;
  machineId: string;
  gateway: 'PHONEPE' | 'RAZORPAY';
  scanCount?: number | null; // Null when provider doesn't support raw scan telemetry
  scanTimestamp?: string;
  source?: string;
  rawEventData?: string;
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'MACHINE_OFFLINE' | 'PAYMENT_FAILURE_SPIKE' | 'DISPENSE_FAILURE' | 'MACHINE_ERROR' | 'UNUSUAL_ACTIVITY';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  machineId?: string;
  metadata?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuditLogEntity {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValues?: string;
  newValues?: string;
  metadata?: string;
  createdAt: string;
}

export interface SystemSettingEntity {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

// Generate hashed password for "Password@123"
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Password@123', 10);

export const initialUsers: UserEntity[] = [
  {
    id: 'usr-001',
    email: 'superadmin@naree.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: 'Chief Admin (Super)',
    phone: '+91 98765 43210',
    role: 'SUPER_ADMIN',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-002',
    email: 'admin@naree.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: 'Regional Operations Admin',
    phone: '+91 98765 43211',
    role: 'ADMIN',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-003',
    email: 'operator@naree.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: 'Field Refill Operator',
    phone: '+91 98765 43212',
    role: 'OPERATOR',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'usr-004',
    email: 'viewer@naree.com',
    passwordHash: DEFAULT_PASSWORD_HASH,
    name: 'Analytics Viewer',
    phone: '+91 98765 43213',
    role: 'VIEWER',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const initialProducts: ProductEntity[] = [
  {
    id: 'prod-001',
    productId: 'PAD-REG-001',
    name: 'Regular Sanitary Napkin (Day Comfort)',
    description: 'Ultra-thin, high absorption 240mm with wings',
    price: 10.0,
    sku: 'SKU-PAD-REG-240',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'prod-002',
    productId: 'PAD-ORG-002',
    name: 'Organic Cotton Extra Long (Night Comfort)',
    description: '100% certified organic cotton, 280mm heavy flow protection',
    price: 15.0,
    sku: 'SKU-PAD-ORG-280',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const initialMachines: MachineEntity[] = [];

export const initialQrIdentifiers: QrIdentifierEntity[] = [];

export const initialPayments: PaymentEntity[] = [];

export const initialDispenses: DispenseTransactionEntity[] = [];

export const initialStockTransactions: StockTransactionEntity[] = [];

export const initialNotifications: NotificationEntity[] = [];

export const initialAuditLogs: AuditLogEntity[] = [
  {
    id: 'aud-001',
    userId: 'usr-001',
    action: 'SYSTEM_BOOTSTRAP',
    entity: 'System',
    entityId: 'SYSTEM',
    ipAddress: '127.0.0.1',
    metadata: JSON.stringify({ version: '1.0.0', environment: 'production-ready' }),
    createdAt: new Date().toISOString(),
  },
];

export const initialSystemSettings: SystemSettingEntity[] = [
  { id: 'set-001', key: 'OFFLINE_TIMEOUT_SECONDS', value: '300', description: 'Seconds without heartbeat before marking offline', updatedAt: new Date().toISOString() },
  { id: 'set-002', key: 'LOW_STOCK_THRESHOLD_DEFAULT', value: '20', description: 'Default low stock threshold percentage/quantity', updatedAt: new Date().toISOString() },
  { id: 'set-003', key: 'PAYMENT_PROVIDER_MODE', value: 'mock', description: 'Payment mode: mock or production', updatedAt: new Date().toISOString() },
  { id: 'set-004', key: 'AUTO_REFUND_ON_DISPENSE_FAIL', value: 'false', description: 'Whether to auto-trigger refund API on dispense failure', updatedAt: new Date().toISOString() },
];

