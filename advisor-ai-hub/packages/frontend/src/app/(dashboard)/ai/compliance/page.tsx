'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiClient } from '@/services/api'
import { useBusinessStore } from '@/store'
import { ShieldCheck, FileText, ClipboardCheck, AlertCircle, Loader2, Download, Plus } from 'lucide-react'
import { formatDate } from '@advisor-ai/shared'
import { cn } from '@/lib/utils'

const industries = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'general', label: 'General Business' },
]

const policyTypes = [
  'Privacy Policy',
  'Terms of Service',
  'Data Protection Policy',
  'Employee Handbook',
  'Code of Conduct',
  'Information Security Policy',
  'Anti-Discrimination Policy',
  'Remote Work Policy',
]

export default function CompliancePage() {
  const { currentBusiness } = useBusinessStore()
  const [activeTab, setActiveTab] = useState('checklists')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Advisor</h1>
          <p className="text-muted-foreground mt-1">
            Industry-specific compliance checklists and policy templates
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checklists">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Checklists
          </TabsTrigger>
          <TabsTrigger value="policies">
            <FileText className="h-4 w-4 mr-2" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="audits">
            <AlertCircle className="h-4 w-4 mr-2" />
            Audits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checklists" className="space-y-6">
          <ChecklistSection businessId={currentBusiness?.id} />
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <PolicySection businessId={currentBusiness?.id} />
        </TabsContent>

        <TabsContent value="audits" className="space-y-6">
          <AuditSection businessId={currentBusiness?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChecklistSection({ businessId }: { businessId?: string }) {
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [formData, setFormData] = useState({
    industry: '',
    businessType: '',
    location: 'United States',
    area: '',
    includeRegulations: [] as string[],
  })
  const [selectedRegulations, setSelectedRegulations] = useState<string[]>([])

  const { data: templates, refetch } = useQuery({
    queryKey: ['compliance-templates', businessId, 'checklist'],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/compliance/${businessId}/templates?category=checklist`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const { data: regulations } = useQuery({
    queryKey: ['regulations', formData.industry],
    queryFn: async () => {
      if (!formData.industry) return null
      const response = await apiClient.request('get', `/modules/compliance/regulations/${formData.industry}`)
      return response.data
    },
    enabled: !!formData.industry,
  })

  const generateChecklistMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/compliance/${businessId}/checklist`, {
        ...formData,
        includeRegulations: selectedRegulations,
      })
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowGenerateForm(false)
      setFormData({
        industry: '',
        businessType: '',
        location: 'United States',
        area: '',
        includeRegulations: [],
      })
      setSelectedRegulations([])
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Compliance Checklists</h2>
        <Button onClick={() => setShowGenerateForm(!showGenerateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Checklist
        </Button>
      </div>

      {showGenerateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Compliance Checklist</CardTitle>
            <CardDescription>
              Create a customized compliance checklist for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  placeholder="e.g., B2B SaaS, Retail Store"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Compliance Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Data Privacy, Employee Safety, Financial Reporting"
              />
            </div>

            {regulations && (
              <div className="space-y-2">
                <Label>Relevant Regulations</Label>
                <div className="border rounded-lg p-4 space-y-2">
                  {regulations.regulations.map((reg: string) => (
                    <label key={reg} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedRegulations.includes(reg)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRegulations([...selectedRegulations, reg])
                          } else {
                            setSelectedRegulations(selectedRegulations.filter(r => r !== reg))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{reg}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowGenerateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => generateChecklistMutation.mutate()}
                disabled={!formData.industry || !formData.businessType || generateChecklistMutation.isPending}
              >
                {generateChecklistMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Checklist'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {templates && templates.length > 0 ? (
          templates.map((template: any) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      Generated on {formatDate(template.createdAt)}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                    {template.content.checklist}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No compliance checklists yet. Generate one to ensure your business meets regulations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function PolicySection({ businessId }: { businessId?: string }) {
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [formData, setFormData] = useState({
    policyType: '',
    industry: '',
    companySize: 'small',
    requirements: [] as string[],
  })

  const { data: policies, refetch } = useQuery({
    queryKey: ['compliance-templates', businessId, 'policy'],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/compliance/${businessId}/templates?category=policy`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const generatePolicyMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/compliance/${businessId}/policy`, formData)
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowGenerateForm(false)
      setFormData({
        policyType: '',
        industry: '',
        companySize: 'small',
        requirements: [],
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Policy Templates</h2>
        <Button onClick={() => setShowGenerateForm(!showGenerateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Policy
        </Button>
      </div>

      {showGenerateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Policy Template</CardTitle>
            <CardDescription>
              Create a customized policy document for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policyType">Policy Type</Label>
              <Select
                value={formData.policyType}
                onValueChange={(value) => setFormData({ ...formData, policyType: value })}
              >
                <SelectTrigger id="policyType">
                  <SelectValue placeholder="Select policy type" />
                </SelectTrigger>
                <SelectContent>
                  {policyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policyIndustry">Industry</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger id="policyIndustry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size</Label>
                <Select
                  value={formData.companySize}
                  onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                >
                  <SelectTrigger id="companySize">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (1-50)</SelectItem>
                    <SelectItem value="medium">Medium (51-250)</SelectItem>
                    <SelectItem value="large">Large (250+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Special Requirements (Optional)</Label>
              <Textarea
                id="requirements"
                placeholder="Any specific requirements or clauses to include..."
                onChange={(e) => setFormData({ 
                  ...formData, 
                  requirements: e.target.value.split('\n').filter(r => r.trim())
                })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowGenerateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => generatePolicyMutation.mutate()}
                disabled={!formData.policyType || !formData.industry || generatePolicyMutation.isPending}
              >
                {generatePolicyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Policy'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {policies && policies.length > 0 ? (
          policies.map((policy: any) => (
            <Card key={policy.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{policy.name}</CardTitle>
                    <CardDescription>
                      Version {policy.content.version} • {formatDate(policy.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm max-h-64 overflow-y-auto">
                    {policy.content.policyContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No policy templates yet. Generate policies to protect your business.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function AuditSection({ businessId }: { businessId?: string }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    area: '',
    scope: '',
    regulations: [] as string[],
    lastAuditDate: '',
  })

  const { data: audits, refetch } = useQuery({
    queryKey: ['compliance-templates', businessId, 'audit'],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/compliance/${businessId}/templates?category=audit`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const createAuditMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/compliance/${businessId}/audits`, formData)
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowCreateForm(false)
      setFormData({
        area: '',
        scope: '',
        regulations: [],
        lastAuditDate: '',
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Compliance Audits</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Start Audit
        </Button>
      </div>

      {/* Compliance Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">87%</div>
            <p className="text-xs text-muted-foreground mt-1">Good standing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Risk Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">2</div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Next Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Oct 15, 2025</div>
            <p className="text-xs text-muted-foreground mt-1">SOC 2 Audit</p>
          </CardContent>
        </Card>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Compliance Audit</CardTitle>
            <CardDescription>
              Generate an audit checklist for your compliance review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="area">Audit Area</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Data Privacy, Financial Controls, IT Security"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Audit Scope</Label>
              <Textarea
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Describe what will be audited..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastAuditDate">Last Audit Date (Optional)</Label>
              <Input
                id="lastAuditDate"
                type="date"
                value={formData.lastAuditDate}
                onChange={(e) => setFormData({ ...formData, lastAuditDate: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createAuditMutation.mutate()}
                disabled={!formData.area || !formData.scope || createAuditMutation.isPending}
              >
                {createAuditMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Audit Checklist'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {audits && audits.length > 0 ? (
          audits.map((audit: any) => (
            <Card key={audit.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{audit.name}</CardTitle>
                    <CardDescription>
                      Started on {formatDate(audit.createdAt)}
                    </CardDescription>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    audit.content.status === 'completed' 
                      ? 'text-green-600 bg-green-100'
                      : audit.content.status === 'in_progress'
                      ? 'text-yellow-600 bg-yellow-100'
                      : 'text-gray-600 bg-gray-100'
                  )}>
                    {audit.content.status.replace('_', ' ')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm max-h-64 overflow-y-auto">
                    {audit.content.auditChecklist}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    Add Findings
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No audits yet. Start an audit to track compliance status.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
