"use client"

import { useState, useCallback, useEffect } from "react"

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

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "warning",
      title: "Atenção Necessária",
      message: "Ana Costa não tem atividade há 2 dias. Considere entrar em contacto.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      actionRequired: true,
      patientId: "3",
      patientName: "Ana Costa",
      category: "reminder",
    },
    {
      id: "2",
      type: "success",
      title: "Objetivo Alcançado!",
      message: "Sofia Mendes completou o objetivo semanal de 5 sessões.",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      read: false,
      patientId: "1",
      patientName: "Sofia Mendes",
      category: "achievement",
    },
    {
      id: "3",
      type: "info",
      title: "Relatório Disponível",
      message: "O relatório mensal de progresso está pronto para visualização.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
      category: "system",
    },
    {
      id: "4",
      type: "success",
      title: "Sessão Concluída",
      message: "Miguel Santos completou uma sessão de comunicação com score de 87%.",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      read: true,
      patientId: "2",
      patientName: "Miguel Santos",
      category: "session",
    },
    {
      id: "5",
      type: "info",
      title: "Novo Marco de Progresso",
      message: "Sofia Mendes atingiu 80% de progresso no módulo de comunicação básica.",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      read: true,
      patientId: "1",
      patientName: "Sofia Mendes",
      category: "progress",
    },
  ])

  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
    return newNotification.id
  }, [])

  const addToast = useCallback((toast: Omit<ToastNotification, "id">) => {
    const newToast: ToastNotification = {
      ...toast,
      id: Date.now().toString(),
      duration: toast.duration || 5000,
    }

    setToastNotifications((prev) => [...prev, newToast])
    return newToast.id
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const removeToast = useCallback((id: string) => {
    setToastNotifications((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly generate notifications for demo purposes
      if (Math.random() < 0.1) {
        // 10% chance every 30 seconds
        const sampleNotifications = [
          {
            type: "info" as const,
            title: "Nova Sessão Iniciada",
            message: "Uma nova sessão foi iniciada por um dos seus pacientes.",
            category: "session" as const,
          },
          {
            type: "success" as const,
            title: "Progresso Registado",
            message: "Melhoria significativa detectada no desempenho.",
            category: "progress" as const,
          },
        ]

        const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)]
        addNotification(randomNotification)

        // Also show as toast
        addToast({
          ...randomNotification,
          duration: 4000,
        })
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [addNotification, addToast])

  return {
    notifications,
    toastNotifications,
    unreadCount,
    addNotification,
    addToast,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    removeToast,
  }
}
