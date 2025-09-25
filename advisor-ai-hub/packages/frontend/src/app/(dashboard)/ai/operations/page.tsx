'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/services/api'
import { useBusinessStore } from '@/store'
import { Settings2, FileText, Calendar, Package, Loader2, Plus, Download } from 'lucide-react'
import { formatCurrency, formatDate } from '@advisor-ai/shared'

export default function OperationsPage() {
  const { currentBusiness } = useBusinessStore()
  const [activeTab, setActiveTab] = useState('invoices')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl">
          <Settings2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Advisor</h1>
          <p className="text-muted-foreground mt-1">
            Automate invoicing, scheduling, and inventory management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">
            <FileText className="h-4 w-4 mr-2" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceSection businessId={currentBusiness?.id} />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <AppointmentSection businessId={currentBusiness?.id} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventorySection businessId={currentBusiness?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InvoiceSection({ businessId }: { businessId?: string }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    items: [{ description: '', quantity: 1, rate: 0 }],
    dueDate: '',
    notes: '',
  })

  const { data: invoices, refetch } = useQuery({
    queryKey: ['invoices', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/operations/${businessId}/invoices`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/operations/${businessId}/invoices`, formData)
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowCreateForm(false)
      setFormData({
        clientName: '',
        clientEmail: '',
        items: [{ description: '', quantity: 1, rate: 0 }],
        dueDate: '',
        notes: '',
      })
    },
  })

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, rate: 0 }],
    })
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    setFormData({ ...formData, items: newItems })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const total = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Invoices</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice</CardTitle>
            <CardDescription>
              Generate a professional invoice with AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Invoice Items</Label>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-6 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Service or product"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      min="1"
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label>Rate ($)</Label>
                    <Input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="text-right text-lg font-semibold">
                Total: {formatCurrency(total)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes or payment terms"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createInvoiceMutation.mutate()}
                disabled={!formData.clientName || !formData.clientEmail || createInvoiceMutation.isPending}
              >
                {createInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Invoice'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {invoices && invoices.length > 0 ? (
          invoices.map((invoice: any) => (
            <Card key={invoice.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {invoice.content.invoiceNumber}
                  </CardTitle>
                  <CardDescription>
                    {invoice.content.clientName} • {formatDate(invoice.createdAt)}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {formatCurrency(invoice.content.items.reduce((sum: number, item: any) => 
                      sum + (item.quantity * item.rate), 0
                    ))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {formatDate(invoice.content.dueDate)}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    Send to Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No invoices yet. Create your first invoice to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function AppointmentSection({ businessId }: { businessId?: string }) {
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    notes: '',
  })

  const { data: appointments, refetch } = useQuery({
    queryKey: ['appointments', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/operations/${businessId}/appointments`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const scheduleAppointmentMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/operations/${businessId}/appointments`, formData)
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowScheduleForm(false)
      setFormData({
        title: '',
        clientName: '',
        clientEmail: '',
        date: '',
        time: '',
        duration: 60,
        location: '',
        notes: '',
      })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Appointments</h2>
        <Button onClick={() => setShowScheduleForm(!showScheduleForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      {showScheduleForm && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule New Appointment</CardTitle>
            <CardDescription>
              Schedule appointments and generate automated reminders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Appointment Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Consultation, Follow-up"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Office address or video call link"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowScheduleForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => scheduleAppointmentMutation.mutate()}
                disabled={!formData.title || !formData.clientName || scheduleAppointmentMutation.isPending}
              >
                {scheduleAppointmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule & Send Reminder'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {appointments && appointments.length > 0 ? (
          appointments.map((appointment: any) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{appointment.content.title}</CardTitle>
                    <CardDescription>
                      {appointment.content.clientName} • {appointment.content.duration} minutes
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatDate(appointment.content.date)}</p>
                    <p className="text-sm text-muted-foreground">{appointment.content.time}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Send Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    Reschedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No appointments scheduled. Start scheduling to manage your calendar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function InventorySection({ businessId }: { businessId?: string }) {
  const [items, setItems] = useState([
    { name: '', currentStock: 0, threshold: 0 }
  ])

  const generateReminderMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/operations/${businessId}/inventory/reminder`, {
        items: items.filter(item => item.name && item.currentStock < item.threshold),
        threshold: 'below minimum',
      })
      return response.data
    },
  })

  const addItem = () => {
    setItems([...items, { name: '', currentStock: 0, threshold: 0 }])
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const lowStockItems = items.filter(item => item.name && item.currentStock < item.threshold)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Inventory Management</h2>
        <p className="text-muted-foreground">
          Track inventory levels and generate reorder reminders
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Tracking</CardTitle>
          <CardDescription>
            Add items to track and set minimum stock thresholds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  value={item.currentStock}
                  onChange={(e) => updateItem(index, 'currentStock', Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Min Threshold</Label>
                <Input
                  type="number"
                  value={item.threshold}
                  onChange={(e) => updateItem(index, 'threshold', Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>

          {lowStockItems.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-2">
                Low Stock Alert
              </h4>
              <ul className="space-y-1">
                {lowStockItems.map((item, index) => (
                  <li key={index} className="text-sm text-orange-800 dark:text-orange-300">
                    {item.name}: {item.currentStock} units (min: {item.threshold})
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => generateReminderMutation.mutate()}
                disabled={generateReminderMutation.isPending}
              >
                {generateReminderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Reorder Reminder'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {generateReminderMutation.isSuccess && generateReminderMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle>Reorder Reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
              {generateReminderMutation.data.content}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
