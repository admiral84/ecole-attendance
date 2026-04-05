'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const menuItems = [
  { name: 'لوحة التحكم', href: '/', icon: '🏠' },
  { name: 'تسجيل الغيابات', href: '/attendance', icon: '📝' },
  { name: 'التلاميذ', href: '/students', icon: '👨‍🎓' },
  { name: 'الأقسام', href: '/classes', icon: '📚' },
  { name: 'العقوبات', href: '/sanctions', icon: '⚠️' },
  { name: 'التقارير', href: '/reports', icon: '📊' },
  { name: 'رفع قائمات التلاميذ', href: '/upload', icon: '📤' }
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Desktop Sidebar - on the RIGHT side for Arabic */}
      <aside 
        className={`hidden md:block fixed right-0 top-0 h-full bg-gradient-to-b from-blue-900 to-blue-800 text-white transition-all duration-300 z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-blue-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏫</span>
              <span className="font-bold text-lg">معهد عبدالحميد غزواني</span>
            </div>
          )}
          {isCollapsed && <span className="text-2xl mx-auto">🏫</span>}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:text-blue-200 transition-colors"
          >
            {isCollapsed ? '←' : '→'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-lg'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <span className="text-xl">{item.icon}</span>
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-blue-700">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              👤
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium">أحمد محمد</p>
                <p className="text-xs text-blue-200">teacher@school.com</p>
              </div>
            )}
            {!isCollapsed && (
              <button className="text-blue-200 hover:text-white">🚪</button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-20">
        <div className="flex justify-around py-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-16"></div>
    </>
  )
}