import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'n8n Flients Dashboard',
  description: 'Manage n8n workflows for your clients',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="container py-8">
          {children}
        </div>
      </body>
    </html>
  )
}
