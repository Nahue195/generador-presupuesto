import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { clientName, projectType, projectDescription, estimatedWeeks, currency, answers } = body

    if (!clientName || !projectType || !projectDescription || !estimatedWeeks || !currency) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos.' },
        { status: 400 }
      )
    }

    // Reference exchange rate ARS/USD — update this value as needed
    const EXCHANGE_RATE = 1200

    const currencyLabel = currency === 'USD' ? 'Dólares (USD)' : 'Pesos Argentinos (ARS)'

    // ARS base rates
    const arsStandardMin = 3000
    const arsStandardMax = 5000
    const arsBackendMin = 5000
    const arsBackendMax = 9000
    const arsSpecialMin = 9000
    const arsSpecialMax = 14000

    // USD rates derived from ARS / exchange rate
    const usdStandardMin = Math.round(arsStandardMin / EXCHANGE_RATE)
    const usdStandardMax = Math.round(arsStandardMax / EXCHANGE_RATE)
    const usdBackendMin = Math.round(arsBackendMin / EXCHANGE_RATE)
    const usdBackendMax = Math.round(arsBackendMax / EXCHANGE_RATE)
    const usdSpecialMin = Math.round(arsSpecialMin / EXCHANGE_RATE)
    const usdSpecialMax = Math.round(arsSpecialMax / EXCHANGE_RATE)

    const hourRanges = `Horas totales según complejidad:
- Landing page simple: 20-40h
- Sitio web institucional: 40-90h
- E-commerce básico (sin integraciones): 80-130h
- E-commerce completo (pasarela de pagos, carrito, envíos, panel admin): 160-280h
- App móvil simple: 100-180h
- App móvil compleja (backend, auth, integraciones): 200-350h
- Proyecto web con base de datos y lógica de negocio: 100-200h
Usá el rango alto de horas cuando el cliente describió funcionalidades complejas o múltiples integraciones.`

    const rateGuideline =
      currency === 'USD'
        ? `Tarifas horarias en USD (tipo de cambio de referencia: $${EXCHANGE_RATE} ARS/USD): $${usdStandardMin}-$${usdStandardMax} para trabajo estándar (diseño, maquetado, configuración), $${usdBackendMin}-$${usdBackendMax} para desarrollo backend/integraciones, $${usdSpecialMin}-$${usdSpecialMax} para arquitectura o trabajo muy especializado.
${hourRanges}`
        : `Tarifas horarias en ARS: $${arsStandardMin.toLocaleString('es-AR')}-$${arsStandardMax.toLocaleString('es-AR')} para trabajo estándar (diseño, maquetado, configuración), $${arsBackendMin.toLocaleString('es-AR')}-$${arsBackendMax.toLocaleString('es-AR')} para desarrollo backend/integraciones, $${arsSpecialMin.toLocaleString('es-AR')}-$${arsSpecialMax.toLocaleString('es-AR')} para arquitectura o trabajo muy especializado.
${hourRanges}`

    // Build extra context from questionnaire answers
    const answersText = answers && typeof answers === 'object' && Object.keys(answers).length > 0
      ? '\nRESPUESTAS DEL CLIENTE:\n' + Object.entries(answers as Record<string, string>)
          .filter(([, v]) => v?.trim())
          .map(([, v], i) => `- Pregunta ${i + 1}: ${v.trim()}`)
          .join('\n')
      : ''

    const prompt = `Eres un consultor freelance de tecnología con más de 10 años de experiencia presupuestando proyectos web y móviles. Tu tarea es generar un presupuesto profesional y realista basado en la información del cliente.

DATOS DEL PROYECTO:
- Cliente: ${clientName}
- Tipo de proyecto: ${projectType}
- Descripción: ${projectDescription}
- Plazo estimado: ${estimatedWeeks} semana${estimatedWeeks !== 1 ? 's' : ''}
- Moneda: ${currencyLabel}${answersText}

INSTRUCCIONES:
1. Analizá toda la información provista para entender la complejidad real del proyecto.
2. Desglosa el trabajo en 4 a 7 ítems específicos y entregables concretos.
3. Estimá las horas de cada ítem de forma realista considerando el plazo de ${estimatedWeeks} semana${estimatedWeeks !== 1 ? 's' : ''} y la complejidad descripta.
4. ${rateGuideline}
5. El campo "subtotal" SIEMPRE debe ser exactamente estimatedHours × unitPrice.
6. Las condiciones deben ser profesionales, claras y en español argentino.
7. No incluyas dominio/hosting salvo que el cliente lo haya mencionado.

Devuelve ÚNICAMENTE el siguiente JSON (sin texto adicional, sin bloques de código, sin comentarios):

{
  "items": [
    {
      "description": "Nombre descriptivo del ítem",
      "estimatedHours": 20,
      "unitPrice": 50,
      "subtotal": 1000
    }
  ],
  "conditions": {
    "validity": "Texto sobre validez (ej: 30 días desde la fecha de emisión)",
    "paymentMethod": "Texto sobre forma de pago (ej: 50% al inicio, 50% a la entrega final)",
    "additionalNotes": "Notas relevantes sobre el proyecto, revisiones incluidas, etc."
  }
}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const block = message.content[0]
    if (block.type !== 'text') {
      throw new Error('Respuesta inesperada de la API')
    }

    // Extract JSON - handle cases where the model wraps it in markdown
    const raw = block.text.trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta')
    }

    const quoteData = JSON.parse(jsonMatch[0])

    // Validate structure
    if (!quoteData.items || !Array.isArray(quoteData.items) || quoteData.items.length === 0) {
      throw new Error('Estructura de respuesta inválida')
    }

    // Ensure subtotals are correct
    quoteData.items = quoteData.items.map((item: {
      description: string
      estimatedHours: number
      unitPrice: number
      subtotal: number
    }) => ({
      ...item,
      estimatedHours: Number(item.estimatedHours),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.estimatedHours) * Number(item.unitPrice),
    }))

    return NextResponse.json(quoteData)
  } catch (error) {
    console.error('Error generating quote:', error)

    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'API Key inválida. Verificá tu ANTHROPIC_API_KEY en .env.local' },
        { status: 401 }
      )
    }

    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: 'Límite de uso alcanzado. Intentá de nuevo en unos segundos.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Error al generar el presupuesto. Por favor intentá de nuevo.' },
      { status: 500 }
    )
  }
}
