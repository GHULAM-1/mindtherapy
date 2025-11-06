"use client"

import { useState } from "react"
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, Settings } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionRequired?: boolean
  patientId?: string
  patientName?: string
  category: "progress" | "session" | "system" | "reminder" | "achievement"
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (id: string) => void
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<"all" | "unread" | "progress" | "session" | "system">("all")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">("newest")

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "progress":
        return "bg-purple-100 text-purple-800"
      case "session":
        return "bg-blue-100 text-blue-800"
      case "system":
        return "bg-gray-100 text-gray-800"
      case "reminder":
        return "bg-yellow-100 text-yellow-800"
      case "achievement":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredNotifications = notifications
    .filter((notification) => {
      if (filter === "all") return true
      if (filter === "unread") return !notification.read
      return notification.category === filter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        case "priority":
          const priorityOrder = { error: 3, warning: 2, info: 1, success: 0 }
          return priorityOrder[b.type] - priorityOrder[a.type]
        default:
          return 0
      }
    })

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora mesmo"
    if (diffInMinutes < 60) return `há ${diffInMinutes}m`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `há ${diffInHours}h`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `há ${diffInDays}d`

    return date.toLocaleDateString("pt-PT")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Notificações</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Filters and Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as "all" | "unread" | "progress" | "session" | "system")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">Todas</option>
                <option value="unread">Não lidas</option>
                <option value="progress">Progresso</option>
                <option value="session">Sessões</option>
                <option value="system">Sistema</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "priority")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigas</option>
                <option value="priority">Prioridade</option>
              </select>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
              >
                <Check className="w-4 h-4" />
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sem notificações</h3>
              <p className="text-gray-600">
                {filter === "unread" ? "Todas as notificações foram lidas!" : "Não há notificações para mostrar."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? "bg-purple-50/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-medium ${!notification.read ? "text-gray-900" : "text-gray-700"}`}
                          >
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                                notification.category,
                              )}`}
                            >
                              {notification.category === "progress" && "Progresso"}
                              {notification.category === "session" && "Sessão"}
                              {notification.category === "system" && "Sistema"}
                              {notification.category === "reminder" && "Lembrete"}
                              {notification.category === "achievement" && "Conquista"}
                            </span>
                            <span className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp)}</span>
                            {notification.patientName && (
                              <span className="text-xs text-gray-500">• {notification.patientName}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => onMarkAsRead(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Marcar como lida"
                            >
                              <Check className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Eliminar notificação"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>

                      {notification.actionRequired && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <button className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors">
                            Ver Detalhes
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm">
            <Settings className="w-4 h-4" />
            Definições de Notificações
          </button>
        </div>
      </div>
    </div>
  )
}
