import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Generador de Presupuestos — Freelance',
  description: 'Generá presupuestos profesionales para tus proyectos freelance con IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[#09090b]`}>
        {children}
      </body>
    </html>
  )
}
