import { z } from 'zod';

export const bookSlotSchema = z.object({
  availabilitySlotId: z.string().min(1),
});

export const rescheduleSlotSchema = z.object({
  newSlotId: z.string().min(1),
});

// Schema for reschedule request body
export const rescheduleSlotBodySchema = z.object({
  newSlotId: z.string().min(1),
});

// Schema for cancellation request body
export const cancelAppointmentSchema = z.object({
  reason: z.enum(['patient', 'doctor']).optional(),
});

// Schema for joining the waitlist
export const waitlistJoinSchema = z.object({
  doctorProfileId: z.string().optional(),
  specialtyId: z.string().optional(),
  earliestAcceptable: z.string().datetime(),
  latestAcceptable: z.string().datetime(),
  holdDurationMinutes: z.number().int().positive().optional(),
});

// Schema for leaving the waitlist
export const leaveWaitlistSchema = z.object({
  entryId: z.string().optional(),
});

// Schema for accepting a waitlist offer
export const acceptWaitlistSchema = z.object({
  entryId: z.string(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['completed', 'cancelled', 'no_show']),
});
