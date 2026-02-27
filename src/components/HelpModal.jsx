import { useState } from 'react';
import { X, HelpCircle, MessageSquare, Ticket, ChevronDown, ChevronUp, Send, CheckCircle, AlertCircle, Clock, Loader2, Mail } from 'lucide-react';
import { useMyTickets, useCreateTicket, useTicket, useReplyToTicket } from '../hooks/useSupport';
import { supportAPI } from '../api/support';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'GENERAL_QUESTION', label: 'How-to / General Question' },
  { value: 'BUG_REPORT', label: 'Bug / Something is broken' },
  { value: 'ACCOUNT_ISSUE', label: 'Account / Login Issue' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request' },
];

const CATEGORY_COLORS = {
  GENERAL_QUESTION: 'bg-blue-100 text-blue-700',
  BUG_REPORT: 'bg-red-100 text-red-700',
  ACCOUNT_ISSUE: 'bg-amber-100 text-amber-700',
  FEATURE_REQUEST: 'bg-purple-100 text-purple-700',
};

const STATUS_COLORS = {
  OPEN: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const CATEGORY_LABELS = {
  GENERAL_QUESTION: 'General Question',
  BUG_REPORT: 'Bug Report',
  ACCOUNT_ISSUE: 'Account / Login',
  FEATURE_REQUEST: 'Feature Request',
};

const FAQS = [
  {
    q: 'What do the three rating symbols mean?',
    a: '+ (Easily Meeting) means the student demonstrates the outcome independently and confidently. = (Meeting) means the student meets the outcome with some support. ✗ (Needs Practice) means the student requires additional instruction.',
  },
  {
    q: 'How do I create a new assessment term?',
    a: 'Open the sidebar and look for the Term selector. If no terms exist yet, a "Create Term" button will appear. You can also click "Create Term" in the banner at the top of the screen. Enter the term name (e.g. "Term 1"), school year (e.g. "2025–2026"), and start/end dates.',
  },
  {
    q: 'How do I add students to my class?',
    a: 'Go to the Students tab in the sidebar. Click "Add Student" to add them one at a time, or use the CSV import button to bulk-upload a spreadsheet. Once added, assign the student to your class using the "Assign to Class" button.',
  },
  {
    q: 'What is "By Outcome" mode?',
    a: '"By Outcome" mode lets you rate your entire class for one outcome at a time — useful after a whole-class activity. Toggle between "By Student" and "By Outcome" using the buttons at the top of the assessment area. In By Outcome mode, select a subject and you\'ll see every outcome with a rating row for every student.',
  },
  {
    q: 'Can I edit a rating after saving it?',
    a: 'Yes. Ratings auto-save on click. Simply click a different rating button for the same outcome to update it. Same-day saves overwrite the earlier rating. Ratings on different dates are stored separately, preserving the full observation history.',
  },
  {
    q: 'What happens when I\'m offline?',
    a: 'The app works offline. Any assessments you save while offline are stored in a local queue and automatically synced to the server when you reconnect. You\'ll see a sync indicator in the top bar when items are queued or syncing.',
  },
  {
    q: 'How do I export a student report?',
    a: 'Go to the Reports section, select a student or strand, then use the PDF or CSV export buttons at the top of the report. PDF is suitable for sharing with parents; CSV is for further analysis in Excel or Google Sheets.',
  },
  {
    q: 'My school isn\'t listed — how do I add it?',
    a: 'On the school selection screen, scroll to the bottom and click "My school isn\'t listed — add it". Enter your school name and select your country. The school will be added and you\'ll be automatically assigned to it.',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const FaqAccordion = () => {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-1">
      {FAQS.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.q}</span>
            {open === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0 ml-2" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />}
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ContactForm = ({ onSuccess }) => {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { mutateAsync: createTicket, isPending } = useCreateTicket();
  const [createdId, setCreatedId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!category) { setError('Please select a category'); return; }
    if (!subject.trim()) { setError('Please enter a subject'); return; }
    if (message.trim().length < 10) { setError('Message must be at least 10 characters'); return; }

    try {
      const res = await createTicket({ category, subject: subject.trim(), message: message.trim() });
      setCreatedId(res.data?.id);
    } catch (err) {
      setError(err?.message || 'Failed to submit ticket. Please try again.');
    }
  };

  if (createdId) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={26} className="text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-lg">Ticket submitted!</p>
          <p className="text-sm text-gray-500 mt-1">Reference: <span className="font-mono text-xs text-gray-600">{createdId.slice(0, 8).toUpperCase()}</span></p>
          <p className="text-sm text-gray-500 mt-2">We'll reply within 1–2 business days. You'll receive an email when we respond.</p>
        </div>
        <button
          onClick={onSuccess}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Ticket size={15} />
          View My Tickets
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">Select a category…</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Brief description of your issue"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Describe your question or issue in detail…"
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {isPending ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </form>
  );
};

const TicketThread = ({ ticketId, onBack }) => {
  const { data: ticket, isLoading } = useTicket(ticketId);
  const [reply, setReply] = useState('');
  const { mutateAsync: sendReply, isPending } = useReplyToTicket(ticketId);
  const { user } = useAuth();
  const [error, setError] = useState('');

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setError('');
    try {
      await sendReply(reply.trim());
      setReply('');
    } catch {
      setError('Failed to send reply. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }
  if (!ticket) return null;

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">← Back to tickets</button>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-800">{ticket.subject}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ticket.category]}`}>{CATEGORY_LABELS[ticket.category]}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
          </div>
        </div>
      </div>

      {/* Original message */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-700">
            {ticket.user?.firstName?.[0]}{ticket.user?.lastName?.[0]}
          </div>
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <p className="text-xs text-gray-500 mb-1">{ticket.user?.firstName} {ticket.user?.lastName} · {format(new Date(ticket.createdAt), 'dd MMM yyyy, h:mm a')}</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{ticket.message}</p>
          </div>
        </div>

        {/* Replies */}
        {ticket.replies?.map(r => (
          <div key={r.id} className={`flex gap-3 ${r.isStaff ? '' : 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${r.isStaff ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {r.isStaff ? 'ST' : `${r.user?.firstName?.[0]}${r.user?.lastName?.[0]}`}
            </div>
            <div className={`flex-1 border rounded-lg px-3 py-2.5 ${r.isStaff ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-200'}`}>
              <p className="text-xs text-gray-500 mb-1">{r.isStaff ? 'Support Team' : `${r.user?.firstName} ${r.user?.lastName}`} · {format(new Date(r.createdAt), 'dd MMM yyyy, h:mm a')}</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.message}</p>
            </div>
          </div>
        ))}
      </div>

      {ticket.status !== 'RESOLVED' && (
        <form onSubmit={handleReply} className="border-t pt-3 space-y-2">
          <textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Add a reply…"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={isPending || !reply.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isPending ? 'Sending…' : 'Send Reply'}
          </button>
        </form>
      )}
      {ticket.status === 'RESOLVED' && (
        <p className="text-center text-sm text-green-600 font-medium py-2">This ticket has been resolved.</p>
      )}
    </div>
  );
};

const MyTickets = () => {
  const { data: tickets, isLoading } = useMyTickets();
  const [openTicketId, setOpenTicketId] = useState(null);

  if (openTicketId) {
    return <TicketThread ticketId={openTicketId} onBack={() => setOpenTicketId(null)} />;
  }

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  if (!tickets?.length) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500 font-medium">No tickets yet</p>
        <p className="text-xs text-gray-400 mt-1">Use "Contact Support" to submit a question or report an issue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map(ticket => (
        <button
          key={ticket.id}
          onClick={() => setOpenTicketId(ticket.id)}
          className="w-full text-left border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-800 truncate flex-1">{ticket.subject}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[ticket.status]}`}>{STATUS_LABELS[ticket.status]}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ticket.category]}`}>{CATEGORY_LABELS[ticket.category]}</span>
            <span className="text-xs text-gray-400">{ticket.replies?.length || 0} {ticket.replies?.length === 1 ? 'reply' : 'replies'}</span>
            <span className="text-xs text-gray-400 ml-auto">
              <Clock size={11} className="inline mr-0.5" />
              {format(new Date(ticket.updatedAt || ticket.createdAt), 'dd MMM yyyy')}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

const PublicContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (message.trim().length < 10) { setError('Message must be at least 10 characters'); return; }
    setLoading(true);
    try {
      await supportAPI.publicContact({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      setSent(true);
    } catch (err) {
      setError(err?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={26} className="text-green-600" />
        </div>
        <p className="font-semibold text-gray-800 text-lg">Message sent!</p>
        <p className="text-sm text-gray-500">We'll reply to <span className="font-medium text-gray-700">{email}</span> within 1–2 business days.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-500">Can't log in? Send us a message and we'll get back to you by email.</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Jane Smith"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="jane@school.edu"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          required
          placeholder="e.g. Can't log in to my account"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          placeholder="Describe your issue in detail…"
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {loading ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
  { id: 'contact', label: 'Contact Support', icon: MessageSquare },
  { id: 'tickets', label: 'My Tickets', icon: Ticket },
];

const PUBLIC_TABS = [
  { id: 'faq', label: 'FAQs', icon: HelpCircle },
  { id: 'contact-public', label: 'Contact Us', icon: Mail },
];

const HelpModal = ({ onClose, publicMode = false }) => {
  const [tab, setTab] = useState('faq');

  const visibleTabs = publicMode ? PUBLIC_TABS : TABS;
  const switchToTickets = () => setTab('tickets');

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-indigo-600" />
            <h2 id="help-modal-title" className="font-semibold text-gray-800">Help & Support</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b flex-shrink-0">
          {visibleTabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                  tab === t.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'faq' && <FaqAccordion />}
          {tab === 'contact' && <ContactForm onSuccess={switchToTickets} />}
          {tab === 'contact-public' && <PublicContactForm />}
          {tab === 'tickets' && <MyTickets />}
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
