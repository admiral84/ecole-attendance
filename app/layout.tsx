// app/layout.js
'use client'

import { Toaster } from 'sonner'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50">
        <div className="flex min-h-screen">
          <main className="flex-1 md:mr-64 transition-all duration-300">
            <MobileHeader />
            <div className="pt-16 md:pt-8 px-4 pb-20 md:pb-8">
              {children}
            </div>
          </main>
          <Sidebar />
        </div>

        <Toaster position="top-left" richColors />
      </body>
    </html>
  )
}