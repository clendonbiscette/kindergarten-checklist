import { useState } from 'react';
import { CheckCircle, ChevronRight, Plus, Trash2, BookOpen, Users, PartyPopper } from 'lucide-react';
import { classesAPI } from '../api/classes';
import apiClient from '../api/client';

const STEPS = ['Create Your Class', 'Add Students', 'Ready!'];

const GRADE_OPTIONS = [
  'Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3',
];

const getCurrentSchoolYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // Sep = 8
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
};

const TeacherOnboardingWizard = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: class, 1: students, 2: done
  const [createdClass, setCreatedClass] = useState(null);

  // Step 0 — Class form
  const [className, setClassName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Kindergarten');
  const [classError, setClassError] = useState('');
  const [classLoading, setClassLoading] = useState(false);

  // Step 1 — Students form
  const [students, setStudents] = useState([{ firstName: '', lastName: '', dob: '' }]);
  const [studentErrors, setStudentErrors] = useState([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateClass = async (e) => {
    e.preventDefault();
    setClassError('');
    setClassLoading(true);
    try {
      const res = await classesAPI.create({
        name: className,
        gradeLevel,
        academicYear: getCurrentSchoolYear(),
      });
      if (res.success) {
        setCreatedClass(res.data);
        setStep(1);
      } else {
        setClassError(res.message || 'Failed to create class');
      }
    } catch (err) {
      setClassError(err.message || 'Failed to create class');
    } finally {
      setClassLoading(false);
    }
  };

  const addStudentRow = () => {
    setStudents([...students, { firstName: '', lastName: '', dob: '' }]);
  };

  const removeStudentRow = (idx) => {
    setStudents(students.filter((_, i) => i !== idx));
  };

  const updateStudent = (idx, field, value) => {
    const updated = [...students];
    updated[idx] = { ...updated[idx], [field]: value };
    setStudents(updated);
  };

  const handleAddStudents = async () => {
    const valid = students.filter(s => s.firstName.trim() && s.lastName.trim());
    if (valid.length === 0) {
      // Skip to done with 0 students
      setStep(2);
      return;
    }

    setAddingStudents(true);
    setStudentErrors([]);
    let count = 0;
    const errors = [];

    for (const s of valid) {
      try {
        const res = await apiClient.post('/students', {
          firstName: s.firstName.trim(),
          lastName: s.lastName.trim(),
          dateOfBirth: s.dob || undefined,
          classId: createdClass.id,
          schoolId: createdClass.schoolId,
        });
        if (res.success) {
          count++;
        } else {
          errors.push(`${s.firstName} ${s.lastName}: ${res.message}`);
        }
      } catch (err) {
        errors.push(`${s.firstName} ${s.lastName}: ${err.message}`);
      }
    }

    setAddedCount(count);
    setStudentErrors(errors);
    setAddingStudents(false);
    setStep(2);
  };

  const handleSkipStudents = () => {
    setStep(2);
  };

  // ── Progress dots ─────────────────────────────────────────────────────────
  const ProgressDots = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
            i < step ? 'bg-[#7CB342] text-white' :
            i === step ? 'bg-[#1E3A5F] text-white' :
            'bg-gray-200 text-gray-500'
          }`}>
            {i < step ? <CheckCircle size={16} /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${i === step ? 'text-[#1E3A5F]' : 'text-gray-400'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <ChevronRight size={14} className="text-gray-300 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );

  // ── Step 0: Create Class ──────────────────────────────────────────────────
  const renderClassStep = () => (
    <div>
      <div className="text-center mb-6">
        <BookOpen size={36} className="mx-auto mb-3 text-[#1E3A5F]" />
        <h2 className="text-xl font-bold text-gray-800">Create your classroom</h2>
        <p className="text-sm text-gray-500 mt-1">Start by setting up your class for this school year.</p>
      </div>

      <form onSubmit={handleCreateClass} className="space-y-4">
        {classError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{classError}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Class Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={className}
            onChange={e => setClassName(e.target.value)}
            placeholder="e.g. Kindergarten A, Room 3"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Grade Level</label>
          <select
            value={gradeLevel}
            onChange={e => setGradeLevel(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
          >
            {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-500">
          School Year: <span className="font-medium text-gray-700">{getCurrentSchoolYear()}</span>
        </div>

        <button
          type="submit"
          disabled={classLoading}
          className="w-full py-3 bg-[#1E3A5F] text-white font-semibold rounded-lg hover:bg-[#2D4A6F] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {classLoading ? 'Creating...' : (<>Create Class <ChevronRight size={18} /></>)}
        </button>
      </form>
    </div>
  );

  // ── Step 1: Add Students ──────────────────────────────────────────────────
  const renderStudentsStep = () => (
    <div>
      <div className="text-center mb-6">
        <Users size={36} className="mx-auto mb-3 text-[#1E3A5F]" />
        <h2 className="text-xl font-bold text-gray-800">Add your students</h2>
        <p className="text-sm text-gray-500 mt-1">
          Class <span className="font-medium text-gray-700">{createdClass?.name}</span> is ready. Add students now or skip and do it later.
        </p>
      </div>

      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto pr-1">
        {students.map((s, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={s.firstName}
                onChange={e => updateStudent(idx, 'firstName', e.target.value)}
                placeholder="First name"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
              <input
                type="text"
                value={s.lastName}
                onChange={e => updateStudent(idx, 'lastName', e.target.value)}
                placeholder="Last name"
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#1E3A5F] focus:outline-none"
              />
            </div>
            {students.length > 1 && (
              <button
                onClick={() => removeStudentRow(idx)}
                className="mt-1.5 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addStudentRow}
        className="flex items-center gap-1.5 text-sm text-[#1E3A5F] font-medium hover:underline mb-6"
      >
        <Plus size={16} /> Add another student
      </button>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleAddStudents}
          disabled={addingStudents}
          className="w-full py-3 bg-[#1E3A5F] text-white font-semibold rounded-lg hover:bg-[#2D4A6F] transition-colors disabled:opacity-50"
        >
          {addingStudents ? 'Adding students...' : 'Add Students & Continue'}
        </button>
        <button
          onClick={handleSkipStudents}
          className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Skip for now — I&apos;ll add students later
        </button>
      </div>
    </div>
  );

  // ── Step 2: Done ──────────────────────────────────────────────────────────
  const renderDoneStep = () => (
    <div className="text-center py-4">
      <PartyPopper size={48} className="mx-auto mb-4 text-[#7CB342]" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Your classroom is ready!</h2>
      <p className="text-gray-600 text-sm mb-1">
        Class <span className="font-semibold">{createdClass?.name}</span> has been created.
      </p>
      {addedCount > 0 && (
        <p className="text-gray-500 text-sm mb-1">
          {addedCount} {addedCount === 1 ? 'student' : 'students'} added successfully.
        </p>
      )}
      {studentErrors.length > 0 && (
        <div className="mt-3 text-left bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-medium text-amber-800 mb-1">Some students could not be added:</p>
          {studentErrors.map((e, i) => <p key={i} className="text-xs text-amber-700">{e}</p>)}
          <p className="text-xs text-amber-600 mt-1">You can add them manually from the student roster.</p>
        </div>
      )}
      <button
        onClick={() => {
          if (createdClass?.id) {
            localStorage.setItem('ohpc_wizard_class_id', createdClass.id);
          }
          onComplete();
        }}
        className="mt-6 w-full py-3 bg-[#7CB342] text-white font-bold rounded-lg hover:bg-[#6aa030] transition-colors flex items-center justify-center gap-2"
      >
        Start Assessing <ChevronRight size={18} />
      </button>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A5F] to-[#2D4A6F] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E3A5F] px-8 py-5 text-white text-center">
          <h1 className="text-lg font-bold">Welcome to OHPC Kindergarten</h1>
          <p className="text-blue-200 text-sm mt-0.5">Let&apos;s get your classroom set up</p>
        </div>

        <div className="p-8">
          <ProgressDots />
          {step === 0 && renderClassStep()}
          {step === 1 && renderStudentsStep()}
          {step === 2 && renderDoneStep()}
        </div>
      </div>
    </div>
  );
};

export default TeacherOnboardingWizard;
