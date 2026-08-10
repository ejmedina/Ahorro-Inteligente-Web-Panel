import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@/components/analytics/Analytics'
import { CookieConsent } from '@/components/analytics/CookieConsent'
import { GoogleTags } from '@/app/_components/GoogleTags'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ahorro Inteligente',
  description: 'Panel de control para gestionar ahorros y solicitudes de servicio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <GoogleTags />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
        <CookieConsent />
      </body>
    </html>
  )
}
