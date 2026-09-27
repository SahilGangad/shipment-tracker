import { PrismaClient, ShipmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial logistics shipments...');

  // Clean existing data for clean seed
  await prisma.statusHistory.deleteMany({});
  await prisma.shipment.deleteMany({});

  // 1. Delivered shipment
  const delivered = await prisma.shipment.create({
    data: {
      referenceNumber: '992104',
      origin: 'Delhi Cargo Terminal, India',
      destination: 'Pokhara Logistics Hub, Nepal',
      expectedDeliveryDate: new Date('2026-09-25T18:00:00Z'),
      currentStatus: ShipmentStatus.DELIVERED,
      createdAt: new Date('2026-09-20T09:00:00Z'),
      history: {
        create: [
          {
            status: ShipmentStatus.BOOKED,
            changedAt: new Date('2026-09-20T09:00:00Z'),
            note: 'Order confirmed and airway bill generated.',
            location: 'Delhi Cargo Terminal, India',
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            changedAt: new Date('2026-09-21T14:30:00Z'),
            note: 'Dispatched on convoy route 4 via Sunauli border.',
            location: 'Sunauli Border',
          },
          {
            status: ShipmentStatus.OUT_FOR_DELIVERY,
            changedAt: new Date('2026-09-24T08:15:00Z'),
            note: 'Loaded on local delivery van #8.',
            location: 'Pokhara Logistics Hub',
          },
          {
            status: ShipmentStatus.DELIVERED,
            changedAt: new Date('2026-09-25T15:20:00Z'),
            note: 'Delivered to recipient with digital signature confirmation.',
            location: 'Pokhara, Nepal',
          },
        ],
      },
    },
  });

  // 2. Customs Hold shipment
  const customsHold = await prisma.shipment.create({
    data: {
      referenceNumber: '801452',
      origin: 'Birgunj Dry Port, Nepal',
      destination: 'Kolkata Port, India',
      expectedDeliveryDate: new Date('2026-10-02T12:00:00Z'),
      currentStatus: ShipmentStatus.CUSTOMS_HOLD,
      createdAt: new Date('2026-09-22T11:00:00Z'),
      history: {
        create: [
          {
            status: ShipmentStatus.BOOKED,
            changedAt: new Date('2026-09-22T11:00:00Z'),
            note: 'Export booking registered.',
            location: 'Birgunj Dry Port, Nepal',
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            changedAt: new Date('2026-09-23T16:00:00Z'),
            note: 'Transit container mounted on rail transport.',
            location: 'Raxaul Junction',
          },
          {
            status: ShipmentStatus.CUSTOMS_HOLD,
            changedAt: new Date('2026-09-25T10:45:00Z'),
            note: 'Customs inspection hold: awaiting revised transit declaration certificate.',
            location: 'Kolkata Customs Inspection Yard',
          },
        ],
      },
    },
  });

  // 3. In Transit shipment
  const inTransit = await prisma.shipment.create({
    data: {
      referenceNumber: '708213',
      origin: 'Kathmandu Cargo Complex, Nepal',
      destination: 'Hamburg Port, Germany',
      expectedDeliveryDate: new Date('2026-10-08T18:00:00Z'),
      currentStatus: ShipmentStatus.IN_TRANSIT,
      createdAt: new Date('2026-09-24T07:30:00Z'),
      history: {
        create: [
          {
            status: ShipmentStatus.BOOKED,
            changedAt: new Date('2026-09-24T07:30:00Z'),
            note: 'Air freight consignment booked.',
            location: 'Tribhuvan International Cargo, KTM',
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            changedAt: new Date('2026-09-25T13:00:00Z'),
            note: 'Departed via connection flight QR651.',
            location: 'Doha International Airport',
          },
        ],
      },
    },
  });

  // 4. Out for delivery
  const outForDelivery = await prisma.shipment.create({
    data: {
      referenceNumber: '910328',
      origin: 'Dubai JAFZA Hub, UAE',
      destination: 'Nagarkot Central Warehouse, Kathmandu',
      expectedDeliveryDate: new Date('2026-09-27T17:00:00Z'),
      currentStatus: ShipmentStatus.OUT_FOR_DELIVERY,
      createdAt: new Date('2026-09-21T10:00:00Z'),
      history: {
        create: [
          {
            status: ShipmentStatus.BOOKED,
            changedAt: new Date('2026-09-21T10:00:00Z'),
            note: 'Direct consignment booked.',
            location: 'Dubai JAFZA Hub',
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            changedAt: new Date('2026-09-23T22:00:00Z'),
            note: 'Airway pallet transferred to KTM customs.',
            location: 'Kathmandu Cargo Complex',
          },
          {
            status: ShipmentStatus.OUT_FOR_DELIVERY,
            changedAt: new Date('2026-09-27T08:30:00Z'),
            note: 'Courier vehicle dispatched for delivery.',
            location: 'Kathmandu Valley Route 2',
          },
        ],
      },
    },
  });

  // 5. Newly Booked shipment
  const booked = await prisma.shipment.create({
    data: {
      referenceNumber: '104926',
      origin: 'Guangzhou Port, China',
      destination: 'Tatopani Border Depot, Nepal',
      expectedDeliveryDate: new Date('2026-10-15T12:00:00Z'),
      currentStatus: ShipmentStatus.BOOKED,
      createdAt: new Date('2026-09-26T14:15:00Z'),
      history: {
        create: [
          {
            status: ShipmentStatus.BOOKED,
            changedAt: new Date('2026-09-26T14:15:00Z'),
            note: 'Shipment container allocation confirmed.',
            location: 'Guangzhou Port, China',
          },
        ],
      },
    },
  });

  console.log(`Seed completed successfully! Inserted 5 shipments with status histories.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
