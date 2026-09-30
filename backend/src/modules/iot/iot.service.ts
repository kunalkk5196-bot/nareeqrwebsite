import { db } from '../../data/store.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';

export interface HeartbeatPayload {
  machineId: string;
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  stock?: number;
  signalStrength?: number;
  batteryLevel?: number;
  voltage?: number;
  temperature?: number;
  motorStatus?: string;
  sensorStatus?: string;
  errorCodes?: string;
  ipAddress?: string;
  timestamp?: string;
}

export interface DispenseResultPayload {
  machineId: string;
  deviceId: string;
  dispenseId: string;
  status: 'SUCCESS' | 'FAILED' | 'JAMMED' | 'TIMEOUT';
  quantity: number;
  failureReason?: string;
  deviceConfirmation?: string;
  motorIndex?: number;
  timestamp?: string;
}

export class IoTService {
  /**
   * Process machine heartbeat
   */
  static processHeartbeat(payload: HeartbeatPayload) {
    const machine = db.machines.find(
      (m) =>
        m.machineId.toUpperCase() === payload.machineId.toUpperCase() ||
        m.id === payload.machineId
    );

    if (!machine) {
      logger.warn({ machineId: payload.machineId }, 'Heartbeat received for unknown machine');
      return { success: false, error: 'MACHINE_NOT_FOUND' };
    }

    // Authenticate device ID
    if (machine.iotDeviceId !== payload.deviceId) {
      logger.error(
        { registeredDeviceId: machine.iotDeviceId, receivedDeviceId: payload.deviceId },
        'IoT Device authentication failed'
      );
      return { success: false, error: 'INVALID_DEVICE_CREDENTIALS' };
    }

    const nowIso = new Date().toISOString();
    const prevStatus = machine.status;
    machine.status = 'ONLINE';
    machine.lastSeen = nowIso;
    machine.updatedAt = nowIso;

    // Check for stock mismatch (Section 47)
    if (payload.stock !== undefined && payload.stock !== null) {
      if (payload.stock !== machine.currentStock) {
        const diff = payload.stock - machine.currentStock;
        logger.warn(
          { machineId: machine.machineId, expected: machine.currentStock, reported: payload.stock, diff },
          'Stock mismatch detected between system expected and IoT reported stock'
        );

        db.stockTransactions.unshift({
          id: `stk-${Date.now()}`,
          machineId: machine.id,
          productId: 'prod-001',
          eventType: 'STOCK_MISMATCH',
          previousStock: machine.currentStock,
          changeQuantity: diff,
          newStock: payload.stock,
          reason: `IoT Controller reported physical count ${payload.stock}, expected ${machine.currentStock} (diff: ${diff})`,
          performedBy: 'IOT_HEARTBEAT',
          createdAt: nowIso,
        });

        db.events.unshift({
          id: `evt-${Date.now()}`,
          machineId: machine.id,
          eventType: 'STOCK_MISMATCH',
          severity: 'WARNING',
          details: `Expected: ${machine.currentStock}, Reported: ${payload.stock}`,
          isResolved: false,
          createdAt: nowIso,
        });

        // Update current stock to physical truth
        machine.currentStock = payload.stock;
      }
    }

    // Check low stock / out of stock
    if (machine.currentStock === 0) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'OUT_OF_STOCK',
        severity: 'CRITICAL',
        title: `Machine Out of Stock: ${machine.machineId}`,
        message: `${machine.machineName} has 0 napkins left. Refill immediately.`,
        machineId: machine.id,
        isRead: false,
        createdAt: nowIso,
      });
    } else if (machine.currentStock <= machine.lowStockThreshold) {
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'LOW_STOCK',
        severity: 'WARNING',
        title: `Low Stock: ${machine.machineId}`,
        message: `${machine.machineName} has only ${machine.currentStock} napkins remaining (threshold: ${machine.lowStockThreshold}).`,
        machineId: machine.id,
        isRead: false,
        createdAt: nowIso,
      });
    }

    // Save heartbeat record
    const hb = {
      id: `hb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      machineId: machine.id,
      deviceId: payload.deviceId,
      status: 'ONLINE' as const,
      reportedStock: payload.stock ?? machine.currentStock,
      signalStrength: payload.signalStrength ?? 85,
      batteryLevel: payload.batteryLevel,
      voltage: payload.voltage ?? 12.1,
      temperature: payload.temperature ?? 28.5,
      motorStatus: payload.motorStatus ?? 'OK',
      sensorStatus: payload.sensorStatus ?? 'OK',
      errorCodes: payload.errorCodes,
      ipAddress: payload.ipAddress,
      receivedAt: nowIso,
    };
    db.heartbeats.unshift(hb);

    // Keep heartbeat table bounded in memory
    if (db.heartbeats.length > 500) {
      db.heartbeats.length = 500;
    }

    return { success: true, machineId: machine.machineId, status: 'ONLINE', timestamp: nowIso };
  }

  /**
   * Process physical dispense confirmation/result from IoT hardware
   */
  static processDispenseResult(payload: DispenseResultPayload) {
    const machine = db.machines.find(
      (m) =>
        m.machineId.toUpperCase() === payload.machineId.toUpperCase() ||
        m.id === payload.machineId
    );

    if (!machine) {
      return { success: false, error: 'MACHINE_NOT_FOUND' };
    }

    const dispense = db.dispenses.find(
      (d) => d.dispenseId === payload.dispenseId || d.id === payload.dispenseId
    );

    if (!dispense) {
      logger.error({ dispenseId: payload.dispenseId }, 'Dispense transaction not found for reported result');
      return { success: false, error: 'DISPENSE_NOT_FOUND' };
    }

    const nowIso = new Date().toISOString();
    dispense.status = payload.status;
    dispense.failureReason = payload.failureReason;
    dispense.deviceConfirmation = payload.deviceConfirmation;

    if (payload.status === 'SUCCESS') {
      dispense.dispensedAt = nowIso;
      // Deduct stock
      const prev = machine.currentStock;
      machine.currentStock = Math.max(0, machine.currentStock - (payload.quantity || 1));
      machine.updatedAt = nowIso;

      db.stockTransactions.unshift({
        id: `stk-${Date.now()}`,
        machineId: machine.id,
        productId: dispense.productId,
        eventType: 'PAD_DISPENSED',
        previousStock: prev,
        changeQuantity: -(payload.quantity || 1),
        newStock: machine.currentStock,
        reason: `Successful dispense: ${dispense.dispenseId}`,
        dispenseId: dispense.id,
        createdAt: nowIso,
      });

      logger.info({ machineId: machine.machineId, dispenseId: dispense.dispenseId }, 'Physical dispense verified SUCCESS');
    } else {
      // Dispense failed!
      logger.error(
        { machineId: machine.machineId, dispenseId: dispense.dispenseId, reason: payload.failureReason },
        'Physical dispense reported FAILED / JAMMED'
      );

      // Create high-priority critical notification
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'DISPENSE_FAILURE',
        severity: 'CRITICAL',
        title: `Dispense Failure: ${machine.machineId}`,
        message: `Dispense ${dispense.dispenseId} failed on ${machine.machineName}. Reason: ${payload.failureReason || 'Motor failure / Sensor timeout'}. Payment ID: ${dispense.paymentId || 'N/A'}. Action needed.`,
        machineId: machine.id,
        metadata: JSON.stringify({ dispenseId: dispense.dispenseId, paymentId: dispense.paymentId, error: payload.failureReason }),
        isRead: false,
        createdAt: nowIso,
      });

      db.events.unshift({
        id: `evt-${Date.now()}`,
        machineId: machine.id,
        eventType: payload.status === 'JAMMED' ? 'MOTOR_JAM' : 'DISPENSE_FAILED',
        severity: 'CRITICAL',
        details: payload.failureReason || 'Physical motor/sensor failed to dispense',
        isResolved: false,
        createdAt: nowIso,
      });
    }

    return { success: true, dispenseId: dispense.dispenseId, status: dispense.status };
  }

  /**
   * Trigger a dispense command to the machine (via MQTT or simulated immediate response)
   */
  static triggerDispense(machineId: string, paymentId: string, quantity: number = 1, productId: string = 'prod-001') {
    const machine = db.machines.find((m) => m.id === machineId || m.machineId === machineId);
    if (!machine) {
      throw new Error(`Machine ${machineId} not found`);
    }

    const dispenseId = `DISP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const dispenseTxn = {
      id: `disp-${Date.now()}`,
      dispenseId,
      machineId: machine.id,
      productId,
      quantity,
      paymentId,
      status: 'PENDING' as const,
      motorIndex: 1,
      createdAt: nowIso,
    };

    db.dispenses.unshift(dispenseTxn);

    logger.info(
      { machineId: machine.machineId, dispenseId, paymentId },
      'Dispense command issued. Waiting for IoT controller confirmation...'
    );

    // If running in Mock/Simulated IoT Mode, simulate motor execution automatically
    if (config.iot.mode === 'mock') {
      setTimeout(() => {
        // If out of stock, fail
        if (machine.currentStock <= 0) {
          this.processDispenseResult({
            machineId: machine.machineId,
            deviceId: machine.iotDeviceId,
            dispenseId: dispenseTxn.dispenseId,
            status: 'FAILED',
            quantity,
            failureReason: 'OUT_OF_STOCK_SENSOR_DETECTED',
            deviceConfirmation: 'MOTOR_ABORT_EMPTY_TRAY',
          });
        } else {
          this.processDispenseResult({
            machineId: machine.machineId,
            deviceId: machine.iotDeviceId,
            dispenseId: dispenseTxn.dispenseId,
            status: 'SUCCESS',
            quantity,
            deviceConfirmation: 'MOTOR_CYCLE_COMPLETE_SENSOR_PASS',
          });
        }
      }, 1000);
    }

    return dispenseTxn;
  }
}
