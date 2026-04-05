'use client'

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface LineChartProps {
  data: Array<{ date: string; count: number }>
  title?: string
}

export default function LineChart({ data, title }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div>
      {title && <h3 className="text-sm font-medium text-gray-700 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
