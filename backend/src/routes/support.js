import express from 'express';
import {
  createTicket,
  getTickets,
  getTicket,
  replyToTicket,
  updateTicketStatus,
} from '../controllers/supportController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.get('/tickets/:id', getTicket);
router.post('/tickets/:id/reply', replyToTicket);
router.patch('/tickets/:id/status', authorize('SUPERUSER'), updateTicketStatus);

export default router;
