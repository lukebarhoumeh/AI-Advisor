'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/services/api'
import { useAuthStore, useBusinessStore } from '@/store'
import { UserRole, formatDate } from '@advisor-ai/shared'
import { Building, Users, TrendingUp, Clock, Search, Plus, ArrowRight, Mail, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ClientsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { setCurrentBusiness } = useBusinessStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Only allow advisors
  if (user?.role !== UserRole.ADVISOR) {
    router.push('/dashboard')
    return null
  }

  const { data: clients, refetch } = useQuery({
    queryKey: ['advisor-clients'],
    queryFn: async () => {
      const response = await apiClient.getBusinesses()
      return response.data || []
    },
  })

  const { data: advisorStats } = useQuery({
    queryKey: ['advisor-stats'],
    queryFn: async () => {
      // This would typically come from a dedicated endpoint
      return {
        totalClients: clients?.length || 0,
        activeClients: clients?.filter((c: any) => c.subscription?.status === 'active').length || 0,
        monthlyRevenue: (clients?.length || 0) * 50, // Mock calculation
        aiUsageThisMonth: Math.floor(Math.random() * 1000),
      }
    },
    enabled: !!clients,
  })

  const switchToClient = (business: any) => {
    setCurrentBusiness(business)
    router.push('/dashboard')
  }

  const filteredClients = clients?.filter((client: any) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.owner?.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage your SMB clients and track their progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advisorStats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              {advisorStats?.activeClients || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${advisorStats?.monthlyRevenue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recurring revenue share
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Usage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advisorStats?.aiUsageThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Generations this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Client Value</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${advisorStats?.totalClients ? Math.round(advisorStats.monthlyRevenue / advisorStats.totalClients) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per client/month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Invite New Client</CardTitle>
              <CardDescription>
                Send an invitation to a new SMB client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Business Name</Label>
                  <Input id="clientName" placeholder="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input id="contactName" placeholder="John Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@acme.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button>
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filteredClients && filteredClients.length > 0 ? (
            filteredClients.map((client: any) => (
              <Card
                key={client.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => switchToClient(client)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <CardDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {client.owner?.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        'inline-flex px-2 py-1 rounded-full text-xs font-medium',
                        client.subscription?.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      )}>
                        {client.subscription?.tier.replace(/_/g, ' ') || 'Free Trial'}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Added {formatDate(client.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">AI Usage</p>
                        <p className="font-medium">
                          {client.moduleUsage?.reduce((sum: number, m: any) => sum + m.monthlyUsage, 0) || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Industry</p>
                        <p className="font-medium">{client.industry || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue Share</p>
                        <p className="font-medium">$50/mo</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Manage
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {searchQuery
                    ? 'No clients found matching your search'
                    : 'No clients yet. Start by adding your first SMB client.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Advisor Resources</CardTitle>
          <CardDescription>
            Tools and resources to help you serve your clients better
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">Client Onboarding Guide</p>
                <p className="text-sm text-muted-foreground">
                  Step-by-step process for new clients
                </p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">Best Practices</p>
                <p className="text-sm text-muted-foreground">
                  AI prompting tips and tricks
                </p>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="text-left">
                <p className="font-medium">Revenue Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Track your earnings and growth
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
