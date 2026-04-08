// app/students/StudentsClient.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function StudentsClient({ students = [] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const router = useRouter()
  
  // Get unique classes for filter
  const uniqueClasses = [...new Map(students.map(s => [s.id_class, s.classInfo?.libelle])).entries()]
    .filter(([id]) => id)
    .map(([id, name]) => ({ id, name }))
  
  const filteredStudents = students.filter(student => {
    // Search by name or num
    const matchesSearch = 
      student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.num?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id_eleve?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter by class
    const matchesClass = !filterClass || student.id_class === filterClass
    
    // Filter by presence status
    const matchesStatus = !filterStatus || 
      (filterStatus === 'present' && student.present === true) ||
      (filterStatus === 'absent' && student.present === false)
    
    return matchesSearch && matchesClass && matchesStatus
  })
  
  const getPresenceStatus = (present) => {
    if (present === true || present === 'true' || present === 1) {
      return { text: 'حاضر', color: 'bg-green-100 text-green-700' }
    } else if (present === false || present === 'false' || present === 0) {
      return { text: 'غائب', color: 'bg-red-100 text-red-700' }
    }
    return { text: 'غير محدد', color: 'bg-gray-100 text-gray-700' }
  }
  
  const handleStudentClick = (studentId) => {
    router.push(`/students/${studentId}`)
  }
  
  const stats = {
    total: students.length,
    present: students.filter(s => s.present === true).length,
    absent: students.filter(s => s.present === false).length,
    undefined: students.filter(s => s.present !== true && s.present !== false).length
  }
  
  return (
    <div>
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-blue-700">إجمالي التلاميذ</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          <p className="text-sm text-green-700">حاضرون</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          <p className="text-sm text-red-700">غائبون</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">{stats.undefined}</p>
          <p className="text-sm text-gray-700">غير محدد</p>
        </div>
      </div>
      
      {/* Title and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">قائمة التلاميذ</h1>
          <p className="text-sm text-gray-500 mt-1">
            عرض {filteredStudents.length} من {students.length} تلميذ
          </p>
        </div>
        <Link
          href="/students/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <span>+</span> إضافة تلميذ جديد
        </Link>
      </div>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="بحث بالاسم أو المعرف أو رقم التسجيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Class Filter */}
        <div>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع الأقسام</option>
            {uniqueClasses.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Status Filter */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">جميع الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
          </select>
        </div>
      </div>
      
      {/* Clear Filters Button */}
      {(searchTerm || filterClass || filterStatus) && (
        <div className="mb-4 text-right">
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterClass('')
              setFilterStatus('')
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            مسح جميع الفلاتر ✕
          </button>
        </div>
      )}
      
      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>لا يوجد تلاميذ</p>
          {(searchTerm || filterClass || filterStatus) && (
            <p className="text-sm mt-2">حاول تغيير معايير البحث</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">المعرف</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">اسم التلميذ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">رقم التسجيل</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">القسم</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const status = getPresenceStatus(student.present)
                  return (
                    <tr 
                      key={student.id_eleve || student.id} 
                      onClick={() => handleStudentClick(student.id_eleve || student.id)}
                      className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono text-sm">
                        {student.id_eleve || student.matricule || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {student.nom} {student.prenom}
                          </div>
                          {student.email && (
                            <div className="text-xs text-gray-500 mt-1">
                              {student.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-sm text-gray-600">
                        {student.num || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                          {student.classInfo?.libelle || student.id_class || 'غير محدد'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Quick Stats Footer */}
      {filteredStudents.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          <span className="inline-block px-3 py-1 bg-gray-100 rounded-full">
            📊 {filteredStudents.length} تلميذ
          </span>
          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full mr-2">
            ✅ {filteredStudents.filter(s => s.present === true).length} حاضر
          </span>
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full mr-2">
            ❌ {filteredStudents.filter(s => s.present === false).length} غائب
          </span>
        </div>
      )}
    </div>
  )
}