import { HttpError } from '../../../http-error';
import * as availabilityRepo from '../repositories';
import * as doctorsService from '../../doctors/services';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function listOpenSlots(doctorProfileId: string) {
  return availabilityRepo.findOpenSlots(doctorProfileId);
}

export interface GenerateSlotsInput {
  doctorProfileId: string;
  /** ISO date, e.g. "2026-10-19" — single day only, no recurrence
   * (ARCHITECTURE.md §6.3.6 overengineering guardrail: fixed-length slot
   * generation only, no recurrence/buffer engine). */
  date: string;
  /** IANA time zone identifier, e.g. "Europe/London", "America/New_York"
   *   The doctor's local wall-clock hours are interpreted in this zone.
   *   If omitted, defaults to UTC (backward-compatible). */
  timeZone?: string;
  startHour: number; // 0-23, local wall-clock
  endHour: number; // 0-23, local wall-clock, exclusive
  slotLengthMinutes: number;
}

export async function generateSlots(input: GenerateSlotsInput) {
  const { doctorProfileId, date, startHour, endHour, slotLengthMinutes, timeZone } = input;

  if (slotLengthMinutes <= 0) throw new HttpError(400, 'slotLengthMinutes must be positive.');
  if (startHour < 0 || endHour > 24 || startHour >= endHour) {
    throw new HttpError(400, 'startHour must be before endHour, both within 0-24.');
  }

  const tz = timeZone ?? 'UTC';
  // Interpret the date as midnight in the doctor's timezone, then convert to UTC instants
  const dayStartLocal = fromZonedTime(`${date}T00:00:00.000Z`, tz);
  const dayStart = new Date(dayStartLocal.getTime());
  if (Number.isNaN(dayStart.getTime())) throw new HttpError(400, 'date must be a valid ISO date.');

  // Convert local wall-clock hours to UTC instants in the doctor's timezone
  const rangeStart = new Date(dayStart.getTime() + startHour * 60 * 60 * 1000);
  const rangeEnd = new Date(dayStart.getTime() + endHour * 60 * 60 * 1000);

  const existing = await availabilityRepo.findExistingSlotRanges(doctorProfileId, rangeStart, rangeEnd);
  const existingStarts = new Set(existing.map((slot) => slot.startTime.getTime()));

  const rows: { doctorProfileId: string; startTime: Date; endTime: Date }[] = [];
  const stepMs = slotLengthMinutes * 60 * 1000;
  for (let start = rangeStart.getTime(); start + stepMs <= rangeEnd.getTime(); start += stepMs) {
    if (existingStarts.has(start)) continue; // idempotent: skip slots already generated
    // Convert the local start instant back to UTC for storage
    const utcStart = toZonedTime(new Date(start), tz);
    rows.push({ doctorProfileId, startTime: utcStart, endTime: new Date(utcStart.getTime() + stepMs) });
  }

  if (rows.length === 0) return { created: 0 };

  const result = await availabilityRepo.createSlots(rows);
  return { created: result.count };
}

/** Re-exported for appointments/services — the only cross-module entry
 * points into this module's booking-concurrency primitive and slot reads.
 * Never import availability/repositories from another module directly. */
export { claimOpenSlot, findSlotById as getSlot } from '../repositories';

/** Batch slot-time lookup for other modules (patient data export, issue
 * #40). Times only — no status or doctor internals. */
export async function getSlotTimesByIds(slotIds: string[]): Promise<Map<string, { startTime: Date; endTime: Date }>> {
  if (slotIds.length === 0) return new Map();
  const rows = await availabilityRepo.findSlotTimesByIds([...new Set(slotIds)]);
  return new Map(rows.map((row) => [row.id, { startTime: row.startTime, endTime: row.endTime }]));
}

export async function assertCanGenerateFor(userId: string, doctorProfileId: string) {
  await doctorsService.assertOwnsDoctorProfile(userId, doctorProfileId);
}
