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
import { Headphones, MessageSquare, HelpCircle, Ticket, Loader2, Send, Plus } from 'lucide-react'
import { formatDate } from '@advisor-ai/shared'
import { cn } from '@/lib/utils'

export default function SupportPage() {
  const { currentBusiness } = useBusinessStore()
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-sky-500 rounded-2xl">
          <Headphones className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Support Advisor</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered support with chatbot, FAQs, and ticket management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Live Chat
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Ticket className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="faqs">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <ChatSection businessId={currentBusiness?.id} />
        </TabsContent>

        <TabsContent value="tickets" className="space-y-6">
          <TicketsSection businessId={currentBusiness?.id} />
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          <FAQSection businessId={currentBusiness?.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ChatSection({ businessId }: { businessId?: string }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [input, setInput] = useState('')
  const sessionId = useState(() => `session-${Date.now()}`)[0]

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/support/${businessId}/chat`, {
        message,
        sessionId,
      })
      return response.data
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    },
  })

  const handleSend = () => {
    if (!input.trim()) return
    
    setMessages(prev => [...prev, { role: 'user', content: input }])
    sendMessageMutation.mutate(input)
    setInput('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>AI Support Chat</CardTitle>
          <CardDescription>
            Test your AI support chatbot responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chat messages */}
            <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Start a conversation to test your support bot</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg px-4 py-2',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a customer question..."
                disabled={sendMessageMutation.isPending}
              />
              <Button onClick={handleSend} disabled={sendMessageMutation.isPending || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Questions</CardTitle>
          <CardDescription>
            Click to test these questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              "What are your business hours?",
              "How do I return a product?",
              "What payment methods do you accept?",
              "How long does shipping take?",
              "Do you offer refunds?",
            ].map((question) => (
              <Button
                key={question}
                variant="outline"
                className="w-full justify-start text-left text-sm"
                onClick={() => setInput(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TicketsSection({ businessId }: { businessId?: string }) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: '',
  })

  const { data: tickets, refetch } = useQuery({
    queryKey: ['tickets', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/support/${businessId}/tickets`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/support/${businessId}/tickets`, formData)
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowCreateForm(false)
      setFormData({
        subject: '',
        description: '',
        priority: 'medium',
        category: '',
      })
    },
  })

  const priorityColors = {
    low: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-red-600 bg-red-100',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Support Tickets</h2>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test Ticket
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Support Ticket</CardTitle>
            <CardDescription>
              Test AI-generated responses for support tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the customer's issue..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Billing, Technical"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createTicketMutation.mutate()}
                disabled={!formData.subject || !formData.description || createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create & Generate Response'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tickets && tickets.length > 0 ? (
          tickets.map((ticket: any) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{ticket.content.subject}</CardTitle>
                    <CardDescription>
                      {ticket.content.ticketId} • {formatDate(ticket.createdAt)}
                    </CardDescription>
                  </div>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    priorityColors[ticket.content.priority as keyof typeof priorityColors]
                  )}>
                    {ticket.content.priority}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Issue:</p>
                  <p className="text-sm text-muted-foreground">{ticket.content.description}</p>
                </div>
                {ticket.content.initialResponse && (
                  <div>
                    <p className="text-sm font-medium mb-1">AI Response:</p>
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      {ticket.content.initialResponse}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    Add Response
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No support tickets yet. Create a test ticket to see AI-generated responses.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function FAQSection({ businessId }: { businessId?: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    category: '',
    answer: '',
  })

  const { data: faqs, refetch } = useQuery({
    queryKey: ['faqs', businessId],
    queryFn: async () => {
      if (!businessId) return []
      const response = await apiClient.request('get', `/modules/support/${businessId}/faqs`)
      return response.data || []
    },
    enabled: !!businessId,
  })

  const createFAQMutation = useMutation({
    mutationFn: async () => {
      if (!businessId) throw new Error('No business selected')
      
      const response = await apiClient.request('post', `/modules/support/${businessId}/faqs`, {
        ...formData,
        answer: formData.answer || undefined, // Let AI generate if empty
      })
      return response.data
    },
    onSuccess: () => {
      refetch()
      setShowAddForm(false)
      setFormData({
        question: '',
        category: '',
        answer: '',
      })
    },
  })

  const categories = ['General', 'Billing', 'Technical', 'Shipping', 'Returns']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add FAQ</CardTitle>
            <CardDescription>
              Add a question and let AI generate the answer, or provide your own
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="What would customers ask?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="answer">Answer (Optional)</Label>
              <Textarea
                id="answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Leave empty to let AI generate the answer..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createFAQMutation.mutate()}
                disabled={!formData.question || !formData.category || createFAQMutation.isPending}
              >
                {createFAQMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {formData.answer ? 'Saving...' : 'Generating...'}
                  </>
                ) : (
                  formData.answer ? 'Save FAQ' : 'Generate Answer'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {faqs && faqs.length > 0 ? (
          faqs.map((faq: any) => (
            <Card key={faq.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{faq.content.question}</CardTitle>
                  <span className="text-xs bg-muted px-2 py-1 rounded">
                    {faq.content.category}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {faq.content.answer}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No FAQs yet. Add common questions to help your customers.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
