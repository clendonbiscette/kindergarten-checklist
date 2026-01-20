import React, { useState, useMemo } from 'react';
import { Download, Plus, Search, Filter, X } from 'lucide-react';
import { assessmentData } from './assessmentData';

const KindergartenAssessment = () => {

  const countries = ['Anguilla', 'Antigua and Barbuda', 'British Virgin Islands', 'Dominica', 'Grenada', 'Montserrat', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines'];
  const schools = ['Central Primary', 'Mountain View School', 'Coastal Academy', 'Valley School'];
  const teachers = ['Ms. Johnson', 'Mr. Thompson', 'Mrs. Williams', 'Ms. Davis'];
  const terms = ['Term 1', 'Term 2', 'Term 3'];
  
  // Sample learners
  const sampleLearners = [
    'Emma Williams', 'Noah Brown', 'Olivia Davis', 'Liam Wilson', 'Ava Martinez',
    'Ethan Anderson', 'Sophia Thomas', 'Mason Jackson', 'Isabella White', 'Lucas Harris'
  ];

  // State management
  const [currentView, setCurrentView] = useState('data-entry');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedSchool, setSelectedSchool] = useState(schools[0]);
  const [selectedTeacher, setSelectedTeacher] = useState(teachers[0]);
  const [selectedTerm, setSelectedTerm] = useState(terms[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('language_arts');
  const [selectedLearner, setSelectedLearner] = useState(sampleLearners[0]);
  const [selectedStrand, setSelectedStrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Assessment records (in a real app, this would be in a database)
  const [assessmentRecords, setAssessmentRecords] = useState([
    { id: 1, learner: 'Emma Williams', subject: 'language_arts', code: '1.1', rating: '+', comment: 'Excellent listening skills', date: '2025-09-15', term: 'Term 1' },
    { id: 2, learner: 'Emma Williams', subject: 'mathematics', code: '1.1.1', rating: '=', comment: 'Meets expectations', date: '2025-09-16', term: 'Term 1' },
    { id: 3, learner: 'Noah Brown', subject: 'language_arts', code: '1.1', rating: 'x', comment: 'Needs more practice with focus', date: '2025-09-15', term: 'Term 1' },
  ]);
  
  const [tempAssessments, setTempAssessments] = useState({});
  const [tempComments, setTempComments] = useState({});

  // Get unique strands for current subject
  const currentStrands = useMemo(() => {
    const strands = new Set(assessmentData[selectedSubject]?.map(o => o.strand) || []);
    return ['all', ...Array.from(strands)];
  }, [selectedSubject]);

  // Filter outcomes by strand and search
  const filteredOutcomes = useMemo(() => {
    let outcomes = assessmentData[selectedSubject] || [];
    
    if (selectedStrand !== 'all') {
      outcomes = outcomes.filter(o => o.strand === selectedStrand);
    }
    
    if (searchTerm) {
      outcomes = outcomes.filter(o => 
        o.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return outcomes;
  }, [selectedSubject, selectedStrand, searchTerm]);

  // Save assessment
  const handleSaveAssessment = (outcomeCode) => {
    const rating = tempAssessments[outcomeCode];
    const comment = tempComments[outcomeCode] || '';
    
    if (rating) {
      const newRecord = {
        id: Date.now(),
        learner: selectedLearner,
        subject: selectedSubject,
        code: outcomeCode,
        rating,
        comment,
        date: selectedDate,
        term: selectedTerm,
        country: selectedCountry,
        school: selectedSchool,
        teacher: selectedTeacher
      };
      
      setAssessmentRecords([...assessmentRecords, newRecord]);
      
      // Clear temp data for this outcome
      const newTemp = { ...tempAssessments };
      delete newTemp[outcomeCode];
      setTempAssessments(newTemp);
      
      const newComments = { ...tempComments };
      delete newComments[outcomeCode];
      setTempComments(newComments);
    }
  };

  // Generate reports
  const generateLearnerReport = (learnerName) => {
    return assessmentRecords.filter(r => r.learner === learnerName);
  };

  const generateStrandReport = (strand) => {
    const outcomes = assessmentData[selectedSubject].filter(o => o.strand === strand);
    return outcomes.map(outcome => {
      const learnerAssessments = {};
      sampleLearners.forEach(learner => {
        const record = assessmentRecords.find(r => 
          r.learner === learner && r.code === outcome.code && r.subject === selectedSubject
        );
        learnerAssessments[learner] = record?.rating || '-';
      });
      return { outcome, learnerAssessments };
    });
  };

  const subjectNames = {
    language_arts: 'Language Arts',
    mathematics: 'Mathematics',
    science: 'Science',
    social_studies: 'Social Studies'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-2">OHPC Kindergarten Assessment System</h1>
          <p className="text-gray-600">Digital assessment tracking and reporting for kindergarten educators</p>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('data-entry')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                currentView === 'data-entry'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Data Entry
            </button>
            <button
              onClick={() => setCurrentView('learner-reports')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                currentView === 'learner-reports'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Learner Reports
            </button>
            <button
              onClick={() => setCurrentView('strand-reports')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                currentView === 'strand-reports'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Strand Reports
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                currentView === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Data Entry View */}
        {currentView === 'data-entry' && (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Assessment Session Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {schools.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {terms.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedStrand('all');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {Object.keys(assessmentData).map(key => (
                      <option key={key} value={key}>{subjectNames[key]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Learner Selection and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Learner</label>
                  <select
                    value={selectedLearner}
                    onChange={(e) => setSelectedLearner(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {sampleLearners.map(learner => (
                      <option key={learner} value={learner}>{learner}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Strand</label>
                  <select
                    value={selectedStrand}
                    onChange={(e) => setSelectedStrand(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {currentStrands.map(strand => (
                      <option key={strand} value={strand}>
                        {strand === 'all' ? 'All Strands' : strand}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Outcomes</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by code or description..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Assessment Legend */}
              <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Assessment Scale:</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full font-bold">+</span>
                    <span className="text-sm">Easily meeting the outcome</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full font-bold">=</span>
                    <span className="text-sm">Meeting the outcome</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-white px-3 py-1 rounded-full font-bold">x</span>
                    <span className="text-sm">Needs more practice</span>
                  </div>
                </div>
              </div>

              {/* Outcomes List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredOutcomes.map(outcome => {
                  const existingRecord = assessmentRecords.find(r => 
                    r.learner === selectedLearner && 
                    r.code === outcome.code && 
                    r.subject === selectedSubject
                  );
                  
                  return (
                    <div key={outcome.code} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {outcome.code}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">{outcome.strand}</p>
                          <p className="text-gray-800">{outcome.description}</p>
                          
                          {existingRecord ? (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full font-bold text-white ${
                                  existingRecord.rating === '+' ? 'bg-green-500' :
                                  existingRecord.rating === '=' ? 'bg-blue-500' : 'bg-amber-500'
                                }`}>
                                  {existingRecord.rating}
                                </span>
                                <span className="text-sm text-gray-600">
                                  Assessed on {existingRecord.date}
                                </span>
                              </div>
                              {existingRecord.comment && (
                                <p className="text-sm text-gray-700 mt-2">{existingRecord.comment}</p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setTempAssessments({...tempAssessments, [outcome.code]: '+'})}
                                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                    tempAssessments[outcome.code] === '+' 
                                      ? 'bg-green-500 text-white shadow-md' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => setTempAssessments({...tempAssessments, [outcome.code]: '='})}
                                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                    tempAssessments[outcome.code] === '=' 
                                      ? 'bg-blue-500 text-white shadow-md' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  =
                                </button>
                                <button
                                  onClick={() => setTempAssessments({...tempAssessments, [outcome.code]: 'x'})}
                                  className={`px-4 py-2 rounded-lg font-bold transition-all ${
                                    tempAssessments[outcome.code] === 'x' 
                                      ? 'bg-amber-500 text-white shadow-md' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  x
                                </button>
                                {tempAssessments[outcome.code] && (
                                  <button
                                    onClick={() => handleSaveAssessment(outcome.code)}
                                    className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                                  >
                                    Save
                                  </button>
                                )}
                              </div>
                              {tempAssessments[outcome.code] && (
                                <textarea
                                  value={tempComments[outcome.code] || ''}
                                  onChange={(e) => setTempComments({...tempComments, [outcome.code]: e.target.value})}
                                  placeholder="Add a comment (optional)..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                  rows="2"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Learner Reports View */}
        {currentView === 'learner-reports' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Individual Learner Reports</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Learner</label>
              <select
                value={selectedLearner}
                onChange={(e) => setSelectedLearner(e.target.value)}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {sampleLearners.map(learner => (
                  <option key={learner} value={learner}>{learner}</option>
                ))}
              </select>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Assessment Report: {selectedLearner}
              </h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>

            <div className="space-y-6">
              {Object.keys(assessmentData).map(subject => {
                const records = assessmentRecords.filter(r => 
                  r.learner === selectedLearner && r.subject === subject
                );
                
                if (records.length === 0) return null;
                
                return (
                  <div key={subject} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-indigo-900 mb-3">
                      {subjectNames[subject]}
                    </h4>
                    <div className="space-y-2">
                      {records.map(record => {
                        const outcome = assessmentData[subject].find(o => o.code === record.code);
                        return (
                          <div key={record.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                            <span className={`px-3 py-1 rounded-full font-bold text-white flex-shrink-0 ${
                              record.rating === '+' ? 'bg-green-500' :
                              record.rating === '=' ? 'bg-blue-500' : 'bg-amber-500'
                            }`}>
                              {record.rating}
                            </span>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">
                                {record.code} - {outcome?.description}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">{outcome?.strand}</p>
                              {record.comment && (
                                <p className="text-sm text-gray-700 mt-2 italic">"{record.comment}"</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {record.date} • {record.term}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strand Reports View */}
        {currentView === 'strand-reports' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Strand Reports (Planning View)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {Object.keys(assessmentData).map(key => (
                    <option key={key} value={key}>{subjectNames[key]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Strand</label>
                <select
                  value={selectedStrand}
                  onChange={(e) => setSelectedStrand(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {currentStrands.filter(s => s !== 'all').map(strand => (
                    <option key={strand} value={strand}>{strand}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedStrand}
              </h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-indigo-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">
                      Outcome
                    </th>
                    {sampleLearners.slice(0, 5).map(learner => (
                      <th key={learner} className="border border-gray-300 px-4 py-2 text-center font-semibold text-gray-800">
                        {learner.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOutcomes.map(outcome => (
                    <tr key={outcome.code} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <span className="font-semibold text-indigo-900">{outcome.code}</span>
                          <p className="text-sm text-gray-700 mt-1">{outcome.description}</p>
                        </div>
                      </td>
                      {sampleLearners.slice(0, 5).map(learner => {
                        const record = assessmentRecords.find(r => 
                          r.learner === learner && 
                          r.code === outcome.code && 
                          r.subject === selectedSubject
                        );
                        return (
                          <td key={learner} className="border border-gray-300 px-4 py-2 text-center">
                            {record ? (
                              <span className={`inline-block px-3 py-1 rounded-full font-bold text-white ${
                                record.rating === '+' ? 'bg-green-500' :
                                record.rating === '=' ? 'bg-blue-500' : 'bg-amber-500'
                              }`}>
                                {record.rating}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Planning Insights:</h4>
              <p className="text-sm text-gray-700">
                This view helps you identify which outcomes need reinforcement across your class. 
                Students marked with 'x' may benefit from additional practice or small group instruction.
              </p>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Exceeding Expectations</h3>
                <p className="text-4xl font-bold text-green-700">
                  {assessmentRecords.filter(r => r.rating === '+').length}
                </p>
                <p className="text-sm text-green-700 mt-2">assessments</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Meeting Expectations</h3>
                <p className="text-4xl font-bold text-blue-700">
                  {assessmentRecords.filter(r => r.rating === '=').length}
                </p>
                <p className="text-sm text-blue-700 mt-2">assessments</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Needs Practice</h3>
                <p className="text-4xl font-bold text-amber-700">
                  {assessmentRecords.filter(r => r.rating === 'x').length}
                </p>
                <p className="text-sm text-amber-700 mt-2">assessments</p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment Progress by Subject</h3>
              <div className="space-y-4">
                {Object.keys(assessmentData).map(subject => {
                  const totalOutcomes = assessmentData[subject].length;
                  const assessedOutcomes = new Set(
                    assessmentRecords
                      .filter(r => r.subject === subject)
                      .map(r => r.code)
                  ).size;
                  const percentage = totalOutcomes > 0 ? Math.round((assessedOutcomes / totalOutcomes) * 100) : 0;
                  
                  return (
                    <div key={subject}>
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold text-gray-800">{subjectNames[subject]}</span>
                        <span className="text-gray-600">{assessedOutcomes} / {totalOutcomes} outcomes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Country-Level Data Tracking</h3>
              <p className="text-gray-700 mb-2">
                This system tracks assessments by country ({selectedCountry}), enabling:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Regional curriculum effectiveness analysis</li>
                <li>Professional development needs identification</li>
                <li>Cross-country comparison of learning outcomes</li>
                <li>Data-driven curriculum revision decisions</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KindergartenAssessment;