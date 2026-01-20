import {
  Users,
  School,
  BookOpen,
  ClipboardList,
  Calendar,
  UserPlus,
  FolderPlus,
  PlusCircle
} from 'lucide-react'

const icons = {
  students: Users,
  classes: School,
  assessments: ClipboardList,
  terms: Calendar,
  subjects: BookOpen,
  users: Users,
  default: FolderPlus
}

const defaultMessages = {
  students: {
    title: 'No students yet',
    description: 'Add students to start tracking their progress and assessments.',
    actionLabel: 'Add Student',
    actionIcon: UserPlus
  },
  classes: {
    title: 'No classes created',
    description: 'Create classes to organize your students and manage assessments.',
    actionLabel: 'Create Class',
    actionIcon: PlusCircle
  },
  assessments: {
    title: 'No assessments recorded',
    description: 'Start assessing students to track their learning progress.',
    actionLabel: 'Start Assessing',
    actionIcon: ClipboardList
  },
  terms: {
    title: 'No academic terms',
    description: 'Set up academic terms to organize assessments by time period.',
    actionLabel: 'Create Term',
    actionIcon: Calendar
  },
  users: {
    title: 'No users found',
    description: 'Create user accounts to give staff access to the platform.',
    actionLabel: 'Add User',
    actionIcon: UserPlus
  },
  search: {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
    actionLabel: null
  }
}

export default function EmptyState({
  type = 'default',
  title,
  description,
  actionLabel,
  onAction,
  icon: CustomIcon,
  className = ''
}) {
  const defaults = defaultMessages[type] || {}
  const displayTitle = title || defaults.title || 'No data available'
  const displayDescription = description || defaults.description || 'Get started by adding some data.'
  const displayActionLabel = actionLabel || defaults.actionLabel

  const IconComponent = CustomIcon || icons[type] || icons.default
  const ActionIcon = defaults.actionIcon || PlusCircle

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      {/* Icon container with subtle background */}
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <IconComponent className="w-8 h-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-sm mb-6">
        {displayDescription}
      </p>

      {/* Action button */}
      {displayActionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <ActionIcon className="w-4 h-4" />
          {displayActionLabel}
        </button>
      )}
    </div>
  )
}

// Compact variant for smaller spaces like tables
export function EmptyStateCompact({
  message = 'No data available',
  icon: CustomIcon,
  className = ''
}) {
  const IconComponent = CustomIcon || FolderPlus

  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 text-gray-500 ${className}`}>
      <IconComponent className="w-6 h-6 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// Inline variant for lists and dropdowns
export function EmptyStateInline({
  message = 'No items',
  className = ''
}) {
  return (
    <p className={`text-gray-500 text-sm italic py-2 ${className}`}>
      {message}
    </p>
  )
}
