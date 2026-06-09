"use client"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  type TooltipProps,
} from "recharts"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

// Cores padrão para gráficos
const DEFAULT_COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#06B6D4", // cyan-500
  "#F97316", // orange-500
]

// Componente de tooltip personalizado
const CustomTooltip = ({
  active,
  payload,
  label,
  formatter,
}: TooltipProps & { formatter?: (value: number) => string }) => {
  if (active && payload && payload.length) {
    return (
      <Card className="p-2 shadow-lg border border-gray-200 bg-white">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value as number) : entry.value}
          </p>
        ))}
      </Card>
    )
  }

  return null
}

// Gráfico de barras
interface BarChartProps {
  data: any[]
  xField: string
  yField: string
  yFormat?: (value: number) => string
  colors?: string[]
}

export function BarChart({ data, xField, yField, yFormat, colors = DEFAULT_COLORS }: BarChartProps) {
  const formatYAxis = (value: number) => {
    if (yFormat) return yFormat(value)
    return value.toString()
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xField} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip formatter={yFormat || ((value) => value.toString())} />} />
        <Bar dataKey={yField} fill={colors[0]} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

// Gráfico de linha
interface LineChartProps {
  data: any[]
  xField: string
  yField: string
  yFormat?: (value: number) => string
  color?: string
}

export function LineChart({ data, xField, yField, yFormat, color = DEFAULT_COLORS[0] }: LineChartProps) {
  const formatYAxis = (value: number) => {
    if (yFormat) return yFormat(value)
    return value.toString()
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={xField} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip formatter={yFormat || ((value) => value.toString())} />} />
        <Line
          type="monotone"
          dataKey={yField}
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4, strokeWidth: 2 }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

// Gráfico de pizza
interface PieChartProps {
  data: any[]
  nameKey: string
  dataKey: string
  colors?: string[]
}

export function PieChart({ data, nameKey, dataKey, colors = DEFAULT_COLORS }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey={dataKey}
          nameKey={nameKey}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

// Gráfico de donut
interface DonutChartProps {
  data: any[]
  nameKey: string
  dataKey: string
  colors?: string[]
}

export function DonutChart({ data, nameKey, dataKey, colors = DEFAULT_COLORS }: DonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey={dataKey}
          nameKey={nameKey}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}
