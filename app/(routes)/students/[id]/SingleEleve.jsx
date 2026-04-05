'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../../lib/supabase/client'
import { toast } from 'sonner'

export default function SingleEleve({ student, classInfo, attendance, sanctions, stats }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('info') // info, attendance, sanctions
  const [updating, setUpdating] = useState(false)

  if (!student) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2">الطالب غير موجود</h2>
        <Link href="/students" className="text-blue-600 hover:underline">
          العودة إلى قائمة التلاميذ
        </Link>
      </div>
    )
  }

  async function updateStatus(present) {
    setUpdating(true)
    const { error } = await supabase
      .from('eleve')
      .update({ present })
      .eq('id_eleve', student.id_eleve)
    
    if (error) {
      toast.error('خطأ في تحديث الحالة')
    } else {
      toast.success(`تم تغيير الحالة إلى ${present ? 'حاضر' : 'غائب'}`)
      router.refresh()
    }
    setUpdating(false)
  }

  function getStatusColor(present) {
    return present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <Link 
          href="/students" 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← العودة
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {student.nom || 'غير معروف'}
          </h1>
          <p className="text-gray-600">المعرف: {student.id_eleve}</p>
        </div>
        <button
          onClick={() => updateStatus(!student.present)}
          disabled={updating}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            student.present 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {updating ? 'جاري التحديث...' : (student.present ? 'تسجيل غياب' : 'تسجيل حضور')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalAbsences}</div>
          <div className="text-sm text-gray-600">إجمالي الغيابات</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats.justifiedAbsences}</div>
          <div className="text-sm text-gray-600">غيابات مبررة</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-2xl font-bold text-red-600">{stats.unJustifiedAbsences}</div>
          <div className="text-sm text-gray-600">غيابات غير مبررة</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-bold text-orange-600">{stats.totalSanctions}</div>
          <div className="text-sm text-gray-600">العقوبات</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'info' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            معلومات شخصية
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'attendance' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            سجل الغياب
          </button>
          <button
            onClick={() => setActiveTab('sanctions')}
            className={`flex-1 py-3 px-4 text-center font-medium transition ${
              activeTab === 'sanctions' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            العقوبات
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-b pb-2">
                  <span className="text-gray-500">المعرف:</span>
                  <p className="font-medium">{student.id_eleve}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">الاسم الكامل:</span>
                  <p className="font-medium">{student.nom || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">اسم الأب:</span>
                  <p className="font-medium">{student.pere || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">القسم:</span>
                  <p className="font-medium">{classInfo?.ilbella || student.id_class || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">رقم التسجيل:</span>
                  <p className="font-medium">{student.num || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">رقم ولي الأمر:</span>
                  <p className="font-medium" dir="ltr">{student.parentphone || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">تاريخ الميلاد:</span>
                  <p className="font-medium">{student.date_naissance || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">الحالة:</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(student.present)}`}>
                    {student.present ? 'حاضر' : 'غائب'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div>
              {attendance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>لا توجد غيابات مسجلة</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-right py-2 px-4">التاريخ</th>
                        <th className="text-right py-2 px-4">الوقت</th>
                        <th className="text-right py-2 px-4">تاريخ الانتهاء</th>
                        <th className="text-right py-2 px-4">مبرر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{record.date_deb || '-'}</td>
                          <td className="py-2 px-4">{record.heure_deb || '-'}</td>
                          <td className="py-2 px-4">{record.date_fin || '-'}</td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.justified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {record.justified ? 'مبرر' : 'غير مبرر'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sanctions Tab */}
          {activeTab === 'sanctions' && (
            <div>
              {sanctions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⭐</div>
                  <p>لا توجد عقوبات مسجلة</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sanctions.map((sanction) => (
                    <div key={sanction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">{sanction.motif || 'بدون سبب'}</h3>
                          <p className="text-gray-600 text-sm mt-1">{sanction.rapport || 'لا يوجد تفاصيل'}</p>
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-gray-500">
                            من: {sanction.debut || '-'} 
                            {sanction.fin && ` إلى: ${sanction.fin}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Link
          href={`/attendance?student=${student.id_eleve}`}
          className="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition"
        >
          تسجيل غياب جديد
        </Link>
        <Link
          href={`/sanctions/new?student=${student.id_eleve}`}
          className="flex-1 bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700 transition"
        >
          إضافة عقوبة
        </Link>
      </div>
    </div>
  )
}