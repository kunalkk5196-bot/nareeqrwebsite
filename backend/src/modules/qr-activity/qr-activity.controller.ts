import { Router, Response } from 'express';
import { db } from '../../data/store.js';
import { authenticate, AuthenticatedRequest } from '../auth/auth.middleware.js';

const router = Router();

// GET /api/v1/qr-activity - Machine-wise and gateway-wise QR scan activity
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const machineActivity = db.machines.map((machine) => {
    const qrCodes = db.qrIdentifiers.filter((q) => q.machineId === machine.id && q.isActive);
    const phonepeQr = qrCodes.find((q) => q.gateway === 'PHONEPE');
    const razorpayQr = qrCodes.find((q) => q.gateway === 'RAZORPAY');

    const activities = db.qrActivities.filter((qa) => qa.machineId === machine.id);
    const payments = db.payments.filter((p) => p.machineId === machine.id);

    // PhonePe
    const phonepeScansList = activities.filter((a) => a.gateway === 'PHONEPE' && a.scanCount !== null);
    const phonepeScans = phonepeScansList.length > 0
      ? phonepeScansList.reduce((sum, a) => sum + (a.scanCount || 0), 0)
      : null; // strictly null if no provider scan data
    const phonepeSuccessfulPayments = payments.filter((p) => p.gateway === 'PHONEPE' && p.status === 'SUCCESS').length;
    const phonepeConversionRate = phonepeScans !== null && phonepeScans > 0
      ? ((phonepeSuccessfulPayments / phonepeScans) * 100).toFixed(1) + '%'
      : 'N/A (Scan data unavailable)';

    // Razorpay
    const razorpayScansList = activities.filter((a) => a.gateway === 'RAZORPAY' && a.scanCount !== null);
    const razorpayScans = razorpayScansList.length > 0
      ? razorpayScansList.reduce((sum, a) => sum + (a.scanCount || 0), 0)
      : null;
    const razorpaySuccessfulPayments = payments.filter((p) => p.gateway === 'RAZORPAY' && p.status === 'SUCCESS').length;
    const razorpayConversionRate = razorpayScans !== null && razorpayScans > 0
      ? ((razorpaySuccessfulPayments / razorpayScans) * 100).toFixed(1) + '%'
      : 'N/A (Scan data unavailable)';

    return {
      machineId: machine.machineId,
      machineName: machine.machineName,
      location: machine.location,
      city: machine.city,
      phonepe: {
        identifier: phonepeQr?.identifier || 'Not Configured',
        scanCount: phonepeScans,
        isScanDataAvailable: phonepeScans !== null,
        successfulPayments: phonepeSuccessfulPayments,
        conversionRate: phonepeConversionRate,
      },
      razorpay: {
        identifier: razorpayQr?.identifier || 'Not Configured',
        scanCount: razorpayScans,
        isScanDataAvailable: razorpayScans !== null,
        successfulPayments: razorpaySuccessfulPayments,
        conversionRate: razorpayConversionRate,
      },
    };
  });

  return res.json({
    success: true,
    data: {
      providerNotice: 'Static QR scan metrics are only recorded when exposed by PhonePe or Razorpay merchant telemetry APIs. Fabricated scan numbers are strictly prohibited per business rule 4.',
      machines: machineActivity,
    },
  });
});

export default router;
