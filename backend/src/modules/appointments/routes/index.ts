import { Router } from 'express';
import { authenticate, requireRole, requireVerifiedEmail } from '../../../middleware/auth';
import * as appointmentsController from '../controllers';

export const appointmentsRouter = Router();

// Booking is a mutation against someone else's calendar, and the patient
// gets notifications about it — so it requires a verified address
// (Phase 8, issue #34). Browsing (`GET /availability/...`) stays open.
appointmentsRouter.post(
  '/',
  authenticate,
  requireRole('patient'),
  requireVerifiedEmail,
  appointmentsController.book,
);
appointmentsRouter.get('/mine', authenticate, requireRole('patient'), appointmentsController.listMine);

// Reschedule an appointment atomically: claim new slot and release old one
// (Phase 2, issue #55). Requires verified email.
appointmentsRouter.post(
  '/:id/reschedule',
  authenticate,
  requireRole('patient'),
  requireVerifiedEmail,
  appointmentsController.reschedule,
);
// Cancel an appointment (Phase 2, issue #56). Requires verified email.
appointmentsRouter.post(
  '/:id/cancel',
  authenticate,
  requireRole('patient'),
  requireVerifiedEmail,
  appointmentsController.cancel,
);
// Waitlist operations (Phase 2, issue #57): join, leave, list, accept offer
appointmentsRouter.post(
  '/waitlist/join',
  authenticate,
  requireRole('patient'),
  requireVerifiedEmail,
  appointmentsController.joinWaitlist,
);
appointmentsRouter.post(
  '/waitlist/leave',
  authenticate,
  requireRole('patient'),
  requireVerifiedEmail,
  appointmentsController.leaveWaitlist,
);
appointmentsRouter.get(
  '/waitlist/list',
  authenticate,
  requireRole('patient'),
  appointmentsController.listWaitlist,
);
appointmentsRouter.post(
  '/waitlist/accept',
  authenticate,
  requireRole('patient'),
  requireVerifiedEmail,
  appointmentsController.acceptWaitlistOffer,
);
