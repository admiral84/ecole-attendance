'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { markStudentAbsent, markStudentPresent, checkNotificationsExist, deleteNotification } from '../../../actions/absence'

export default function SingleClass({ classInfo, students, stats, userRole, userInfo }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updatingStudentId, setUpdatingStudentId] = useState(null)
  const [notificationMap, setNotificationMap] = useState({})
  const [loadingNotifications, setLoadingNotifications] = useState(true)

  // ✅ Check if user can modify (only teachers)
  const canModify = userRole === 'teacher'

  // Refresh data function
  const refreshData = () => {
    router.refresh()
  }

  // Fetch notification status for all students
  useEffect(() => {
    const fetchNotificationStatus = async () => {
      if (!students || students.length === 0) {
        setLoadingNotifications(false)
        return
      }

      try {
        // Get students who are currently absent
        const absentStudents = students.filter(s => s.hasActiveAbsence === true)
        
        if (absentStudents.length === 0) {
          setNotificationMap({})
          setLoadingNotifications(false)
          return
        }

        // Prepare arrays for batch check
        const studentIds = absentStudents.map(s => s.id_eleve)
        const absenceDates = absentStudents.map(s => s.absenceStartDate || new Date().toISOString().split('T')[0])

        // Check notifications for all absent students
        const result = await checkNotificationsExist(
          classInfo.id_class,
          studentIds,
          absenceDates
        )

        if (result.success) {
          setNotificationMap(result.data)
        } else {
          console.error('Error fetching notifications:', result.error)
          setNotificationMap({})
        }
      } catch (error) {
        console.error('Error in fetchNotificationStatus:', error)
        setNotificationMap({})
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotificationStatus()
  }, [students, classInfo.id_class])

  // Delete notification handler
  const handleDeleteNotification = async (studentId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار؟')) {
      return
    }
    
    const result = await deleteNotification(studentId)
    
    if (result.success) {
      toast.success('تم حذف الإشعار بنجاح')
      refreshData()
    } else {
      toast.error(result.error || 'فشل في حذف الإشعار')
    }
  }

  async function handleMarkAbsent(studentId, studentName) {
    if (!canModify) {
      toast.error('غير مصرح به - فقط الأساتذة يمكنهم تسجيل الغياب')
      return
    }
    
    setUpdating(true)
    setUpdatingStudentId(studentId)
    
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    
    try {
      const result = await markStudentAbsent(
        studentId,
        classInfo.id_class,
        currentDate,
        currentTime,
        false // justified
      )
      
      if (result.success) {
        toast.success(`تم تسجيل غياب ${studentName} بنجاح`)
        refreshData()
      } else {
        toast.error(result.error || 'خطأ في تسجيل الغياب')
      }
    } catch (error) {
      console.error('Error marking absent:', error)
      toast.error('حدث خطأ غير متوقع')
    }
    
    setUpdating(false)
    setUpdatingStudentId(null)
  }

  async function handleMarkPresent(studentId, studentName, startDate, startTime) {
    if (!canModify) {
      toast.error('غير مصرح به - فقط الأساتذة يمكنهم تسجيل العودة')
      return
    }
    
    setUpdating(true)
    setUpdatingStudentId(studentId)
    
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)
    
    try {
      const result = await markStudentPresent(
        studentId,
        classInfo.id_class,
        startDate, // original absence start date
        startTime, // original absence start time
        currentDate, // return date
        currentTime  // return time
      )
      
      if (result.success) {
        toast.success(`تم تسجيل عودة ${studentName} بنجاح`)
        // Delete the notification after student returns
        await handleDeleteNotification(studentId)
        refreshData()
      } else {
        toast.error(result.error || 'خطأ في تسجيل العودة')
      }
    } catch (error) {
      console.error('Error marking present:', error)
      toast.error('حدث خطأ غير متوقع')
    }
    
    setUpdating(false)
    setUpdatingStudentId(null)
  }

  const filteredStudents = students.filter(student =>
    student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id_eleve?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get role label in Arabic
  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'مدير'
      case 'manager': return 'إداري'
      case 'teacher': return 'أستاذ'
      default: return 'مستخدم'
    }
  }

  // Check if student has a notification
  const hasNotification = (studentId, absenceDate) => {
    if (!absenceDate) return false
    const key = `${studentId}-${absenceDate}`
    return !!notificationMap[key]
  }

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
            {classInfo.libelle}
          </h1>
          <p className="text-gray-600 text-sm">المعرف: {classInfo.id_class}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-1 rounded inline-block ${
              userRole === 'teacher' ? 'bg-blue-100 text-blue-700' : 
              userRole === 'manager' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'
            }`}>
              {getRoleLabel(userRole)}
            </span>
            {userInfo?.nom && (
              <span className="text-xs text-gray-500">
                {userInfo.nom} {userInfo.prenom || ''}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/attendance?class=${classInfo.id_class}`}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
        >
          تسجيل حضور جماعي
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
          <div className="text-2xl mb-1">👨‍🎓</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalStudents}</div>
          <div className="text-sm text-gray-600">إجمالي التلاميذ</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats.presentStudents}</div>
          <div className="text-sm text-gray-600">حاضرون اليوم</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
          <div className="text-2xl mb-1">❌</div>
          <div className="text-2xl font-bold text-red-600">{stats.absentStudents}</div>
          <div className="text-sm text-gray-600">غائبون اليوم</div>
        </div>
      </div>

      {/* Info Message for Non-Teachers */}
      {!canModify && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 text-center text-blue-700 text-sm">
          📖 أنت في وضع المشاهدة فقط. لا يمكنك تسجيل غياب أو حضور.
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
        <input
          type="text"
          placeholder="بحث باسم التلميذ أو المعرف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">المعرف</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">اسم التلميذ</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">اسم الأب</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">رقم الهاتف</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الحالة</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">حالة الإشعار</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loadingNotifications ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                    <p>جاري تحميل حالة الإشعارات...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>لا يوجد تلاميذ في هذا القسم</p>
                    {canModify && (
                      <Link href="/students/new" className="text-blue-600 hover:underline mt-2 inline-block">
                        إضافة تلميذ جديد
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isAbsent = student.hasActiveAbsence === true
                  const isUpdating = updating && updatingStudentId === student.id_eleve
                  const hasNotif = hasNotification(student.id_eleve, student.absenceStartDate)
                  const canReturn = isAbsent && hasNotif && canModify

                  return (
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
                          !isAbsent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {!isAbsent ? 'حاضر' : 'غائب'}
                        </span>
                        {isAbsent && student.absenceStartTime && (
                          <span className="block text-xs text-gray-500 mt-1">
                            منذ {student.absenceStartTime}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isAbsent ? (
                          hasNotif ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full inline-block"></span>
                              تم الإشعار
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full inline-block animate-pulse"></span>
                              ينتظر الإشعار
                            </span>
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 flex-wrap">
                          {canModify && (
                            <>
                              {!isAbsent ? (
                                <button
                                  onClick={() => handleMarkAbsent(student.id_eleve, student.nom)}
                                  disabled={isUpdating}
                                  className="px-3 py-1 rounded text-xs font-medium transition bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                                >
                                  {isUpdating ? 'جاري...' : 'غياب'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMarkPresent(
                                    student.id_eleve, 
                                    student.nom,
                                    student.absenceStartDate,
                                    student.absenceStartTime
                                  )}
                                  disabled={!canReturn || isUpdating}
                                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                                    canReturn
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  } disabled:opacity-50`}
                                  title={!hasNotif ? 'يجب إرسال إشعار أولاً لتسجيل العودة' : ''}
                                >
                                  {isUpdating ? 'جاري...' : 'حضور'}
                                </button>
                              )}
                            </>
                          )}
                          <Link
                            href={`/students/${student.id_eleve}`}
                            className="text-blue-600 hover:text-blue-800 px-2 py-1"
                            title="عرض التفاصيل"
                          >
                            👁️
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}