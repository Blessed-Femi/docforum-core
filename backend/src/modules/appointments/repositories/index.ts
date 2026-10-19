import { prisma } from '../../../db/prisma-client';
import type { Prisma, AppointmentStatus } from '@prisma/client';

type DbClient = typeof prisma | Prisma.TransactionClient;

export function createAppointment(
  db: DbClient,
  data: { patientProfileId: string; doctorProfileId: string; availabilitySlotId: string },
) {
  return db.appointment.create({ data });
}

/** Find a single appointment by ID (used inside transactions). */
export function findAppointmentById(db: DbClient, id: string) {
  return db.appointment.findUnique({ where: { id } });
}

/** Update an appointment (used inside transactions). */
export async function updateAppointment(
  db: DbClient,
  id: string,
  data: { availabilitySlotId?: string; status?: AppointmentStatus },
) {
  return db.appointment.update({ where: { id }, data });
}

/** Update an appointment's availabilitySlotId (used inside transactions). */
export async function updateAvailabilitySlotId(
  db: DbClient,
  id: string,
  data: { availabilitySlotId: string },
) {
  return db.appointment.update({ where: { id }, data });
}


/** One keyset page of a patient's appointments, oldest first (patient data
 * export, issue #40). Appointment columns only — slot/doctor details come
 * from those modules' services, not a join. */
export function findAppointmentsPageForPatient(patientProfileId: string, cursor: string | undefined, take: number) {
  return prisma.appointment.findMany({
    where: { patientProfileId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export function findAppointmentsForPatient(patientProfileId: string) {
  return prisma.appointment.findMany({
    where: { patientProfileId },
    include: { availabilitySlot: true },
    orderBy: { createdAt: 'desc' },
  });
}
