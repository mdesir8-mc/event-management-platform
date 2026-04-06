'use client'

import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

interface PieChartProps {
  data: Array<{ name: string; value: number }>
  title?: string
}

export default function PieChart({ data, title }: PieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-stone-400 text-sm">
        No data available
      </div>
    )
  }

  return (
    <div>
      {title && <h3 className="text-sm font-medium text-stone-700 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
