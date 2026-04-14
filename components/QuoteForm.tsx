'use client'

import { useState } from 'react'
import type { FormData, Quote, GeneratedQuoteData, ProjectQuestion } from '@/types'

interface QuoteFormProps {
  onQuoteGenerated: (quote: Quote) => void
}

const PROJECT_TYPES = [
  'Sitio web',
  'App móvil',
  'Landing page',
  'E-commerce',
  'Diseño UX/UI',
  'Otro',
]

const QUESTIONS_BY_TYPE: Record<string, ProjectQuestion[]> = {
  'Landing page': [
    { id: 'goal', label: '¿Cuál es el objetivo principal? (captar leads, vender un producto, presentar un servicio...)' },
    { id: 'sections', label: '¿Qué secciones necesita? (hero, beneficios, testimonios, FAQ, formulario de contacto...)' },
    { id: 'extras', label: '¿Requiere animaciones, video de fondo o integraciones especiales?' },
  ],
  'Sitio web': [
    { id: 'pages', label: '¿Cuántas páginas aproximadamente?' },
    { id: 'cms', label: '¿Necesita CMS para editar el contenido sin código? (WordPress, Sanity, etc.)' },
    { id: 'features', label: '¿Tiene funcionalidades especiales? (blog, multiidioma, reservas, formularios...)' },
  ],
  'App móvil': [
    { id: 'platform', label: '¿Para qué plataforma? (iOS, Android o ambas)' },
    { id: 'backend', label: '¿Necesita base de datos, usuarios registrados o panel de administración?' },
    { id: 'features', label: '¿Cuáles son las 3 funcionalidades principales de la app?' },
    { id: 'integrations', label: '¿Requiere integraciones con servicios externos? (pagos, mapas, notificaciones push...)' },
  ],
  'E-commerce': [
    { id: 'products', label: '¿Cuántos productos aproximadamente?' },
    { id: 'payment', label: '¿Qué pasarela de pago? (MercadoPago, Stripe, PayPal...)' },
    { id: 'features', label: '¿Necesita gestión de stock, cupones de descuento, envíos u otras funciones?' },
  ],
  'Diseño UX/UI': [
    { id: 'deliverable', label: '¿Qué entregable se espera? (wireframes, prototipo interactivo, diseño final en Figma...)' },
    { id: 'screens', label: '¿Cuántas pantallas o vistas aproximadamente?' },
    { id: 'brand', label: '¿Ya tiene identidad de marca? (logo, colores, tipografía)' },
  ],
  'Otro': [
    { id: 'features', label: '¿Cuáles son las funcionalidades principales del proyecto?' },
    { id: 'users', label: '¿Tiene múltiples roles de usuario o panel de administración?' },
    { id: 'integrations', label: '¿Necesita integraciones con otros sistemas o APIs externas?' },
    { id: 'stack', label: '¿Tiene preferencia de tecnologías o ya hay algo desarrollado?' },
  ],
}

const LOADING_MESSAGES = [
  'Analizando el alcance del proyecto...',
  'Estimando horas por etapa...',
  'Calculando precios de mercado...',
  'Redactando condiciones comerciales...',
  'Armando tu presupuesto...',
]

function generateQuoteNumber(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `PPTO-${year}-${rand}`
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function QuoteForm({ onQuoteGenerated }: QuoteFormProps) {
  const [form, setForm] = useState<FormData>({
    clientName: '',
    projectType: '',
    projectDescription: '',
    estimatedWeeks: 4,
    currency: 'USD',
    answers: {},
  })

  const currentQuestions: ProjectQuestion[] = form.projectType ? (QUESTIONS_BY_TYPE[form.projectType] ?? []) : []
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0])
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'estimatedWeeks' ? Number(value) : value,
      // Reset answers when project type changes
      ...(name === 'projectType' ? { answers: {} } : {}),
    }))
    setError(null)
  }

  const handleAnswerChange = (id: string, value: string) => {
    setForm((prev) => ({ ...prev, answers: { ...prev.answers, [id]: value } }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientName.trim() || !form.projectType || !form.projectDescription.trim()) {
      setError('Por favor completá todos los campos obligatorios.')
      return
    }

    setLoading(true)
    setError(null)

    // Cycle through loading messages
    let msgIndex = 0
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length
      setLoadingMsg(LOADING_MESSAGES[msgIndex])
    }, 1800)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al generar el presupuesto.')
      }

      const quoteData = data as GeneratedQuoteData
      const total = quoteData.items.reduce((sum, item) => sum + item.subtotal, 0)

      const quote: Quote = {
        ...quoteData,
        quoteNumber: generateQuoteNumber(),
        clientName: form.clientName.trim(),
        date: formatDate(new Date()),
        projectType: form.projectType,
        currency: form.currency,
        total,
      }

      onQuoteGenerated(quote)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
    } finally {
      clearInterval(msgInterval)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-slow" />
          Powered by Claude AI
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-zinc-100 tracking-tight mb-3">
          Generador de Presupuestos
        </h1>
        <p className="text-zinc-500 text-base max-w-md mx-auto leading-relaxed">
          Completá los datos de tu proyecto y la IA generará un presupuesto profesional en segundos.
        </p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-xl">
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client name */}
            <div>
              <label htmlFor="clientName" className="field-label">
                Nombre del cliente <span className="text-red-500">*</span>
              </label>
              <input
                id="clientName"
                name="clientName"
                type="text"
                className="field-input"
                placeholder="Ej: Empresa ABC / Juan García"
                value={form.clientName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Project type */}
            <div>
              <label htmlFor="projectType" className="field-label">
                Tipo de proyecto <span className="text-red-500">*</span>
              </label>
              <select
                id="projectType"
                name="projectType"
                className="field-input"
                value={form.projectType}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="" disabled>Seleccioná el tipo...</option>
                {PROJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="projectDescription" className="field-label">
                Descripción del proyecto <span className="text-red-500">*</span>
              </label>
              <textarea
                id="projectDescription"
                name="projectDescription"
                className="field-input resize-none"
                placeholder="Describí brevemente el proyecto: funcionalidades principales, tecnologías, audiencia objetivo, etc."
                rows={4}
                value={form.projectDescription}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            {/* Dynamic questions */}
            {currentQuestions.length > 0 && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-2">
                    Preguntas del proyecto
                  </span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>
                {currentQuestions.map((q, i) => (
                  <div key={q.id}>
                    <label className="field-label">
                      {i + 1}. {q.label}
                    </label>
                    <textarea
                      className="field-input resize-none"
                      rows={2}
                      placeholder="Tu respuesta..."
                      value={form.answers[q.id] ?? ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      disabled={loading}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Weeks + Currency row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedWeeks" className="field-label">
                  Plazo estimado
                </label>
                <div className="relative">
                  <input
                    id="estimatedWeeks"
                    name="estimatedWeeks"
                    type="number"
                    min={1}
                    max={52}
                    className="field-input pr-16"
                    value={form.estimatedWeeks}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">
                    sem.
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="field-label">
                  Moneda
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="field-input"
                  value={form.currency}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="USD">USD — Dólares</option>
                  <option value="ARS">ARS — Pesos</option>
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-base"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span className="truncate">{loadingMsg}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generar Presupuesto
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-5">
          El presupuesto generado es una estimación orientativa. Revisá los valores antes de enviarlo.
        </p>
      </div>
    </div>
  )
}
