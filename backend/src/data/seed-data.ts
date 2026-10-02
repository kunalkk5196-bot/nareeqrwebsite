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
  businessMobileNumber?: string;
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
  scanCount?: number | null;
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

const now = new Date().toISOString();

export const initialMachines: MachineEntity[] = [
  {
    id: 'mach-001',
    machineId: 'VM-PUN-0001',
    machineCode: 'SIU-VIMAN-01',
    machineName: 'Symbiosis Campus Machine 1',
    location: 'Symbiosis International University, Building B',
    address: 'Symbiosis Road, Viman Nagar',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5679,
    longitude: 73.9143,
    installationDate: '2026-01-10T00:00:00Z',
    iotDeviceId: 'IOT-PUN-0001',
    simNumber: '+91 98230 11001',
    simOperator: 'Airtel',
    businessMobileNumber: '+91 98230 11001',
    imei: '862948041092810',
    productCapacity: 100,
    currentStock: 78,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-002',
    machineId: 'VM-PUN-0002',
    machineCode: 'COEP-BAY-01',
    machineName: 'COEP Tech Park Bay A',
    location: 'COEP Technological University, Academic Complex',
    address: 'Wellesley Rd, Shivajinagar',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5293,
    longitude: 73.8565,
    installationDate: '2026-01-12T00:00:00Z',
    iotDeviceId: 'IOT-PUN-0002',
    simNumber: '+91 98230 11002',
    simOperator: 'Jio',
    businessMobileNumber: '+91 98230 11002',
    imei: '862948041092811',
    productCapacity: 100,
    currentStock: 45,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-12T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-003',
    machineId: 'VM-PUN-0003',
    machineCode: 'METRO-CIVIL-01',
    machineName: 'Pune Metro Station Civil Court',
    location: 'Civil Court Interchange Concourse L2',
    address: 'Civil Court Metro Station, Shivajinagar',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5312,
    longitude: 73.8553,
    installationDate: '2026-01-15T00:00:00Z',
    iotDeviceId: 'IOT-PUN-0003',
    simNumber: '+91 98230 11003',
    simOperator: 'Vi',
    businessMobileNumber: '+91 98230 11003',
    imei: '862948041092812',
    productCapacity: 100,
    currentStock: 12,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-004',
    machineId: 'VM-PUN-0004',
    machineCode: 'MAGAR-T4-01',
    machineName: 'Magarpatta Cybercity Tower 4',
    location: 'Cybercity Tower 4 Ground Lobby',
    address: 'Magarpatta City, Hadapsar',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5158,
    longitude: 73.9272,
    installationDate: '2026-01-18T00:00:00Z',
    iotDeviceId: 'IOT-PUN-0004',
    simNumber: '+91 98230 11004',
    simOperator: 'Airtel',
    businessMobileNumber: '+91 98230 11004',
    imei: '862948041092813',
    productCapacity: 100,
    currentStock: 88,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-18T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-005',
    machineId: 'VM-PUN-0005',
    machineCode: 'KEM-OPD-01',
    machineName: 'KEM Hospital Ground Floor',
    location: 'KEM Hospital OPD Waiting Hall',
    address: '489, Rasta Peth',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5196,
    longitude: 73.8683,
    installationDate: '2026-01-20T00:00:00Z',
    iotDeviceId: 'IOT-PUN-0005',
    simNumber: '+91 98230 11005',
    simOperator: 'BSNL',
    businessMobileNumber: '+91 98230 11005',
    imei: '862948041092814',
    productCapacity: 100,
    currentStock: 0,
    lowStockThreshold: 20,
    status: 'OFFLINE',
    lastSeen: '2026-01-25T10:00:00Z',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-006',
    machineId: 'VM-MUM-0001',
    machineCode: 'CSMT-SUB-01',
    machineName: 'CSMT Railway Station West',
    location: 'Suburban Concourse Platform 1',
    address: 'Chhatrapati Shivaji Maharaj Terminus, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 18.9402,
    longitude: 72.8358,
    installationDate: '2026-01-22T00:00:00Z',
    iotDeviceId: 'IOT-MUM-0001',
    simNumber: '+91 98220 22001',
    simOperator: 'Jio',
    businessMobileNumber: '+91 98220 22001',
    imei: '862948041092815',
    productCapacity: 100,
    currentStock: 92,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-22T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-007',
    machineId: 'VM-MUM-0002',
    machineCode: 'BKC-GBLOCK-01',
    machineName: 'Bandra-Kurla Complex Tech Hub',
    location: 'BKC Commercial Block G Tower 1',
    address: 'Bandra Kurla Complex, Bandra East',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0664,
    longitude: 72.8687,
    installationDate: '2026-01-24T00:00:00Z',
    iotDeviceId: 'IOT-MUM-0002',
    simNumber: '+91 98220 22002',
    simOperator: 'Airtel',
    businessMobileNumber: '+91 98220 22002',
    imei: '862948041092816',
    productCapacity: 100,
    currentStock: 64,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-24T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-008',
    machineId: 'VM-MUM-0003',
    machineCode: 'ANDHERI-METRO-01',
    machineName: 'Andheri Metro Concourse',
    location: 'Line 1 Andheri Station Platform 2',
    address: 'Andheri East Metro Station',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.1197,
    longitude: 72.8464,
    installationDate: '2026-01-26T00:00:00Z',
    iotDeviceId: 'IOT-MUM-0003',
    simNumber: '+91 98220 22003',
    simOperator: 'Jio',
    businessMobileNumber: '+91 98220 22003',
    imei: '862948041092817',
    productCapacity: 100,
    currentStock: 18,
    lowStockThreshold: 20,
    status: 'ONLINE',
    lastSeen: now,
    createdAt: '2026-01-26T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-009',
    machineId: 'VM-MUM-0004',
    machineCode: 'SNDT-CHURCH-01',
    machineName: 'SNDT Women University',
    location: 'SNDT Campus Main Building Wing C',
    address: '1, Nathibai Thackersey Road, Churchgate',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 18.9322,
    longitude: 72.8264,
    installationDate: '2026-01-28T00:00:00Z',
    iotDeviceId: 'IOT-MUM-0004',
    simNumber: '+91 98220 22004',
    simOperator: 'Vi',
    businessMobileNumber: '+91 98220 22004',
    imei: '862948041092818',
    productCapacity: 100,
    currentStock: 50,
    lowStockThreshold: 20,
    status: 'MAINTENANCE',
    lastSeen: now,
    createdAt: '2026-01-28T00:00:00Z',
    updatedAt: now,
  },
  {
    id: 'mach-010',
    machineId: 'VM-MUM-0005',
    machineCode: 'DADAR-TERM-01',
    machineName: 'Dadar Central Terminal',
    location: 'Dadar Station Bridge 3 Footover',
    address: 'Dadar Central Railway Station',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0178,
    longitude: 72.8478,
    installationDate: '2026-01-30T00:00:00Z',
    iotDeviceId: 'IOT-MUM-0005',
    simNumber: '+91 98220 22005',
    simOperator: 'Airtel',
    businessMobileNumber: '+91 98220 22005',
    imei: '862948041092819',
    productCapacity: 100,
    currentStock: 31,
    lowStockThreshold: 20,
    status: 'OFFLINE',
    lastSeen: '2026-01-29T15:00:00Z',
    createdAt: '2026-01-30T00:00:00Z',
    updatedAt: now,
  },
];

export const initialQrIdentifiers: QrIdentifierEntity[] = [
  { id: 'qr-001', machineId: 'mach-001', gateway: 'PHONEPE', identifier: 'PH-VM-PUN-0001', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { id: 'qr-002', machineId: 'mach-001', gateway: 'RAZORPAY', identifier: 'RZ-VM-PUN-0001', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
  { id: 'qr-003', machineId: 'mach-002', gateway: 'PHONEPE', identifier: 'PH-VM-PUN-0002', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z' },
  { id: 'qr-004', machineId: 'mach-002', gateway: 'RAZORPAY', identifier: 'RZ-VM-PUN-0002', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-12T00:00:00Z', updatedAt: '2026-01-12T00:00:00Z' },
  { id: 'qr-005', machineId: 'mach-003', gateway: 'PHONEPE', identifier: 'PH-VM-PUN-0003', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
  { id: 'qr-006', machineId: 'mach-003', gateway: 'RAZORPAY', identifier: 'RZ-VM-PUN-0003', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z' },
  { id: 'qr-007', machineId: 'mach-004', gateway: 'PHONEPE', identifier: 'PH-VM-PUN-0004', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-18T00:00:00Z', updatedAt: '2026-01-18T00:00:00Z' },
  { id: 'qr-008', machineId: 'mach-004', gateway: 'RAZORPAY', identifier: 'RZ-VM-PUN-0004', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-18T00:00:00Z', updatedAt: '2026-01-18T00:00:00Z' },
  { id: 'qr-009', machineId: 'mach-005', gateway: 'PHONEPE', identifier: 'PH-VM-PUN-0005', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z' },
  { id: 'qr-010', machineId: 'mach-005', gateway: 'RAZORPAY', identifier: 'RZ-VM-PUN-0005', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-20T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z' },
  { id: 'qr-011', machineId: 'mach-006', gateway: 'PHONEPE', identifier: 'PH-VM-MUM-0001', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-22T00:00:00Z', updatedAt: '2026-01-22T00:00:00Z' },
  { id: 'qr-012', machineId: 'mach-006', gateway: 'RAZORPAY', identifier: 'RZ-VM-MUM-0001', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-22T00:00:00Z', updatedAt: '2026-01-22T00:00:00Z' },
  { id: 'qr-013', machineId: 'mach-007', gateway: 'PHONEPE', identifier: 'PH-VM-MUM-0002', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-24T00:00:00Z', updatedAt: '2026-01-24T00:00:00Z' },
  { id: 'qr-014', machineId: 'mach-007', gateway: 'RAZORPAY', identifier: 'RZ-VM-MUM-0002', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-24T00:00:00Z', updatedAt: '2026-01-24T00:00:00Z' },
  { id: 'qr-015', machineId: 'mach-008', gateway: 'PHONEPE', identifier: 'PH-VM-MUM-0003', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-26T00:00:00Z', updatedAt: '2026-01-26T00:00:00Z' },
  { id: 'qr-016', machineId: 'mach-008', gateway: 'RAZORPAY', identifier: 'RZ-VM-MUM-0003', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-26T00:00:00Z', updatedAt: '2026-01-26T00:00:00Z' },
  { id: 'qr-017', machineId: 'mach-009', gateway: 'PHONEPE', identifier: 'PH-VM-MUM-0004', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-28T00:00:00Z', updatedAt: '2026-01-28T00:00:00Z' },
  { id: 'qr-018', machineId: 'mach-009', gateway: 'RAZORPAY', identifier: 'RZ-VM-MUM-0004', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-28T00:00:00Z', updatedAt: '2026-01-28T00:00:00Z' },
  { id: 'qr-019', machineId: 'mach-010', gateway: 'PHONEPE', identifier: 'PH-VM-MUM-0005', merchantId: 'MERCHANT_NAREE_001', isActive: true, createdAt: '2026-01-30T00:00:00Z', updatedAt: '2026-01-30T00:00:00Z' },
  { id: 'qr-020', machineId: 'mach-010', gateway: 'RAZORPAY', identifier: 'RZ-VM-MUM-0005', merchantId: 'rzp_test_placeholder_key_id', isActive: true, createdAt: '2026-01-30T00:00:00Z', updatedAt: '2026-01-30T00:00:00Z' },
];

export const initialPayments: PaymentEntity[] = [
  { id: 'pay-001', transactionId: 'TXN-20260201-0001', machineId: 'mach-001', gateway: 'PHONEPE', amount: 10.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'T26020110001', productId: 'prod-001', quantity: 1, createdAt: '2026-02-01T10:15:00Z', updatedAt: '2026-02-01T10:15:05Z' },
  { id: 'pay-002', transactionId: 'TXN-20260201-0002', machineId: 'mach-002', gateway: 'RAZORPAY', amount: 15.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'pay_rzp_260201_0002', productId: 'prod-002', quantity: 1, createdAt: '2026-02-01T11:20:00Z', updatedAt: '2026-02-01T11:20:04Z' },
  { id: 'pay-003', transactionId: 'TXN-20260201-0003', machineId: 'mach-003', gateway: 'PHONEPE', amount: 10.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'T26020110003', productId: 'prod-001', quantity: 1, createdAt: '2026-02-01T12:05:00Z', updatedAt: '2026-02-01T12:05:03Z' },
  { id: 'pay-004', transactionId: 'TXN-20260201-0004', machineId: 'mach-004', gateway: 'RAZORPAY', amount: 10.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'pay_rzp_260201_0004', productId: 'prod-001', quantity: 1, createdAt: '2026-02-01T13:30:00Z', updatedAt: '2026-02-01T13:30:05Z' },
  { id: 'pay-005', transactionId: 'TXN-20260201-0005', machineId: 'mach-006', gateway: 'PHONEPE', amount: 15.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'T26020110005', productId: 'prod-002', quantity: 1, createdAt: '2026-02-01T14:45:00Z', updatedAt: '2026-02-01T14:45:04Z' },
  { id: 'pay-006', transactionId: 'TXN-20260201-0006', machineId: 'mach-001', gateway: 'PHONEPE', amount: 10.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'T26020110006', productId: 'prod-001', quantity: 1, createdAt: '2026-02-01T15:10:00Z', updatedAt: '2026-02-01T15:10:04Z' },
  { id: 'pay-007', transactionId: 'TXN-20260201-0007', machineId: 'mach-002', gateway: 'RAZORPAY', amount: 10.0, currency: 'INR', status: 'FAILED', failureReason: 'USER_CANCELLED_OR_INSUFFICIENT_FUNDS', providerTxnId: 'pay_rzp_260201_0007', productId: 'prod-001', quantity: 1, createdAt: '2026-02-01T16:00:00Z', updatedAt: '2026-02-01T16:00:10Z' },
  { id: 'pay-008', transactionId: 'TXN-20260201-0008', machineId: 'mach-007', gateway: 'PHONEPE', amount: 10.0, currency: 'INR', status: 'SUCCESS', providerTxnId: 'T26020110008', productId: 'prod-001', quantity: 1, createdAt: '2026-02-01T17:25:00Z', updatedAt: '2026-02-01T17:25:03Z' },
];

export const initialDispenses: DispenseTransactionEntity[] = [
  { id: 'disp-001', dispenseId: 'DSP-20260201-0001', machineId: 'mach-001', productId: 'prod-001', quantity: 1, paymentId: 'pay-001', status: 'SUCCESS', motorIndex: 1, dispensedAt: '2026-02-01T10:15:08Z', createdAt: '2026-02-01T10:15:05Z' },
  { id: 'disp-002', dispenseId: 'DSP-20260201-0002', machineId: 'mach-002', productId: 'prod-002', quantity: 1, paymentId: 'pay-002', status: 'SUCCESS', motorIndex: 2, dispensedAt: '2026-02-01T11:20:07Z', createdAt: '2026-02-01T11:20:04Z' },
  { id: 'disp-003', dispenseId: 'DSP-20260201-0003', machineId: 'mach-003', productId: 'prod-001', quantity: 1, paymentId: 'pay-003', status: 'SUCCESS', motorIndex: 1, dispensedAt: '2026-02-01T12:05:06Z', createdAt: '2026-02-01T12:05:03Z' },
  { id: 'disp-004', dispenseId: 'DSP-20260201-0004', machineId: 'mach-004', productId: 'prod-001', quantity: 1, paymentId: 'pay-004', status: 'SUCCESS', motorIndex: 1, dispensedAt: '2026-02-01T13:30:08Z', createdAt: '2026-02-01T13:30:05Z' },
  { id: 'disp-005', dispenseId: 'DSP-20260201-0005', machineId: 'mach-006', productId: 'prod-002', quantity: 1, paymentId: 'pay-005', status: 'SUCCESS', motorIndex: 2, dispensedAt: '2026-02-01T14:45:07Z', createdAt: '2026-02-01T14:45:04Z' },
  { id: 'disp-006', dispenseId: 'DSP-20260201-0006', machineId: 'mach-001', productId: 'prod-001', quantity: 1, paymentId: 'pay-006', status: 'JAMMED', failureReason: 'MOTOR_MECHANISM_JAMMED', deviceConfirmation: 'ERR_SERVO_STALL', motorIndex: 1, createdAt: '2026-02-01T15:10:05Z' },
  { id: 'disp-007', dispenseId: 'DSP-20260201-0007', machineId: 'mach-002', productId: 'prod-001', quantity: 1, status: 'SUCCESS', motorIndex: 1, dispensedAt: '2026-02-01T16:20:00Z', createdAt: '2026-02-01T16:19:55Z' },
  { id: 'disp-008', dispenseId: 'DSP-20260201-0008', machineId: 'mach-007', productId: 'prod-001', quantity: 1, paymentId: 'pay-008', status: 'SUCCESS', motorIndex: 1, dispensedAt: '2026-02-01T17:25:06Z', createdAt: '2026-02-01T17:25:03Z' },
];

export const initialStockTransactions: StockTransactionEntity[] = [
  { id: 'stk-001', machineId: 'mach-001', productId: 'prod-001', eventType: 'STOCK_INITIALIZED', previousStock: 0, changeQuantity: 100, newStock: 100, reason: 'Initial machine stocking', performedBy: 'usr-003', createdAt: '2026-01-10T00:00:00Z' },
  { id: 'stk-002', machineId: 'mach-002', productId: 'prod-001', eventType: 'STOCK_INITIALIZED', previousStock: 0, changeQuantity: 100, newStock: 100, reason: 'Initial machine stocking', performedBy: 'usr-003', createdAt: '2026-01-12T00:00:00Z' },
  { id: 'stk-003', machineId: 'mach-003', productId: 'prod-001', eventType: 'STOCK_INITIALIZED', previousStock: 0, changeQuantity: 100, newStock: 100, reason: 'Initial machine stocking', performedBy: 'usr-003', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'stk-004', machineId: 'mach-001', productId: 'prod-001', eventType: 'PAD_DISPENSED', previousStock: 100, changeQuantity: -1, newStock: 99, dispenseId: 'disp-001', createdAt: '2026-02-01T10:15:08Z' },
  { id: 'stk-005', machineId: 'mach-002', productId: 'prod-002', eventType: 'PAD_DISPENSED', previousStock: 100, changeQuantity: -1, newStock: 99, dispenseId: 'disp-002', createdAt: '2026-02-01T11:20:07Z' },
  { id: 'stk-006', machineId: 'mach-003', productId: 'prod-001', eventType: 'STOCK_MISMATCH', previousStock: 20, changeQuantity: -8, newStock: 12, reason: 'Physical inventory audit revealed 8 pads missing or untracked test vends', performedBy: 'usr-003', createdAt: '2026-02-01T12:00:00Z' },
  { id: 'stk-007', machineId: 'mach-005', productId: 'prod-001', eventType: 'OUT_OF_STOCK', previousStock: 2, changeQuantity: -2, newStock: 0, reason: 'Machine completely depleted', createdAt: '2026-01-25T08:00:00Z' },
];

export const initialNotifications: NotificationEntity[] = [
  {
    id: 'notif-001',
    type: 'LOW_STOCK',
    severity: 'WARNING',
    title: 'Low Stock Alert: VM-PUN-0003',
    message: 'Pune Metro Station Civil Court stock has dropped to 12 pads (threshold: 20). Refill needed soon.',
    machineId: 'mach-003',
    isRead: false,
    createdAt: '2026-02-01T12:05:00Z',
  },
  {
    id: 'notif-002',
    type: 'OUT_OF_STOCK',
    severity: 'CRITICAL',
    title: 'Out of Stock: VM-PUN-0005',
    message: 'KEM Hospital Ground Floor is completely out of stock (0 pads remaining). Immediate refill required.',
    machineId: 'mach-005',
    isRead: false,
    createdAt: '2026-01-25T08:00:00Z',
  },
  {
    id: 'notif-003',
    type: 'MACHINE_OFFLINE',
    severity: 'CRITICAL',
    title: 'Machine Offline: VM-PUN-0005',
    message: 'KEM Hospital Ground Floor has been offline for over 24 hours. Check power supply and SIM card.',
    machineId: 'mach-005',
    isRead: false,
    createdAt: '2026-01-25T10:00:00Z',
  },
  {
    id: 'notif-004',
    type: 'DISPENSE_FAILURE',
    severity: 'CRITICAL',
    title: 'Dispense Jam: VM-PUN-0001',
    message: 'Payment TXN-20260201-0006 succeeded but servo motor jammed. Customer requires refund or remote release.',
    machineId: 'mach-001',
    isRead: false,
    createdAt: '2026-02-01T15:10:05Z',
  },
];

export const initialAuditLogs: AuditLogEntity[] = [
  {
    id: 'aud-001',
    userId: 'usr-001',
    action: 'SYSTEM_BOOTSTRAP',
    entity: 'System',
    entityId: 'SYSTEM',
    ipAddress: '127.0.0.1',
    metadata: JSON.stringify({ version: '1.0.0', environment: 'production-ready', machinesCount: 10 }),
    createdAt: new Date().toISOString(),
  },
];

export const initialSystemSettings: SystemSettingEntity[] = [
  { id: 'set-001', key: 'OFFLINE_TIMEOUT_SECONDS', value: '300', description: 'Seconds without heartbeat before marking offline', updatedAt: new Date().toISOString() },
  { id: 'set-002', key: 'LOW_STOCK_THRESHOLD_DEFAULT', value: '20', description: 'Default low stock threshold percentage/quantity', updatedAt: new Date().toISOString() },
  { id: 'set-003', key: 'PAYMENT_PROVIDER_MODE', value: 'mock', description: 'Payment mode: mock or production', updatedAt: new Date().toISOString() },
  { id: 'set-004', key: 'AUTO_REFUND_ON_DISPENSE_FAIL', value: 'false', description: 'Whether to auto-trigger refund API on dispense failure', updatedAt: new Date().toISOString() },
];
