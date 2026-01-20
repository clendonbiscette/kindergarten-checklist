import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_DURATION = 4000 // 4 seconds default

const toastStyles = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    text: 'text-green-800',
    progress: 'bg-green-500',
    Icon: CheckCircle
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    text: 'text-red-800',
    progress: 'bg-red-500',
    Icon: AlertCircle
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    text: 'text-amber-800',
    progress: 'bg-amber-500',
    Icon: AlertTriangle
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    text: 'text-blue-800',
    progress: 'bg-blue-500',
    Icon: Info
  }
}

function Toast({ toast, onDismiss }) {
  const style = toastStyles[toast.type] || toastStyles.info
  const IconComponent = style.Icon

  return (
    <div
      className={`${style.bg} border rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px] max-w-[480px] relative overflow-hidden animate-slide-in`}
      role="alert"
      aria-live="polite"
    >
      <IconComponent className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {toast.title && (
          <p className={`font-semibold ${style.text}`}>{toast.title}</p>
        )}
        <p className={`${style.text} ${toast.title ? 'text-sm' : ''}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`${style.text} hover:opacity-70 p-1 -m-1`}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-1 ${style.progress} animate-shrink`}
        style={{ animationDuration: `${toast.duration || TOAST_DURATION}ms` }}
      />
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random()
    const toast = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      duration: options.duration || TOAST_DURATION
    }

    setToasts(prev => [...prev, toast])

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, toast.duration)

    return id
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Convenience methods
  const success = useCallback((message, title) => {
    return addToast({ type: 'success', message, title })
  }, [addToast])

  const error = useCallback((message, title) => {
    return addToast({ type: 'error', message, title })
  }, [addToast])

  const warning = useCallback((message, title) => {
    return addToast({ type: 'warning', message, title })
  }, [addToast])

  const info = useCallback((message, title) => {
    return addToast({ type: 'info', message, title })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast, dismissToast, success, error, warning, info }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        aria-label="Notifications"
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
