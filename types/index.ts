export interface ProjectQuestion {
  id: string
  label: string
}

export interface FormData {
  clientName: string
  projectType: string
  projectDescription: string
  estimatedWeeks: number
  currency: 'ARS' | 'USD'
  answers: Record<string, string>
}

export interface QuoteItem {
  description: string
  estimatedHours: number
  unitPrice: number
  subtotal: number
}

export interface QuoteConditions {
  validity: string
  paymentMethod: string
  additionalNotes: string
}

export interface GeneratedQuoteData {
  items: QuoteItem[]
  conditions: QuoteConditions
}

export interface Quote extends GeneratedQuoteData {
  quoteNumber: string
  clientName: string
  date: string
  projectType: string
  currency: 'ARS' | 'USD'
  total: number
}
