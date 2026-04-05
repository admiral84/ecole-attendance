'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase/client'
import { toast } from 'sonner'

export default function SingleClass({ classInfo, students, stats }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState(false)

  if (!classInfo) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2">القسم غير موجود</h2>
        <Link href="/classes" className="text-blue-600 hover:underline">
          العودة إلى الأقسام
        </Link>
      </div>
    )
  }

  async function toggleStudentStatus(studentId, currentStatus) {
    setUpdating(true)
    const { error } = await supabase
      .from('eleve')
      .update({ present: !currentStatus })
      .eq('id_eleve', studentId)
    
    if (error) {
      toast.error('خطأ في تحديث حالة الطالب')
    } else {
      toast.success('تم تحديث الحالة بنجاح')
      router.refresh()
    }
    setUpdating(false)
  }

  const filteredStudents = students.filter(student =>
    student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id_eleve?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/classes" 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← العودة إلى الأقسام
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {classInfo.libelle }
          </h1>
          <p className="text-gray-600">المعرف: {classInfo.id_class}</p>
        </div>
        <Link
          href={`/attendance?class=${classInfo.id_class}`}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          تسجيل حضور
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">👨‍🎓</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalStudents}</div>
          <div className="text-sm text-gray-600">إجمالي التلاميذ</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats.presentStudents}</div>
          <div className="text-sm text-gray-600">حاضرون اليوم</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-2xl font-bold text-red-600">{stats.absentStudents}</div>
          <div className="text-sm text-gray-600">غائبون اليوم</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <input
          type="text"
          placeholder="بحث باسم التلميذ أو المعرف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-3 px-4">المعرف</th>
                <th className="text-right py-3 px-4">اسم التلميذ</th>
                <th className="text-right py-3 px-4">اسم الأب</th>
                <th className="text-right py-3 px-4">رقم الهاتف</th>
                <th className="text-right py-3 px-4">الحالة</th>
                <th className="text-right py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>لا يوجد تلاميذ في هذا القسم</p>
                    <Link href="/students/new" className="text-blue-600 hover:underline mt-2 inline-block">
                      إضافة تلميذ جديد
                    </Link>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id_eleve} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{student.id_eleve}</td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/students/${student.id_eleve}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        {student.nom || '-'}
                      </Link>
                    </td>
                    <td className="py-3 px-4">{student.pere || '-'}</td>
                    <td className="py-3 px-4" dir="ltr">{student.parentphone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.present ? 'حاضر' : 'غائب'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStudentStatus(student.id_eleve, student.present)}
                          disabled={updating}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            student.present 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {student.present ? 'غياب' : 'حضور'}
                        </button>
                        <Link
                          href={`/students/${student.id_eleve}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="عرض التفاصيل"
                        >
                          👁️
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      {students.length > 0 && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => {
              const csv = [
                ['المعرف', 'الاسم', 'اسم الأب', 'رقم الهاتف', 'الحالة'],
                ...filteredStudents.map(s => [
                  s.id_eleve, 
                  s.nom, 
                  s.pere || '', 
                  s.parentphone || '', 
                  s.present ? 'حاضر' : 'غائب'
                ])
              ].map(row => row.join(',')).join('\n')
              
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${classInfo.id_class}_students.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            📥 تصدير إلى CSV
          </button>
        </div>
      )}
    </div>
  )
}