import prisma from '../utils/prisma.js';
import { sendNewTicketNotification, sendTicketReplyNotification } from '../utils/email.js';

const VALID_CATEGORIES = ['GENERAL_QUESTION', 'BUG_REPORT', 'ACCOUNT_ISSUE', 'FEATURE_REQUEST'];
const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

// POST /support/tickets — create a new ticket
export const createTicket = async (req, res, next) => {
  try {
    const { subject, category, message } = req.body;
    const userId = req.user.userId;

    if (!subject?.trim() || !category || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'subject, category, and message are required' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Message must be at least 10 characters' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: subject.trim(),
        category,
        message: message.trim(),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    // Notify support inbox (fire-and-forget — don't fail if email errors)
    const supportEmail = process.env.GMAIL_USER;
    if (supportEmail) {
      sendNewTicketNotification(supportEmail, {
        submitterName: `${ticket.user.firstName} ${ticket.user.lastName}`,
        ticketId: ticket.id,
        subject: ticket.subject,
        category: ticket.category,
        message: ticket.message,
      }).catch(err => console.error('Failed to send ticket notification email:', err));
    }

    res.status(201).json({ success: true, message: 'Ticket submitted successfully', data: ticket });
  } catch (error) {
    next(error);
  }
};

// GET /support/tickets — list tickets
// SUPERUSER: all tickets with filters; TEACHER: own tickets only
export const getTickets = async (req, res, next) => {
  try {
    const role = req.user.role;
    const userId = req.user.userId;

    if (role === 'SUPERUSER') {
      const { status, category, search, page = 1, limit = 20 } = req.query;
      const where = {
        ...(status && { status }),
        ...(category && { category }),
        ...(search && {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      };

      const skip = (Number(page) - 1) * Number(limit);
      const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
          where,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } },
            replies: { select: { id: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.supportTicket.count({ where }),
      ]);

      return res.status(200).json({
        success: true,
        data: { tickets, total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
      });
    }

    // TEACHER — own tickets only
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        replies: { select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};

// GET /support/tickets/:id — get ticket + full thread
export const getTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const role = req.user.role;
    const userId = req.user.userId;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        replies: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Teachers can only see their own tickets
    if (role !== 'SUPERUSER' && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

// POST /support/tickets/:id/reply — add a reply
export const replyToTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const role = req.user.role;
    const userId = req.user.userId;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, email: true } } },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // Only the ticket owner or SUPERUSER can reply
    if (role !== 'SUPERUSER' && ticket.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const isStaff = role === 'SUPERUSER';

    const [reply] = await Promise.all([
      prisma.ticketReply.create({
        data: { ticketId: id, userId, message: message.trim(), isStaff },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      // Touch updatedAt on ticket
      prisma.supportTicket.update({ where: { id }, data: { updatedAt: new Date() } }),
    ]);

    // If staff replied, notify the teacher by email
    if (isStaff && ticket.user?.email) {
      sendTicketReplyNotification(ticket.user.email, {
        firstName: ticket.user.firstName,
        ticketSubject: ticket.subject,
        replyMessage: message.trim(),
      }).catch(err => console.error('Failed to send reply notification email:', err));
    }

    res.status(201).json({ success: true, message: 'Reply added', data: reply });
  } catch (error) {
    next(error);
  }
};

// PATCH /support/tickets/:id/status — SUPERUSER updates ticket status
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const ticket = await prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        replies: { select: { id: true } },
      },
    });

    res.status(200).json({ success: true, message: 'Status updated', data: updated });
  } catch (error) {
    next(error);
  }
};
