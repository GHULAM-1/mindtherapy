"use client"

import { useState } from "react"
import {
  FileText,
  Download,
  Calendar,
  Users,
  BarChart3,
  Search,
  Eye,
  Share2,
  Printer,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

interface ReportData {
  id: string
  title: string
  type: "progress" | "session" | "comparative" | "summary"
  description: string
  dateRange: string
  generatedAt: Date
  status: "ready" | "generating" | "scheduled"
  size: string
  patients: string[]
}

interface ReportsProps {
  patients: Array<{
    id: string
    name: string
    progressScore: number
    totalSessions: number
  }>
}

export function ReportsSection({ patients }: ReportsProps) {
  const [selectedReportType, setSelectedReportType] = useState<
    "all" | "progress" | "session" | "comparative" | "summary"
  >("all")
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateReport, setShowCreateReport] = useState(false)

  const [reports] = useState<ReportData[]>([
    {
      id: "1",
      title: "Relatório Mensal de Progresso - Janeiro 2025",
      type: "progress",
      description: "Análise detalhada do progresso de todos os pacientes durante o mês de Janeiro",
      dateRange: "01/01/2025 - 31/01/2025",
      generatedAt: new Date("2025-01-27T10:30:00"),
      status: "ready",
      size: "2.4 MB",
      patients: ["Sofia Mendes", "Miguel Santos", "Ana Costa"],
    },
    {
      id: "2",
      title: "Análise de Sessões - Última Semana",
      type: "session",
      description: "Relatório detalhado das sessões realizadas na última semana",
      dateRange: "20/01/2025 - 27/01/2025",
      generatedAt: new Date("2025-01-27T09:15:00"),
      status: "ready",
      size: "1.8 MB",
      patients: ["Sofia Mendes", "Miguel Santos"],
    },
    {
      id: "3",
      title: "Comparativo Trimestral Q4 2024",
      type: "comparative",
      description: "Comparação de desempenho entre pacientes no último trimestre",
      dateRange: "01/10/2024 - 31/12/2024",
      generatedAt: new Date("2025-01-15T14:20:00"),
      status: "ready",
      size: "3.1 MB",
      patients: ["Sofia Mendes", "Miguel Santos", "Ana Costa"],
    },
    {
      id: "4",
      title: "Resumo Executivo - Janeiro 2025",
      type: "summary",
      description: "Resumo executivo com métricas principais e insights",
      dateRange: "01/01/2025 - 27/01/2025",
      generatedAt: new Date("2025-01-27T16:45:00"),
      status: "generating",
      size: "Calculando...",
      patients: ["Todos os pacientes"],
    },
  ])

  // Sample data for charts
  const progressData = [
    { month: "Out", sofia: 65, miguel: 70, ana: 35 },
    { month: "Nov", sofia: 70, miguel: 75, ana: 40 },
    { month: "Dez", sofia: 75, miguel: 80, ana: 42 },
    { month: "Jan", sofia: 78, miguel: 85, ana: 45 },
  ]

  const sessionData = [
    { week: "Sem 1", sessions: 12, avgScore: 78 },
    { week: "Sem 2", sessions: 15, avgScore: 82 },
    { week: "Sem 3", sessions: 18, avgScore: 85 },
    { week: "Sem 4", sessions: 14, avgScore: 83 },
  ]

  const filteredReports = reports.filter((report) => {
    const matchesType = selectedReportType === "all" || report.type === selectedReportType
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "progress":
        return "Progresso"
      case "session":
        return "Sessões"
      case "comparative":
        return "Comparativo"
      case "summary":
        return "Resumo"
      default:
        return type
    }
  }

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case "progress":
        return "bg-purple-100 text-purple-800"
      case "session":
        return "bg-blue-100 text-blue-800"
      case "comparative":
        return "bg-green-100 text-green-800"
      case "summary":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "generating":
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case "scheduled":
        return <Calendar className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const handleCreateReport = () => {
    // Logic to create new report would go here
    setShowCreateReport(false)
  }

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h2>
          <p className="text-gray-600">Gere e visualize relatórios detalhados sobre o progresso e atividades.</p>
        </div>
        <button
          onClick={() => setShowCreateReport(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Criar Relatório
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Relatórios Gerados</p>
              <p className="text-2xl font-bold text-gray-900">{reports.filter((r) => r.status === "ready").length}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Processamento</p>
              <p className="text-2xl font-bold text-yellow-600">
                {reports.filter((r) => r.status === "generating").length}
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pessoas Incluídas</p>
              <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dados Analisados</p>
              <p className="text-2xl font-bold text-green-600">1.2k</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Visualization Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Progress Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendências de Progresso</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="sofia" stroke="#8B5CF6" strokeWidth={2} name="Sofia" />
                <Line type="monotone" dataKey="miguel" stroke="#06B6D4" strokeWidth={2} name="Miguel" />
                <Line type="monotone" dataKey="ana" stroke="#10B981" strokeWidth={2} name="Ana" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Análise de Sessões</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="sessions" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Sessões" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Relatórios Disponíveis</h3>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Procurar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as "all" | "progress" | "session" | "comparative" | "summary")}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="all">Todos os Tipos</option>
                <option value="progress">Progresso</option>
                <option value="session">Sessões</option>
                <option value="comparative">Comparativo</option>
                <option value="summary">Resumo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredReports.map((report) => (
            <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{report.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                      {getReportTypeLabel(report.type)}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(report.status)}
                      <span className="text-xs text-gray-500 capitalize">
                        {report.status === "ready" ? "Pronto" : report.status === "generating" ? "Gerando" : "Agendado"}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {report.dateRange}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Gerado em {report.generatedAt.toLocaleDateString("pt-PT")}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {report.size}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {report.patients.length} pessoa{report.patients.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Visualizar"
                    disabled={report.status !== "ready"}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Descarregar"
                    disabled={report.status !== "ready"}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Partilhar"
                    disabled={report.status !== "ready"}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Imprimir"
                    disabled={report.status !== "ready"}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório encontrado</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? "Tente ajustar os critérios de pesquisa." : "Comece por criar o seu primeiro relatório."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateReport(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Criar Primeiro Relatório
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Report Modal */}
      {showCreateReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Criar Novo Relatório</h3>
              <p className="text-gray-600 mt-1">Configure os parâmetros do seu relatório personalizado</p>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="progress">Relatório de Progresso</option>
                  <option value="session">Análise de Sessões</option>
                  <option value="comparative">Relatório Comparativo</option>
                  <option value="summary">Resumo Executivo</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Início</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Fim</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pessoas a Incluir</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {patients.map((patient) => (
                    <label key={patient.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPatients.includes(patient.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPatients([...selectedPatients, patient.id])
                          } else {
                            setSelectedPatients(selectedPatients.filter((id) => id !== patient.id))
                          }
                        }}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{patient.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Exportação</label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      className="text-purple-600 focus:ring-purple-500"
                      defaultChecked
                    />
                    <span className="text-sm font-medium">PDF</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="format" value="excel" className="text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm font-medium">Excel</span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="format" value="csv" className="text-purple-600 focus:ring-purple-500" />
                    <span className="text-sm font-medium">CSV</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observações (Opcional)</label>
                <textarea
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Adicione observações ou instruções específicas para o relatório..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-4">
              <button
                onClick={() => setShowCreateReport(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateReport}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
