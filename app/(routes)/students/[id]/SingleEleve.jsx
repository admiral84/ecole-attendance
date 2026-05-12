'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AddSanction from '../../../components/AddSanction'
import { getAttendanceByStudent } from '../../../actions/absence'
import { getSanctionsByStudent } from '../../../actions/sanctions'

export default function SingleEleve({ student, classInfo, attendance: initialAttendance, sanctions: initialSanctions, stats, userRole }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('info')
  const [showSanctionModal, setShowSanctionModal] = useState(false)
  const [attendance, setAttendance] = useState(initialAttendance || [])
  const [sanctions, setSanctions] = useState(initialSanctions || [])
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [loadingSanctions, setLoadingSanctions] = useState(false)

  // ✅ Check if user can add sanctions (admin or manager only)
  const canAddSanctions = userRole === 'admin' || userRole === 'manager'

  // Fetch functions
  const fetchAttendanceHistory = async () => {
    if (!student?.id_eleve) return
    
    setLoadingAttendance(true)
    const result = await getAttendanceByStudent(student.id_eleve)
    
    if (result.success) {
      setAttendance(result.data)
    } else {
      console.error('Error fetching attendance:', result.error)
      toast.error('حدث خطأ في تحميل سجل الغياب')
    }
    setLoadingAttendance(false)
  }

  const fetchSanctionsHistory = async () => {
    if (!student?.id_eleve) return
    
    setLoadingSanctions(true)
    const result = await getSanctionsByStudent(student.id_eleve)
    
    if (result.success) {
      setSanctions(result.data)
    } else {
      console.error('Error fetching sanctions:', result.error)
      toast.error('حدث خطأ في تحميل سجل العقوبات')
    }
    setLoadingSanctions(false)
  }

  // Handle tab change - fetch data when needed
  const handleTabChange = async (tab) => {
    setActiveTab(tab)
    
    if (tab === 'attendance' && student?.id_eleve && attendance.length === 0) {
      await fetchAttendanceHistory()
    } else if (tab === 'sanctions' && student?.id_eleve && sanctions.length === 0) {
      await fetchSanctionsHistory()
    }
  }

  // Refresh sanctions after adding
  const refreshSanctions = async () => {
    await fetchSanctionsHistory()
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2">التلميذ غير موجود</h2>
        <Link href="/students" className="text-blue-600 hover:underline">
          العودة إلى قائمة التلاميذ
        </Link>
      </div>
    )
  }

  function getStatusColor(present) {
    return present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  }

  // Get class name properly
  const getClassName = () => {
    if (classInfo?.libelle) {
      return classInfo.libelle
    }
    if (student.classes?.libelle) {
      return student.classes.libelle
    }
    if (student.id_class) {
      return student.id_class
    }
    return '-'
  }

  // Format date with Western numerals (0-9)
  const formatDate = (date) => {
    if (!date) return '-'
    const d = new Date(date)
    const day = d.getDate()
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Format time with Western numerals
  const formatTime = (time) => {
    if (!time) return '-'
    return time
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
            {student.prenom && ` ${student.prenom}`}
          </h1>
          <p className="text-gray-600">المعرف: {student.id_eleve}</p>
        </div>
        
        {/* ✅ Role badge */}
        <span className={`text-xs px-2 py-1 rounded ${
          userRole === 'admin' ? 'bg-red-100 text-red-700' :
          userRole === 'manager' ? 'bg-yellow-100 text-yellow-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {userRole === 'admin' ? 'مدير' : userRole === 'manager' ? 'مدير عام' : 'أستاذ'}
        </span>
      </div>

      {/* ✅ Info message for teachers */}
      {userRole === 'teacher' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-center text-blue-700 text-sm">
          📖 أنت في وضع المشاهدة. يمكنك فقط عرض البيانات.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">📚</div>
          <div className="text-2xl font-bold text-gray-800">{stats?.totalAbsences || 0}</div>
          <div className="text-sm text-gray-600">إجمالي الغيابات</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats?.justifiedAbsences || 0}</div>
          <div className="text-sm text-gray-600">غيابات مبررة</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-2xl font-bold text-red-600">{stats?.unJustifiedAbsences || 0}</div>
          <div className="text-sm text-gray-600">غيابات غير مبررة</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-2xl font-bold text-orange-600">{stats?.totalSanctions || sanctions.length}</div>
          <div className="text-sm text-gray-600">العقوبات</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => handleTabChange('info')}
            className={`flex-1 py-3 px-4 text-center font-medium transition whitespace-nowrap ${
              activeTab === 'info' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            معلومات شخصية
          </button>
          <button
            onClick={() => handleTabChange('attendance')}
            className={`flex-1 py-3 px-4 text-center font-medium transition whitespace-nowrap ${
              activeTab === 'attendance' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            سجل الغياب
          </button>
          <button
            onClick={() => handleTabChange('sanctions')}
            className={`flex-1 py-3 px-4 text-center font-medium transition whitespace-nowrap ${
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
                  <p className="font-medium">{student.nom || '-'} {student.prenom || ''}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">اسم الأب:</span>
                  <p className="font-medium">{student.pere || '-'}</p>
                </div>
                <div className="border-b pb-2">
                  <span className="text-gray-500">القسم:</span>
                  <p className="font-medium">{getClassName()}</p>
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
                  <p className="font-medium">{formatDate(student.date_naissance)}</p>
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

          {/* Attendance Tab - Shows ALL absence history ✅ */}
          {activeTab === 'attendance' && (
            <div>
              {loadingAttendance ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500">جاري تحميل سجل الغياب...</p>
                </div>
              ) : attendance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">✅</div>
                  <p>لا توجد غيابات مسجلة</p>
                  <p className="text-sm mt-2">سجل الغياب فارغ</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ البدء</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">وقت البدء</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ العودة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">وقت العودة</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record, index) => (
                        <tr key={record.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(record.date_deb)}</td>
                          <td className="py-3 px-4 text-sm">{formatTime(record.heure_deb)}</td>
                          <td className="py-3 px-4 text-sm">
                            {record.date_fin ? (
                              <span className="text-green-600">{formatDate(record.date_fin)}</span>
                            ) : (
                              <span className="text-orange-600 font-medium">لا يزال غائب</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm">{formatTime(record.heure_fin)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
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
              {loadingSanctions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-500">جاري تحميل سجل العقوبات...</p>
                </div>
              ) : sanctions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⭐</div>
                  <p>لا توجد عقوبات مسجلة</p>
                  <p className="text-sm mt-2">سجل العقوبات فارغ</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sanctions.map((sanction, index) => (
                    <div key={sanction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">#{index + 1}</span>
                          <h3 className="font-semibold text-lg">{sanction.motif || 'بدون سبب'}</h3>
                        </div>
                        <div className="text-left text-sm text-gray-500">
                          {sanction.startDate && (
                            <span>تاريخ البدء: {formatDate(sanction.startDate)}</span>
                          )}
                          {sanction.endDate && (
                            <span className="mr-2">إلى: {formatDate(sanction.endDate)}</span>
                          )}
                        </div>
                      </div>
                      {sanction.rapport && (
                        <p className="text-gray-600 text-sm mt-2 border-t pt-2">
                          {sanction.rapport}
                        </p>
                      )}
                      {sanction.createdAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          تاريخ الإضافة: {formatDate(sanction.createdAt)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* ✅ Add Sanction Button - Only visible inside sanctions tab, and only for admin/manager */}
              {canAddSanctions && (
                <div className="mt-6 pt-4 border-t">
                  <button
                    onClick={() => setShowSanctionModal(true)}
                    className="w-full bg-orange-600 text-white text-center py-2 rounded-lg hover:bg-orange-700 transition"
                  >
                    + إضافة عقوبة
                  </button>
                </div>
              )}
              
              {/* Info for teachers - no action buttons */}
              {userRole === 'teacher' && (
                <div className="text-center text-gray-500 text-sm mt-6 pt-4 border-t">
                  🔒 أنت في وضع المشاهدة فقط. لا يمكنك إضافة عقوبات.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Sanction Modal - Only shown if canAddSanctions */}
      {canAddSanctions && showSanctionModal && (
        <AddSanction
          studentId={student.id_eleve}
          studentName={`${student.nom} ${student.prenom || ''}`}
          classId={student.id_class}
          className={getClassName()}
          onClose={() => setShowSanctionModal(false)}
          onSuccess={() => {
            setShowSanctionModal(false)
            refreshSanctions()
            router.refresh()
            toast.success('تم إضافة العقوبة بنجاح')
          }}
        />
      )}
    </div>
  )
}