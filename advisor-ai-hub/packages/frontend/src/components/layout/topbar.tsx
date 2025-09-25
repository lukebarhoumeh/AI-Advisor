'use client'

import Link from 'next/link'
import { Menu, Bell, Moon, Sun, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore, useBusinessStore, useUIStore } from '@/store'
import { UserRole } from '@advisor-ai/shared'
import { getInitials } from '@advisor-ai/shared'
import { apiClient } from '@/services/api'

export function TopBar() {
  const { user } = useAuthStore()
  const { currentBusiness, businesses, setCurrentBusiness } = useBusinessStore()
  const { theme, setTheme, setSidebarOpen } = useUIStore()

  if (!user) return null

  const userInitials = getInitials(user.firstName, user.lastName)

  return (
    <div className="sticky top-0 z-40 lg:mx-0 lg:hidden">
      <div className="flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 lg:shadow-none dark:bg-gray-900 dark:border-gray-800">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-200"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center gap-x-4">
              {/* Business Selector */}
              {user.role === UserRole.ADVISOR && businesses.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      {currentBusiness?.name || 'Select Business'}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Select Business</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {businesses.map((business) => (
                      <DropdownMenuItem
                        key={business.id}
                        onClick={() => setCurrentBusiness(business)}
                        className="cursor-pointer"
                      >
                        {business.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                <span className="sr-only">View notifications</span>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {userInitials}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/billing">Billing</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await apiClient.logout()
                      window.location.href = '/login'
                    }}
                    className="cursor-pointer"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
