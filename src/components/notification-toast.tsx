"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface ToastNotification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationToastProps {
  notifications: ToastNotification[]
  onRemove: (id: string) => void
}

export function NotificationToast({ notifications, onRemove }: NotificationToastProps) {
  const getToastIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getToastStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "info":
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
          getToastIcon={getToastIcon}
          getToastStyles={getToastStyles}
        />
      ))}
    </div>
  )
}

function ToastItem({
  notification,
  onRemove,
  getToastIcon,
  getToastStyles,
}: {
  notification: ToastNotification
  onRemove: (id: string) => void
  getToastIcon: (type: string) => JSX.Element
  getToastStyles: (type: string) => string
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)

    // Auto remove after duration
    if (notification.duration) {
      const removeTimer = setTimeout(() => {
        handleRemove()
      }, notification.duration)

      return () => {
        clearTimeout(timer)
        clearTimeout(removeTimer)
      }
    }

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification.duration, notification.id])

  const handleRemove = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(notification.id), 300)
  }

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div className={`p-4 rounded-lg border shadow-lg ${getToastStyles(notification.type)}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{getToastIcon(notification.type)}</div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>

            {notification.action && (
              <button
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                {notification.action.label}
              </button>
            )}
          </div>

          <button onClick={handleRemove} className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
