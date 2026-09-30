import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { IoTService } from './iot.service.js';
import { db } from '../../data/store.js';

const router = Router();

const heartbeatSchema = z.object({
  machine_id: z.string(),
  device_id: z.string(),
  status: z.enum(['ONLINE', 'OFFLINE', 'MAINTENANCE']).default('ONLINE'),
  stock: z.number().int().optional(),
  signal_strength: z.number().optional(),
  battery_level: z.number().optional(),
  voltage: z.number().optional(),
  temperature: z.number().optional(),
  motor_status: z.string().optional(),
  sensor_status: z.string().optional(),
  error_codes: z.string().optional(),
  timestamp: z.string().optional(),
});

const dispenseResultSchema = z.object({
  machine_id: z.string(),
  device_id: z.string(),
  dispense_id: z.string(),
  dispense_status: z.enum(['SUCCESS', 'FAILED', 'JAMMED', 'TIMEOUT']),
  quantity: z.number().int().default(1),
  failure_reason: z.string().optional(),
  device_confirmation: z.string().optional(),
  motor_index: z.number().int().optional(),
});

router.post('/heartbeat', (req: Request, res: Response) => {
  const result = heartbeatSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_HEARTBEAT_PAYLOAD', details: result.error.errors },
    });
  }

  const data = result.data;
  const outcome = IoTService.processHeartbeat({
    machineId: data.machine_id,
    deviceId: data.device_id,
    status: data.status,
    stock: data.stock,
    signalStrength: data.signal_strength,
    batteryLevel: data.battery_level,
    voltage: data.voltage,
    temperature: data.temperature,
    motorStatus: data.motor_status,
    sensorStatus: data.sensor_status,
    errorCodes: data.error_codes,
    ipAddress: req.ip,
    timestamp: data.timestamp,
  });

  if (!outcome.success) {
    return res.status(400).json({ success: false, error: outcome.error });
  }

  return res.json({ success: true, data: outcome });
});

router.post('/dispense-result', (req: Request, res: Response) => {
  const result = dispenseResultSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_DISPENSE_RESULT', details: result.error.errors },
    });
  }

  const data = result.data;
  const outcome = IoTService.processDispenseResult({
    machineId: data.machine_id,
    deviceId: data.device_id,
    dispenseId: data.dispense_id,
    status: data.dispense_status,
    quantity: data.quantity,
    failureReason: data.failure_reason,
    deviceConfirmation: data.device_confirmation,
    motorIndex: data.motor_index,
  });

  if (!outcome.success) {
    return res.status(400).json({ success: false, error: outcome.error });
  }

  return res.json({ success: true, data: outcome });
});

// Telemetry list for diagnostic UI tab
router.get('/machines/:id/heartbeats', (req: Request, res: Response) => {
  const machine = db.machines.find((m) => m.id === req.params.id || m.machineId === req.params.id);
  if (!machine) {
    return res.status(404).json({ success: false, error: 'MACHINE_NOT_FOUND' });
  }

  const hbs = db.heartbeats.filter((h) => h.machineId === machine.id).slice(0, 50);
  return res.json({ success: true, data: hbs });
});

export default router;
