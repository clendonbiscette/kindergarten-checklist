import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Users, FileText, BarChart3, User, TrendingUp, GraduationCap } from 'lucide-react';

const VIEW_ITEMS = [
  { id: 'data-entry',       label: 'Assessment Entry',   icon: FileText,      type: 'view' },
  { id: 'learner-reports',  label: 'Student Reports',    icon: User,          type: 'view' },
  { id: 'reports',          label: 'Reports',            icon: BarChart3,     type: 'view' },
  { id: 'analytics',        label: 'Analytics',          icon: TrendingUp,    type: 'view' },
  { id: 'class-management', label: 'Class Management',   icon: GraduationCap, type: 'view' },
];

export default function CommandPalette({ isOpen, onClose, students, classes, subjects, onNavigate, onSelectStudent, onSelectSubject }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [
        ...VIEW_ITEMS,
        ...(students || []).slice(0, 5).map(s => ({
          id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.studentIdNumber, icon: Users, type: 'student', data: s,
        })),
      ];
    }

    const views = VIEW_ITEMS.filter(v => v.label.toLowerCase().includes(q));
    const filteredStudents = (students || [])
      .filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.studentIdNumber?.toLowerCase().includes(q))
      .slice(0, 8)
      .map(s => ({ id: s.id, label: `${s.firstName} ${s.lastName}`, sub: s.studentIdNumber, icon: Users, type: 'student', data: s }));
    const filteredSubjects = (subjects || [])
      .filter(s => s.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map(s => ({ id: s.id, label: s.name, sub: 'Subject', icon: BookIcon, type: 'subject', data: s }));
    const filteredClasses = (classes || [])
      .filter(c => c.name.toLowerCase().includes(q) || c.gradeLevel?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(c => ({ id: c.id, label: c.name, sub: c.gradeLevel, icon: GraduationCap, type: 'class', data: c }));

    return [...views, ...filteredStudents, ...filteredSubjects, ...filteredClasses];
  }, [query, students, subjects, classes]);

  // Keep activeIndex in range
  useEffect(() => {
    setActiveIndex(prev => Math.min(prev, Math.max(results.length - 1, 0)));
  }, [results]);

  const handleSelect = (item) => {
    if (item.type === 'view') {
      onNavigate(item.id);
    } else if (item.type === 'student') {
      onSelectStudent(item.id);
      onNavigate('data-entry');
    } else if (item.type === 'subject') {
      onSelectSubject(item.id);
      onNavigate('data-entry');
    } else if (item.type === 'class') {
      onNavigate('class-management');
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIndex]) { handleSelect(results[activeIndex]); }
  };

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  const grouped = {};
  results.forEach(item => {
    const section = item.type === 'view' ? 'Navigate' : item.type === 'student' ? 'Students' : item.type === 'subject' ? 'Subjects' : 'Classes';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(item);
  });

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search views, students, subjects…"
            className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
            aria-label="Command palette search"
          />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border rounded font-mono">Esc</kbd>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No results for "{query}"</p>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <div className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  {section}
                </div>
                {items.map((item) => {
                  const idx = flatIndex++;
                  const isActive = idx === activeIndex;
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      data-active={isActive}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-indigo-50 text-indigo-900' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md flex-shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                        <IconComp size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.label}</div>
                        {item.sub && <div className="text-xs text-gray-400 truncate">{item.sub}</div>}
                      </div>
                      {item.type === 'view' && (
                        <kbd className="text-[10px] px-1.5 py-0.5 bg-gray-100 border rounded font-mono text-gray-400 flex-shrink-0">
                          Go
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-[11px] text-gray-400">
          <span><kbd className="px-1 py-0.5 bg-gray-100 border rounded font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 border rounded font-mono">↵</kbd> select</span>
          <span><kbd className="px-1 py-0.5 bg-gray-100 border rounded font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// Inline icon for subjects (BookOpen equivalent without re-import)
function BookIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
