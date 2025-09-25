'use client'

import { useQuery } from '@tanstack/react-query'
import { ModuleCard } from '@/components/modules/module-card'
import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { apiClient } from '@/services/api'
import { useBusinessStore } from '@/store'
import { MODULE_INFO, ModuleType } from '@advisor-ai/shared'
import { TrendingUp, FileText, Users, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const { currentBusiness } = useBusinessStore()

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['businessStats', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) return null
      const response = await apiClient.getBusinessStats(currentBusiness.id)
      return response.data
    },
    enabled: !!currentBusiness,
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your AI-powered business tools.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="AI Generations"
          value={stats?.totalAiGenerations || 0}
          description="Total AI content generated"
          icon={TrendingUp}
          trend="+12.5%"
        />
        <StatsCard
          title="Active Templates"
          value={stats?.templateCount || 0}
          description="Saved workflow templates"
          icon={FileText}
        />
        <StatsCard
          title="Integrations"
          value={stats?.activeIntegrations || 0}
          description="Connected services"
          icon={Users}
        />
        <StatsCard
          title="This Month"
          value={stats?.currentMonthUsage || 0}
          description="AI generations this month"
          icon={CheckCircle}
          trend="+8.2%"
        />
      </div>

      {/* AI Modules Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-6">AI Advisors</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(MODULE_INFO).map(([key, module]) => (
            <ModuleCard
              key={key}
              module={{
                type: key as ModuleType,
                ...module,
              }}
              usage={currentBusiness?.moduleUsage?.find(
                (m) => m.moduleType === key
              )}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity businessId={currentBusiness?.id} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

function QuickActions() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors">
          <p className="font-medium">Generate Marketing Content</p>
          <p className="text-sm text-muted-foreground">Create ad copy or social posts</p>
        </button>
        <button className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors">
          <p className="font-medium">Schedule Appointment</p>
          <p className="text-sm text-muted-foreground">Set up customer meetings</p>
        </button>
        <button className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors">
          <p className="font-medium">Run Compliance Check</p>
          <p className="text-sm text-muted-foreground">Review regulatory requirements</p>
        </button>
      </div>
    </div>
  )
}
