'use client'

import { useRef, useState } from 'react'
import type { Quote } from '@/types'

interface QuoteViewProps {
  quote: Quote
  onNewQuote: () => void
}

function formatCurrency(amount: number, currency: 'ARS' | 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatHourlyRate(rate: number, currency: 'ARS' | 'USD'): string {
  return `${formatCurrency(rate, currency)}/h`
}

export default function QuoteView({ quote, onNewQuote }: QuoteViewProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const handlePrint = async () => {
    const element = printRef.current
    if (!element) return
    const { default: html2canvas } = await import('html2canvas')
    const { default: jsPDF } = await import('jspdf')
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#111116' })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let y = 0
    let remaining = imgHeight
    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, y === 0 ? 0 : -(imgHeight - remaining), imgWidth, imgHeight)
      remaining -= pageHeight
      if (remaining > 0) { pdf.addPage(); y -= pageHeight }
    }
    pdf.save(`${quote.quoteNumber}.pdf`)
  }

  const handleCopy = async () => {
    const currencySymbol = quote.currency === 'USD' ? 'USD' : 'ARS'

    const lines: string[] = [
      `PRESUPUESTO ${quote.quoteNumber}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Cliente: ${quote.clientName}`,
      `Proyecto: ${quote.projectType}`,
      `Fecha: ${quote.date}`,
      `Moneda: ${currencySymbol}`,
      ``,
      `DETALLE DE TRABAJO`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ]

    quote.items.forEach((item, i) => {
      lines.push(
        `${i + 1}. ${item.description}`,
        `   ${item.estimatedHours}h × ${formatCurrency(item.unitPrice, quote.currency)}/h = ${formatCurrency(item.subtotal, quote.currency)}`
      )
    })

    lines.push(
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `TOTAL: ${formatCurrency(quote.total, quote.currency)}`,
      ``,
      `CONDICIONES`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Validez: ${quote.conditions.validity}`,
      `Forma de pago: ${quote.conditions.paymentMethod}`,
    )

    if (quote.conditions.additionalNotes) {
      lines.push(`Notas: ${quote.conditions.additionalNotes}`)
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback: create a textarea and execute copy
      const textarea = document.createElement('textarea')
      textarea.value = lines.join('\n')
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const totalHours = quote.items.reduce((sum, item) => sum + item.estimatedHours, 0)

  return (
    <div className="min-h-screen px-4 py-10 animate-slide-up">
      {/* Top action bar */}
      <div className="max-w-4xl mx-auto mb-6 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Presupuesto generado</span>
            </div>
            <p className="text-zinc-500 text-sm">
              Revisá los valores y compartilo con tu cliente.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleCopy} className="btn-secondary">
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">Copiado</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </>
              )}
            </button>

            <button onClick={handlePrint} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2v-5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar PDF
            </button>

            <button onClick={onNewQuote} className="btn-ghost">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo presupuesto
            </button>
          </div>
        </div>
      </div>

      {/* Quote document */}
      <div
        id="quote-print-area"
        ref={printRef}
        className="max-w-4xl mx-auto card overflow-hidden"
      >
        {/* Document header */}
        <div className="px-8 py-7 border-b border-zinc-800 print-header">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            {/* Left: branding */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-zinc-100 text-lg tracking-tight">PRESUPUESTO</span>
              </div>
              <div className="space-y-1">
                <p className="text-zinc-400 text-sm print-text-muted">
                  <span className="text-zinc-500 print-text-muted">Para:</span>{' '}
                  <span className="text-zinc-200 font-medium">{quote.clientName}</span>
                </p>
                <p className="text-zinc-400 text-sm print-text-muted">
                  <span className="text-zinc-500 print-text-muted">Proyecto:</span>{' '}
                  <span className="text-zinc-200">{quote.projectType}</span>
                </p>
              </div>
            </div>

            {/* Right: meta */}
            <div className="sm:text-right space-y-1.5">
              <p className="font-mono text-base font-semibold text-zinc-100 tracking-wide">
                {quote.quoteNumber}
              </p>
              <p className="text-zinc-500 text-sm print-text-muted">Fecha: {quote.date}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                <span>{quote.currency}</span>
                <span className="text-indigo-600">·</span>
                <span>{totalHours}h estimadas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="px-8 py-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 print-text-muted">
            Detalle de trabajos
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left pb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider print-text-muted">
                    Descripción
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider pr-6 print-text-muted">
                    Horas
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider pr-6 print-text-muted">
                    Precio/hora
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider print-text-muted">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {quote.items.map((item, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-zinc-800/30 transition-colors duration-150"
                  >
                    <td className="py-4 pr-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 w-5 h-5 rounded flex items-center justify-center text-xs font-mono font-medium text-zinc-600 bg-zinc-800/80 shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-zinc-200 leading-relaxed">{item.description}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-6 text-right font-mono text-zinc-300 tabular-nums whitespace-nowrap">
                      {item.estimatedHours}h
                    </td>
                    <td className="py-4 pr-6 text-right font-mono text-zinc-400 tabular-nums whitespace-nowrap print-text-muted">
                      {formatHourlyRate(item.unitPrice, quote.currency)}
                    </td>
                    <td className="py-4 text-right font-mono text-zinc-200 tabular-nums font-medium whitespace-nowrap">
                      {formatCurrency(item.subtotal, quote.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-700">
                  <td colSpan={3} className="pt-5 pb-3 text-sm text-zinc-400 print-text-muted">
                    Total de horas estimadas:{' '}
                    <span className="font-mono font-medium text-zinc-300">{totalHours}h</span>
                  </td>
                  <td className="pt-5 pb-3 text-right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-xs text-zinc-500 uppercase tracking-wider print-text-muted">Total</span>
                      <span className="font-mono text-2xl font-bold text-zinc-100">
                        {formatCurrency(quote.total, quote.currency)}
                      </span>
                      <span className="text-xs text-zinc-600 print-text-muted">{quote.currency}</span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 border-t border-zinc-800/60" />

        {/* Conditions */}
        <div className="px-8 py-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 print-text-muted">
            Condiciones del presupuesto
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            <ConditionCard
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Validez"
              text={quote.conditions.validity}
            />
            <ConditionCard
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
              title="Forma de pago"
              text={quote.conditions.paymentMethod}
            />
            <ConditionCard
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Notas"
              text={quote.conditions.additionalNotes}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-800/60 bg-zinc-900/40">
          <p className="text-xs text-zinc-600 text-center print-text-muted">
            Presupuesto generado con IA — Revisá los valores antes de enviarlo al cliente.
            Los precios son referenciales y pueden variar según los requerimientos finales del proyecto.
          </p>
        </div>
      </div>

      {/* Bottom action bar for mobile */}
      <div className="max-w-4xl mx-auto mt-6 no-print sm:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleCopy} className="btn-secondary text-xs justify-center">
            Copiar
          </button>
          <button onClick={handlePrint} className="btn-secondary text-xs justify-center">
            PDF
          </button>
          <button onClick={onNewQuote} className="btn-primary text-xs justify-center">
            Nuevo
          </button>
        </div>
      </div>
    </div>
  )
}

function ConditionCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-zinc-500 print-text-muted">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed">{text || '—'}</p>
    </div>
  )
}
