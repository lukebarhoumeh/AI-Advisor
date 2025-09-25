'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiClient } from '@/services/api'
import { useBusinessStore } from '@/store'
import { Mail, Calendar, DollarSign, Check, X, Loader2, Link2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const integrationTypes = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Connect your Gmail account to send emails and track conversations',
    icon: Mail,
    color: 'text-red-500 bg-red-100',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    description: 'Integrate with Microsoft Outlook for email management',
    icon: Mail,
    color: 'text-blue-500 bg-blue-100',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync appointments and manage your schedule',
    icon: Calendar,
    color: 'text-green-500 bg-green-100',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Connect your accounting system for automated invoicing',
    icon: DollarSign,
    color: 'text-purple-500 bg-purple-100',
  },
]

export default function IntegrationsPage() {
  const { currentBusiness } = useBusinessStore()
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

  const { data: integrations, refetch } = useQuery({
    queryKey: ['integrations', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness) return []
      const response = await apiClient.request('get', `/integrations/${currentBusiness.id}`)
      return response.data || []
    },
    enabled: !!currentBusiness,
  })

  const connectMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!currentBusiness) throw new Error('No business selected')
      
      // Get OAuth URL
      const response = await apiClient.request(
        'get',
        `/integrations/oauth/${type}?businessId=${currentBusiness.id}`
      )
      
      if (response.data?.url) {
        window.location.href = response.data.url
      }
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!currentBusiness) throw new Error('No business selected')
      
      const response = await apiClient.request(
        'delete',
        `/integrations/${currentBusiness.id}/${type}`
      )
      return response.data
    },
    onSuccess: () => {
      refetch()
    },
  })

  const syncMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!currentBusiness) throw new Error('No business selected')
      
      const response = await apiClient.request(
        'post',
        `/integrations/${currentBusiness.id}/${type}/sync`
      )
      return response.data
    },
  })

  const isConnected = (type: string) => {
    return integrations?.some((i: any) => i.type === type && i.enabled)
  }

  const getIntegration = (type: string) => {
    return integrations?.find((i: any) => i.type === type)
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your favorite tools to enhance your AI advisors
        </p>
      </div>

      {/* Integration Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {integrationTypes.map((integration) => {
          const connected = isConnected(integration.id)
          const integrationData = getIntegration(integration.id)
          const Icon = integration.icon

          return (
            <Card key={integration.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-lg', integration.color)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  {connected && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="h-4 w-4" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {connected ? (
                    <>
                      <div className="text-sm text-muted-foreground">
                        Last synced: {integrationData?.lastSyncAt 
                          ? new Date(integrationData.lastSyncAt).toLocaleDateString() 
                          : 'Never'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncMutation.mutate(integration.id)}
                          disabled={syncMutation.isPending}
                        >
                          {syncMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Sync Now'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Disconnect ${integration.name}?`)) {
                              disconnectMutation.mutate(integration.id)
                            }
                          }}
                          disabled={disconnectMutation.isPending}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">
                        Not connected
                      </span>
                      <Button
                        size="sm"
                        onClick={() => connectMutation.mutate(integration.id)}
                        disabled={connectMutation.isPending}
                      >
                        {connectMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="mr-2 h-4 w-4" />
                            Connect
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Connected Integrations Summary */}
      {integrations && integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Integration Activity</CardTitle>
            <CardDescription>
              Recent activity from your connected integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {syncMutation.isSuccess && syncMutation.data && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                    Sync Completed
                  </h4>
                  <pre className="text-sm text-green-800 dark:text-green-300">
                    {JSON.stringify(syncMutation.data.data, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>Integration features coming soon:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Automatic email campaign scheduling</li>
                  <li>• Calendar appointment AI suggestions</li>
                  <li>• QuickBooks invoice generation</li>
                  <li>• Unified inbox management</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
