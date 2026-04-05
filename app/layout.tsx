import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import Sidebar from './components/Sidebar'
import MobileHeader from './components/MobileHeader'
import './globals.css'

export const metadata: Metadata = {
  title: 'نظام حضور الطلاب - مدرستي',
  description: 'إدارة حضور الطلاب والغياب والعقوبات',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-gray-50">
        <div className="flex min-h-screen">
          {/* Main Content Area - shifts left for Arabic (sidebar on right) */}
          <main className="flex-1 md:mr-64 transition-all duration-300">
            {/* Mobile Header */}
            <MobileHeader />
            
            {/* Page Content */}
            <div className="pt-16 md:pt-8 px-4 pb-20 md:pb-8">
              {children}
            </div>
          </main>
          
          {/* Sidebar - on the RIGHT for Arabic */}
          <Sidebar />
        </div>
        <Toaster position="top-left" richColors /> {/* Changed to top-left for RTL */}
      </body>
    </html>
  )
}