import { useState } from 'react';
import {
  BookOpen, Users, ClipboardList, BarChart3,
  ArrowRight, CheckCircle, X, Lightbulb
} from 'lucide-react';

const steps = [
  {
    icon: Users,
    title: 'Select Your Context',
    description: 'Choose your country, school, and academic term from the dropdowns at the top of the page.',
    color: 'blue'
  },
  {
    icon: BookOpen,
    title: 'Choose a Student & Subject',
    description: 'Select a student from your class and pick a subject area to assess.',
    color: 'green'
  },
  {
    icon: ClipboardList,
    title: 'Record Assessments',
    description: 'Rate each learning outcome using + (Easily Meeting), = (Meeting), or x (Needs Practice). Add optional comments.',
    color: 'purple'
  },
  {
    icon: BarChart3,
    title: 'Track Progress',
    description: 'View student reports and analytics to monitor progress over time.',
    color: 'amber'
  }
];

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  amber: 'bg-amber-100 text-amber-600'
};

export default function TeacherWelcome({ onDismiss, userName }) {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome{userName ? `, ${userName}` : ''}!
            </h2>
            <p className="text-sm text-gray-600">
              Here's how to get started with the assessment system
            </p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 p-1"
          aria-label="Dismiss welcome guide"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`text-left p-4 rounded-lg border-2 transition-all ${
                isActive
                  ? 'border-indigo-500 bg-white shadow-md'
                  : isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[step.color]}`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <IconComponent className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-500">Step {index + 1}</span>
              </div>
              <h3 className={`font-medium mb-1 ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                {step.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {step.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Current step detail */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[steps[currentStep].color]}`}>
            {(() => {
              const IconComponent = steps[currentStep].icon;
              return <IconComponent className="w-6 h-6" />;
            })()}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600 text-sm mb-3">
              {steps[currentStep].description}
            </p>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Previous
                </button>
              )}
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onDismiss}
                  className="flex items-center gap-1 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick tip */}
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
        <span className="font-medium">Pro tip:</span>
        <span>Your selections are saved automatically, so you can continue where you left off.</span>
      </div>
    </div>
  );
}
