// app/layout.js
'use client'

import { Toaster } from 'sonner'
import Sidebar from './components/Sidebar' 
import MobileHeader from './components/MobileHeader'
import { usePathname } from 'next/navigation'
import './globals.css'

export default function RootLayout({ children }) {
  const pathname = usePathname()
  
  // Check if current page is an auth page
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/reset-password' || pathname==='/verify-otp'

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50">
        {isAuthPage ? (
          // Auth pages - no sidebar or header
          <div className="min-h-screen">
            {children}
          </div>
        ) : (
          // Protected pages - with sidebar and header
          <div className="flex min-h-screen">
            <main className="flex-1 md:mr-64 transition-all duration-300">
              <MobileHeader />
              <div className="pt-16 md:pt-8 px-4 pb-20 md:pb-8">
                {children}
              </div>
            </main>
            <Sidebar />
          </div>
        )}
        
        <Toaster position="top-left" richColors />
      </body>
    </html>
  )
}