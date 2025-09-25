'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { apiClient } from '@/services/api'
import { useAuthStore, useBusinessStore } from '@/store'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser, isAuthenticated } = useAuthStore()
  const { setBusinesses, setCurrentBusiness } = useBusinessStore()

  // Fetch current user
  const { isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data.user)
        return response.data.user
      }
      throw new Error('Failed to fetch user')
    },
    enabled: !user && isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  })

  // Fetch businesses
  const { isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const response = await apiClient.getBusinesses()
      if (response.success && response.data) {
        setBusinesses(response.data)
        // Set first business as current if none selected
        if (response.data.length > 0 && !useBusinessStore.getState().currentBusiness) {
          setCurrentBusiness(response.data[0])
        }
        return response.data
      }
      return []
    },
    enabled: !!user,
  })

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated && !isLoadingUser) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoadingUser, router])

  if (isLoadingUser || isLoadingBusinesses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
