'use client'

import { useState } from 'react'
import QuoteForm from '@/components/QuoteForm'
import QuoteView from '@/components/QuoteView'
import type { Quote } from '@/types'

export default function Home() {
  const [quote, setQuote] = useState<Quote | null>(null)

  return (
    <main>
      {quote === null ? (
        <QuoteForm onQuoteGenerated={setQuote} />
      ) : (
        <QuoteView quote={quote} onNewQuote={() => setQuote(null)} />
      )}
    </main>
  )
}
