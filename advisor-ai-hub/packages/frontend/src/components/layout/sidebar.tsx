'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore, useBusinessStore } from '@/store'
import { UserRole } from '@advisor-ai/shared'
import { apiClient } from '@/services/api'
import {
  Sparkles,
  LayoutDashboard,
  Megaphone,
  Settings,
  Headphones,
  ShieldCheck,
  Building,
  CreditCard,
  Users,
  LogOut,
  Link2,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Marketing', href: '/dashboard/ai/marketing', icon: Megaphone },
  { name: 'Operations', href: '/dashboard/ai/operations', icon: Settings },
  { name: 'Support', href: '/dashboard/ai/support', icon: Headphones },
  { name: 'Compliance', href: '/dashboard/ai/compliance', icon: ShieldCheck },
]

const adminNavigation = [
  { name: 'Businesses', href: '/dashboard/businesses', icon: Building },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

const settingsNavigation = [
  { name: 'Integrations', href: '/dashboard/integrations', icon: Link2 },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const advisorNavigation = [
  { name: 'Clients', href: '/dashboard/clients', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const { currentBusiness } = useBusinessStore()

  const handleLogout = async () => {
    await apiClient.logout()
    window.location.href = '/login'
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">AdvisorAI Hub</span>
        </div>
        
        {currentBusiness && (
          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Current Business
            </p>
            <p className="mt-1 text-sm font-medium text-white truncate">
              {currentBusiness.name}
            </p>
          </div>
        )}

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            {user?.role === UserRole.ADMIN && (
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">
                  Admin
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {adminNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            
            {user?.role === UserRole.ADVISOR && (
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">
                  Advisor Tools
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {advisorNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            )}
            
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400">
                Settings
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {settingsNavigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        pathname === item.href
                          ? 'bg-gray-800 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            <li className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full text-gray-400 hover:text-white hover:bg-gray-800 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                Sign out
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
