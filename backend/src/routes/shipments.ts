import { Router, Request, Response } from 'express';
import prisma from '../db';
import { ShipmentStatus } from '@prisma/client';

const router = Router();

const VALID_STATUSES = Object.values(ShipmentStatus);

// GET /api/shipments - List shipments with optional filtering & search
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, q } = req.query;

    const whereClause: any = {};

    if (status && typeof status === 'string' && VALID_STATUSES.includes(status as ShipmentStatus)) {
      whereClause.currentStatus = status as ShipmentStatus;
    }

    if (q && typeof q === 'string' && q.trim().length > 0) {
      const searchTerm = q.trim();
      whereClause.OR = [
        { referenceNumber: { contains: searchTerm, mode: 'insensitive' } },
        { origin: { contains: searchTerm, mode: 'insensitive' } },
        { destination: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const shipments = await prisma.shipment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { history: true },
        },
      },
    });

    res.json({
      success: true,
      count: shipments.length,
      data: shipments,
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shipments' });
  }
});

// GET /api/shipments/:id - Single shipment with history
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: {
        history: {
          orderBy: { changedAt: 'desc' },
        },
      },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    res.json({ success: true, data: shipment });
  } catch (error) {
    console.error('Error fetching shipment:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shipment' });
  }
});

// POST /api/shipments - Create a new shipment + initial history entry (Atomic Transaction)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { referenceNumber, origin, destination, expectedDeliveryDate, initialStatus, note, location } = req.body;

    // Basic validation
    if (!referenceNumber || typeof referenceNumber !== 'string' || !referenceNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Reference number is required' });
    }

    if (!origin || typeof origin !== 'string' || !origin.trim()) {
      return res.status(400).json({ success: false, message: 'Origin is required' });
    }

    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      return res.status(400).json({ success: false, message: 'Destination is required' });
    }

    if (!expectedDeliveryDate || isNaN(Date.parse(expectedDeliveryDate))) {
      return res.status(400).json({ success: false, message: 'Valid expected delivery date is required' });
    }

    const trimmedRef = referenceNumber.trim();

    if (!/^\d{6}$/.test(trimmedRef)) {
      return res.status(400).json({
        success: false,
        message: 'Reference number must be exactly 6 digits (e.g. 104926)',
      });
    }

    // Check for existing reference number
    const existing = await prisma.shipment.findUnique({
      where: { referenceNumber: trimmedRef },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Shipment with reference number '${trimmedRef}' already exists`,
      });
    }

    const statusToApply: ShipmentStatus =
      initialStatus && VALID_STATUSES.includes(initialStatus)
        ? (initialStatus as ShipmentStatus)
        : ShipmentStatus.BOOKED;

    // Transaction: Create shipment and initial status history
    const result = await prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.create({
        data: {
          referenceNumber: trimmedRef,
          origin: origin.trim(),
          destination: destination.trim(),
          expectedDeliveryDate: new Date(expectedDeliveryDate),
          currentStatus: statusToApply,
        },
      });

      const historyEntry = await tx.statusHistory.create({
        data: {
          shipmentId: shipment.id,
          status: statusToApply,
          note: note ? note.trim() : 'Shipment registered in system',
          location: location ? location.trim() : origin.trim(),
        },
      });

      return {
        ...shipment,
        history: [historyEntry],
      };
    });

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ success: false, message: 'Failed to create shipment' });
  }
});

// PATCH /api/shipments/:id/status - Append a new status (Atomic Transaction: append history + update current_status)
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { status, note, location } = req.body;

    if (!status || !VALID_STATUSES.includes(status as ShipmentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Verify shipment exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!existingShipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const nextStatus = status as ShipmentStatus;

    // Transaction: Append to history and update shipment currentStatus
    const updatedShipment = await prisma.$transaction(async (tx) => {
      const historyEntry = await tx.statusHistory.create({
        data: {
          shipmentId: id,
          status: nextStatus,
          note: note && typeof note === 'string' ? note.trim() : null,
          location: location && typeof location === 'string' ? location.trim() : null,
        },
      });

      const updated = await tx.shipment.update({
        where: { id },
        data: {
          currentStatus: nextStatus,
        },
        include: {
          history: {
            orderBy: { changedAt: 'desc' },
          },
        },
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Shipment status updated to ${nextStatus}`,
      data: updatedShipment,
    });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ success: false, message: 'Failed to update shipment status' });
  }
});

// GET /api/shipments/:id/history - Get complete history timeline for a shipment
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    const shipment = await prisma.shipment.findUnique({
      where: { id },
      select: { id: true, referenceNumber: true, currentStatus: true },
    });

    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found' });
    }

    const history = await prisma.statusHistory.findMany({
      where: { shipmentId: id },
      orderBy: { changedAt: 'desc' },
    });

    res.json({
      success: true,
      shipment,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching shipment history:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve shipment history' });
  }
});

export default router;
