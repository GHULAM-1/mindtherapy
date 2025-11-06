"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"

interface ProgressChartsProps {
  weeklyData: Array<{
    week: string
    sessions: number
    progress: number
    goal: number
  }>
  sessionData: Array<{
    date: string
    score: number
    duration: number
    tool: string
  }>
  overallStats: {
    totalSessions: number
    averageScore: number
    totalTime: number
    toolUsage: Array<{
      tool: string
      sessions: number
      color: string
    }>
  }
}

export function ProgressCharts({ weeklyData, sessionData, overallStats }: ProgressChartsProps) {
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}${entry.dataKey === "progress" ? "%" : entry.dataKey === "duration" ? "min" : ""}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Weekly Progress Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Progresso Semanal</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="progress"
                stroke="#8B5CF6"
                strokeWidth={2}
                fill="url(#progressGradient)"
                name="Progresso (%)"
              />
              <Area
                type="monotone"
                dataKey="sessions"
                stroke="#06B6D4"
                strokeWidth={2}
                fill="url(#sessionsGradient)"
                name="Sessões"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Session Scores Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Evolução dos Scores</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sessionData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })
                  }
                />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                <Tooltip
                  content={<CustomTooltip />}
                  labelFormatter={(value) => new Date(value).toLocaleDateString("pt-PT")}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tool Usage Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Ferramenta</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallStats.toolUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="sessions"
                >
                  {overallStats.toolUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [`${value} sessões`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {overallStats.toolUsage.map((tool, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tool.color }} />
                  <span className="text-sm text-gray-700">{tool.tool}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{tool.sessions}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session Duration Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Análise de Duração das Sessões</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sessionData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })
                }
              />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                content={<CustomTooltip />}
                labelFormatter={(value) => new Date(value).toLocaleDateString("pt-PT")}
              />
              <Bar dataKey="duration" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Duração (min)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Score Médio</p>
              <p className="text-3xl font-bold">{overallStats.averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tempo Total</p>
              <p className="text-3xl font-bold">{Math.round(overallStats.totalTime / 60)}h</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Sessões Totais</p>
              <p className="text-3xl font-bold">{overallStats.totalSessions}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
