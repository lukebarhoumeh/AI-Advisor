'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/services/api'
import { ModuleType } from '@advisor-ai/shared'
import { formatDate } from '@advisor-ai/shared'
import { Megaphone, Settings, Headphones, ShieldCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const moduleIcons = {
  [ModuleType.MARKETING]: Megaphone,
  [ModuleType.OPERATIONS]: Settings,
  [ModuleType.CUSTOMER_SUPPORT]: Headphones,
  [ModuleType.COMPLIANCE]: ShieldCheck,
}

const moduleColors = {
  [ModuleType.MARKETING]: 'text-pink-600 bg-pink-100',
  [ModuleType.OPERATIONS]: 'text-teal-600 bg-teal-100',
  [ModuleType.CUSTOMER_SUPPORT]: 'text-blue-600 bg-blue-100',
  [ModuleType.COMPLIANCE]: 'text-green-600 bg-green-100',
}

interface RecentActivityProps {
  businessId?: string
}

export function RecentActivity({ businessId }: RecentActivityProps) {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['aiHistory', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.getAIHistory(businessId)
      return response.data || []
    },
    enabled: !!businessId,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Your latest AI generations and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => {
              const Icon = moduleIcons[activity.moduleType as ModuleType]
              const colorClass = moduleColors[activity.moduleType as ModuleType]

              return (
                <div key={activity.id} className="flex items-start gap-4">
                  <div className={cn('p-2 rounded-lg', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.prompt}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <time dateTime={activity.createdAt}>
                        {formatDate(activity.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start using AI modules to see your activity here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
