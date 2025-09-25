import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModuleType } from '@advisor-ai/shared'
import { Megaphone, Settings, Headphones, ShieldCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const moduleIcons = {
  [ModuleType.MARKETING]: Megaphone,
  [ModuleType.OPERATIONS]: Settings,
  [ModuleType.CUSTOMER_SUPPORT]: Headphones,
  [ModuleType.COMPLIANCE]: ShieldCheck,
}

const moduleGradients = {
  [ModuleType.MARKETING]: 'from-pink-500 to-red-500',
  [ModuleType.OPERATIONS]: 'from-teal-500 to-cyan-500',
  [ModuleType.CUSTOMER_SUPPORT]: 'from-blue-500 to-sky-500',
  [ModuleType.COMPLIANCE]: 'from-green-500 to-emerald-500',
}

interface ModuleCardProps {
  module: {
    type: ModuleType
    name: string
    description: string
  }
  usage?: {
    enabled: boolean
    monthlyUsage: number
    lastUsedAt?: Date | null
  }
}

export function ModuleCard({ module, usage }: ModuleCardProps) {
  const Icon = moduleIcons[module.type]
  const gradient = moduleGradients[module.type]
  const href = `/dashboard/ai/${module.type.toLowerCase()}`

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity',
        'bg-gradient-to-br',
        gradient
      )} />
      
      <CardHeader>
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
          'bg-gradient-to-br text-white',
          gradient
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg">{module.name}</CardTitle>
        <CardDescription className="text-sm">
          {module.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {usage && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={cn(
                'font-medium',
                usage.enabled ? 'text-green-600' : 'text-gray-500'
              )}>
                {usage.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">{usage.monthlyUsage} this month</span>
            </div>
          </div>
        )}
        
        <Button asChild className="w-full group">
          <Link href={href}>
            Open Module
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
