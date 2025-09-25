'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/services/api'
import { useBusinessStore } from '@/store'
import { ModuleType } from '@advisor-ai/shared'
import { Megaphone, Copy, Download, Save, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const contentTypes = [
  { value: 'ad_copy', label: 'Ad Copy', icon: '📢' },
  { value: 'social_post', label: 'Social Post', icon: '📱' },
  { value: 'email_campaign', label: 'Email Campaign', icon: '📧' },
]

const platforms = [
  { value: 'general', label: 'General' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google', label: 'Google Ads' },
]

const tones = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'humorous', label: 'Humorous' },
]

export default function MarketingPage() {
  const { currentBusiness } = useBusinessStore()
  const [contentType, setContentType] = useState('ad_copy')
  const [formData, setFormData] = useState({
    product: '',
    platform: 'general',
    tone: 'professional',
    targetAudience: '',
    keywords: '',
    instructions: '',
  })
  const [generatedContent, setGeneratedContent] = useState('')

  // Fetch templates
  const { data: templates } = useQuery({
    queryKey: ['marketingTemplates'],
    queryFn: async () => {
      const response = await apiClient.getAITemplates(ModuleType.MARKETING)
      return response.data
    },
  })

  // Generate content mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!currentBusiness) throw new Error('No business selected')
      
      const response = await apiClient.generateAI(currentBusiness.id, {
        moduleType: ModuleType.MARKETING,
        prompt: `Generate ${contentType.replace('_', ' ')} for ${formData.product}`,
        context: {
          type: contentType,
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        },
      })
      
      return response.data
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content)
    },
  })

  const handleGenerate = () => {
    generateMutation.mutate()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent)
    // You could add a toast notification here
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl">
          <Megaphone className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketing Advisor</h1>
          <p className="text-muted-foreground mt-1">
            Generate compelling marketing content with AI
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Generator</CardTitle>
              <CardDescription>
                Fill in the details to generate customized marketing content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div className="space-y-2">
                <Label>Content Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {contentTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setContentType(type.value)}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all',
                        contentType === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <div className="text-2xl mb-1">{type.icon}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product/Service */}
              <div className="space-y-2">
                <Label htmlFor="product">Product/Service Name</Label>
                <Input
                  id="product"
                  placeholder="e.g., Premium Coffee Subscription"
                  value={formData.product}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                />
              </div>

              {/* Platform */}
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ ...formData, platform: value })}
                >
                  <SelectTrigger id="platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <Label htmlFor="tone">Tone of Voice</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) => setFormData({ ...formData, tone: value })}
                >
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tones.map((tone) => (
                      <SelectItem key={tone.value} value={tone.value}>
                        {tone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Young professionals, 25-35 years old"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., organic, sustainable, artisan"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>

              {/* Additional Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Additional Instructions</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific requirements or details..."
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!formData.product || generateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
              <CardDescription>
                Start with a pre-configured template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start">
                  Product Launch Announcement
                </Button>
                <Button variant="outline" className="justify-start">
                  Limited Time Offer
                </Button>
                <Button variant="outline" className="justify-start">
                  Customer Testimonial
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output Section */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Content</CardTitle>
                  <CardDescription>
                    Your AI-generated marketing content appears here
                  </CardDescription>
                </div>
                {generatedContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                      {generatedContent}
                    </div>
                  </div>
                  
                  {/* Variations */}
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        Make it shorter
                      </Button>
                      <Button variant="outline" size="sm">
                        Make it longer
                      </Button>
                      <Button variant="outline" size="sm">
                        Change tone
                      </Button>
                      <Button variant="outline" size="sm">
                        Add emoji
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Generated content will appear here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fill in the form and click generate to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
