'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ClassClient({ initialClasses = [] }) {
  const [classes, setClasses] = useState(initialClasses)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClasses = classes.filter(cls => 
    cls.id_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.ilbella?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">الأقسام الدراسية</h1>
          <p className="text-sm text-gray-600 mt-1">
            إجمالي الأقسام: {filteredClasses.length}
          </p>
        </div>
        <Link
          href="/classes/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span> إضافة قسم جديد
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <input
          type="text"
          placeholder="بحث باسم القسم أو المعرف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-500">لا توجد أقسام</p>
          <Link href="/classes/new" className="text-blue-600 hover:underline mt-2 inline-block">
            إضافة قسم جديد
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredClasses.map((cls) => (
            <Link
              key={cls.id_class}
              href={`/classes/${cls.id_class}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">📚</div>
                  <div className="text-sm text-gray-400">{cls.id_class}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                  {cls.libelle }
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>عدد التلاميذ: {cls.nstudent || 0}</span>
                  <span className="text-blue-600 group-hover:translate-x-1 transition">←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}