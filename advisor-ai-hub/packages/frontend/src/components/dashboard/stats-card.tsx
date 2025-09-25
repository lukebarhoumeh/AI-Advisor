import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number | string
  description?: string
  icon?: LucideIcon
  trend?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const isPositiveTrend = trend?.startsWith('+')

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <p className={cn(
            'text-xs mt-2 font-medium',
            isPositiveTrend ? 'text-green-600' : 'text-red-600'
          )}>
            {trend} from last month
          </p>
        )}
        {/* Background decoration */}
        {Icon && (
          <Icon className="absolute -bottom-4 -right-4 h-24 w-24 text-muted opacity-10" />
        )}
      </CardContent>
    </Card>
  )
}
