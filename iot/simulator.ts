/**
 * Standalone IoT Simulator for Sanitary Napkin Vending Machines
 * Simulates 10 4G-connected machines reporting heartbeats, battery voltage, signal strength,
 * and responding to physical motor dispense signals.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';

const MACHINES = [
  { machineId: 'VM-PUN-0001', deviceId: 'IOT-ESP32-PUN-0001', stock: 73 },
  { machineId: 'VM-PUN-0002', deviceId: 'IOT-ESP32-PUN-0002', stock: 85 },
  { machineId: 'VM-MUM-0001', deviceId: 'IOT-SIM7600-MUM-0001', stock: 92 },
  { machineId: 'VM-MUM-0002', deviceId: 'IOT-SIM7600-MUM-0002', stock: 14 },
  { machineId: 'VM-DEL-0001', deviceId: 'IOT-SIM7600-DEL-0001', stock: 110 },
  { machineId: 'VM-BLR-0001', deviceId: 'IOT-SIM7600-BLR-0001', stock: 68 },
  { machineId: 'VM-HYD-0001', deviceId: 'IOT-SIM7600-HYD-0001', stock: 54 },
  { machineId: 'VM-CHE-0001', deviceId: 'IOT-SIM7600-CHE-0001', stock: 80 },
];

async function sendHeartbeat(machine: typeof MACHINES[0]) {
  try {
    const payload = {
      machine_id: machine.machineId,
      device_id: machine.deviceId,
      status: 'ONLINE',
      stock: machine.stock,
      signal_strength: Math.floor(70 + Math.random() * 25), // 70-95%
      voltage: parseFloat((11.8 + Math.random() * 0.8).toFixed(2)),
      temperature: parseFloat((25 + Math.random() * 5).toFixed(1)),
      motor_status: 'OK',
      sensor_status: 'OK',
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`${API_BASE}/iot/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`[IoT Telemetry] Heartbeat sent for ${machine.machineId} (Stock: ${machine.stock}, RSSI: ${payload.signal_strength}%)`);
    } else {
      const err = await res.json();
      console.error(`[IoT Error] Failed heartbeat for ${machine.machineId}:`, err);
    }
  } catch (err: any) {
    console.error(`[IoT Connection Error] ${err.message}`);
  }
}

async function runSimulator() {
  console.log('=======================================================');
  console.log('NAREE IoT VENDING MACHINE TELEMETRY SIMULATOR RUNNING');
  console.log(`Target API Base: ${API_BASE}`);
  console.log(`Simulating ${MACHINES.length} online machines...`);
  console.log('=======================================================');

  // Initial burst
  for (const m of MACHINES) {
    await sendHeartbeat(m);
  }

  // Periodic heartbeats every 60s
  setInterval(async () => {
    for (const m of MACHINES) {
      await sendHeartbeat(m);
    }
  }, 60000);
}

runSimulator();
