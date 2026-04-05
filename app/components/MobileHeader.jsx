'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="md:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🏫</span>
          <span className="font-bold text-lg text-gray-800">مدرستي</span>
        </div>
        
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg bg-gray-100"
        >
          <span className="text-xl">{isMenuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200">
          <div className="p-4">
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                  👤
                </div>
                <div>
                  <p className="font-medium text-gray-900">أحمد محمد</p>
                  <p className="text-sm text-gray-600">teacher@school.com</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                🏠 لوحة التحكم
              </Link>
              <Link
                href="/attendance"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                📝 تسجيل الحضور
              </Link>
              <Link
                href="/students"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                👨‍🎓 الطلاب
              </Link>
              <Link
                href="/classes"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                📚 الفصول
              </Link>
              <Link
                href="/sanctions"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                ⚠️ العقوبات
              </Link>
              <Link
                href="/reports"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                📊 التقارير
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}