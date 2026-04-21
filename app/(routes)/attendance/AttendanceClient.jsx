// components/AttendanceClient.jsx
'use client'

import { useState, useEffect } from 'react'
import { 
  getStudentsWithPresentFalse, 
  getAbsentStudentsByClass, 
  getTeacherClasses, 
  markStudentPresent,
  sendAbsenceNotification
} from '../../actions/absence'
import { toast } from 'sonner'
import { CheckCircle, XCircle, UserCheck, AlertCircle, RefreshCw, GraduationCap, Bell, ArrowLeftCircle, FileText } from 'lucide-react'
import Billet from '../../components/Billet'

export default function AttendanceClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [teacherClasses, setTeacherClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedClassLibelle, setSelectedClassLibelle] = useState('')
  const [absentStudents, setAbsentStudents] = useState([])
  const [allAbsentStudents, setAllAbsentStudents] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [currentTime, setCurrentTime] = useState(new Date().toTimeString().slice(0, 5))
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState('all')
  const [selectedAbsence, setSelectedAbsence] = useState(null)
  const [showAbsenceDetails, setShowAbsenceDetails] = useState(false)
  
  // Billet modal state
  const [showBillet, setShowBillet] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedStudentClass, setSelectedStudentClass] = useState('')

  const fetchTeacherClasses = async () => {
    const result = await getTeacherClasses()
    
    if (result.success) {
      setTeacherClasses(result.data)
    } else {
      setError(result.error)
      toast.error(result.error)
    }
  }

  const fetchAllAbsentStudents = async () => {
    setLoading(true)
    
    const result = await getStudentsWithPresentFalse()
    
    if (result.success) {
      const groupedByClass = result.data.reduce((acc, student) => {
        const className = student.class_libelle || 'بدون قسم'
        if (!acc[className]) {
          acc[className] = []
        }
        acc[className].push({
          id: student.id_eleve,
          student_id: student.id_eleve,
          student_name: student.nom,
          class_libelle: student.class_libelle,
          class_id: student.id_class,
          num: student.num,
          justified: student.justified || false,
          absence_start_date: student.absence_start_date,
          absence_start_time: student.absence_start_time,
          absence_end_date: student.absence_end_date,
          absence_end_time: student.absence_end_time,
          is_returned: student.is_returned || false
        })
        return acc
      }, {})
      
      setAllAbsentStudents({
        count: result.data.length,
        grouped: groupedByClass,
        list: result.data.map(student => ({
          id: student.id_eleve,
          student_name: student.nom,
          student_id: student.id_eleve,
          class_libelle: student.class_libelle,
          class_id: student.id_class,
          num: student.num,
          justified: student.justified || false,
          absence_start_date: student.absence_start_date,
          absence_start_time: student.absence_start_time,
          absence_end_date: student.absence_end_date,
          absence_end_time: student.absence_end_time,
          is_returned: student.is_returned || false
        }))
      })
    } else {
      toast.error(result.error)
      setAllAbsentStudents({ count: 0, grouped: {}, list: [] })
    }
    
    setLoading(false)
  }

  const fetchAbsentStudentsByClass = async (classId) => {
    if (!classId) return
    
    setLoading(true)
    const result = await getAbsentStudentsByClass(classId)
    
    if (result.success) {
      setAbsentStudents(result.data.map(student => ({
        id_eleve: student.id_eleve,
        nom: student.nom,
        num: student.num,
        justified: student.justified || false,
        class_libelle: student.class_libelle,
        absenceId: student.absence_id,
        absence_start_date: student.absence_start_date,
        absence_start_time: student.absence_start_time,
        absence_end_date: student.absence_end_date,
        absence_end_time: student.absence_end_time,
        is_returned: student.is_returned || false
      })))
    } else {
      console.error('Error loading absent students:', result.error)
      toast.error(result.error)
      setAbsentStudents([])
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchTeacherClasses()
    fetchAllAbsentStudents()
  }, [])

  useEffect(() => {
    if (selectedClass && viewMode === 'class') {
      fetchAbsentStudentsByClass(selectedClass)
    }
  }, [selectedClass, viewMode])

  const handleClassSelect = (classId, classLibelle) => {
    setSelectedClass(classId)
    setSelectedClassLibelle(classLibelle)
  }

  const handleShowBillet = (student, classLibelle) => {
    setSelectedStudent(student)
    setSelectedStudentClass(classLibelle)
    setShowBillet(true)
  }

  const handleViewAbsenceDetails = (student) => {
    setSelectedAbsence(student)
    setShowAbsenceDetails(true)
  }

  const handleMarkReturned = async (studentId, classId, absenceStartDate, absenceStartTime) => {
    const endDate = new Date().toISOString().split('T')[0]
    const endTime = new Date().toTimeString().slice(0, 5)
    
    const result = await markStudentPresent(
      studentId,
      classId,
      absenceStartDate,
      absenceStartTime,
      endDate,
      endTime
    )
    
    if (result.success) {
      toast.success('تم تسجيل عودة التلميذ بنجاح')
      await fetchAllAbsentStudents()
      if (viewMode === 'class' && selectedClass) {
        await fetchAbsentStudentsByClass(selectedClass)
      }
    } else {
      toast.error(result.error || 'حدث خطأ في تسجيل العودة')
    }
  }

  const handleBilletConfirm = async (studentId, isJustified) => {
    // Use the student's actual absence start date from the database
    const absenceStartDate = selectedStudent.absence_start_date
    const absenceStartTime = selectedStudent.absence_start_time
    
    const notificationResult = await sendAbsenceNotification(
      studentId,
      selectedStudentClass,
      absenceStartDate,
      absenceStartTime,
      isJustified
    )
    
    if (!notificationResult.success) {
      toast.error(notificationResult.error || 'حدث خطأ في إرسال الإشعار')
      return
    }
    
    toast.success(
      isJustified 
        ? `تم إرسال إشعار إلى الأستاذ (غياب مبرر) - ${notificationResult.teacherName || ''}`
        : `تم إرسال إشعار إلى الأستاذ - ${notificationResult.teacherName || ''}`,
      {
        duration: 5000,
        icon: <Bell size={18} />
      }
    )
    
    setShowBillet(false)
    setSelectedStudent(null)
    setSelectedStudentClass('')
    
    await fetchAllAbsentStudents()
    if (viewMode === 'class' && selectedClass) {
      await fetchAbsentStudentsByClass(selectedClass)
    }
  }

  const handleMarkAllPresent = async () => {
    if (viewMode === 'class') {
      let notificationCount = 0
      for (const student of absentStudents) {
        const result = await sendAbsenceNotification(
          student.id_eleve,
          selectedClassLibelle,
          student.absence_start_date,
          student.absence_start_time,
          false
        )
        if (result.success) {
          notificationCount++
        }
      }
      
      if (notificationCount > 0) {
        toast.success(`تم إرسال ${notificationCount} إشعارات إلى الأساتذة`)
      }
      setAbsentStudents([])
    }
    
    await fetchAllAbsentStudents()
    if (viewMode === 'class' && selectedClass) {
      await fetchAbsentStudentsByClass(selectedClass)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (viewMode === 'class' && selectedClass) {
      await fetchAbsentStudentsByClass(selectedClass)
    }
    await fetchAllAbsentStudents()
    setRefreshing(false)
    toast.success('تم تحديث البيانات')
  }

  const getStatusBadge = (justified, isReturned) => {
    if (isReturned) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle size={12} />
          عاد
        </span>
      )
    }
    if (justified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          مبرر
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        <XCircle size={12} />
        غير مبرر
      </span>
    )
  }

  if (loading && allAbsentStudents.count === 0 && teacherClasses.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-4 sm:py-8 px-2 sm:px-4" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
          نظام إدارة الحضور والغياب
        </h1>

        {/* View Mode Toggle */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setViewMode('all')
                  setSelectedClass('')
                  setSelectedClassLibelle('')
                  fetchAllAbsentStudents()
                }}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                type="button"
              >
                <GraduationCap size={18} />
                جميع الغيابات
              </button>
              <button
                onClick={() => {
                  setViewMode('class')
                  if (teacherClasses.length > 0 && !selectedClass) {
                    handleClassSelect(teacherClasses[0].id_class, teacherClasses[0].libelle)
                  }
                }}
                className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  viewMode === 'class' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                type="button"
              >
                <UserCheck size={18} />
                غيابات قسم محدد
              </button>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              type="button"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              تحديث
            </button>
          </div>
        </div>

        {/* Class Selection Dropdown */}
        {viewMode === 'class' && (
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">اختر القسم</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    const selected = teacherClasses.find(c => c.id_class === e.target.value)
                    if (selected) {
                      handleClassSelect(selected.id_class, selected.libelle)
                    }
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- اختر القسم --</option>
                  {teacherClasses.map((cls) => (
                    <option key={cls.id_class} value={cls.id_class}>
                      {cls.libelle} ({cls.nbstudent || 0} تلميذ)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {teacherClasses.length === 0 && (
              <div className="text-center text-gray-500 py-4 mt-4">
                لا توجد فصول مسندة إليك
              </div>
            )}
          </div>
        )}

        {/* All School View */}
        {viewMode === 'all' && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 sm:p-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <AlertCircle size={20} />
                  قائمة التلاميذ الغائبين لجميع الأقسام
                </h2>
              </div>
              <div className="mt-2">
                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                  إجمالي الغيابات: {allAbsentStudents.count}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل البيانات...</p>
              </div>
            ) : (
              <div>
                {allAbsentStudents.count === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-gray-500 text-lg">لا يوجد تلاميذ غائبين</p>
                    <p className="text-gray-400 text-sm mt-2">جميع التلاميذ حاضرون</p>
                  </div>
                ) : (
                  Object.entries(allAbsentStudents.grouped).map(([className, students]) => (
                    <div key={className} className="mb-6 last:mb-0">
                      <div className="bg-gray-100 p-3 sm:p-4 border-b border-gray-200 sticky top-0">
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                          <GraduationCap size={20} />
                          {className}
                          <span className="text-sm text-gray-500 mr-2">({students.length} غائب)</span>
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرقم</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم التلميذ</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ البدء</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت البدء</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ العودة</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت العودة</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student, index) => (
                              <tr key={student.student_id} className="hover:bg-red-50 transition-colors bg-red-50/30">
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{student.num || '—'}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_name}</td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.absence_start_date || '—'}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.absence_start_time || '—'}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.absence_end_date || '—'}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {student.absence_end_time || '—'}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(student.justified, student.is_returned)}
                                </td>
                                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => handleShowBillet(student, className)}
                                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                      type="button"
                                    >
                                      <Bell size={14} />
                                      إشعار
                                    </button>
                                    {!student.is_returned && (
                                      <button
                                        onClick={() => handleMarkReturned(
                                          student.student_id,
                                          student.class_id,
                                          student.absence_start_date,
                                          student.absence_start_time
                                        )}
                                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                        type="button"
                                      >
                                        <ArrowLeftCircle size={14} />
                                        تسجيل عودة
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleViewAbsenceDetails(student)}
                                      className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                      type="button"
                                    >
                                      <FileText size={14} />
                                      تفاصيل
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Class View */}
        {viewMode === 'class' && selectedClass && (
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 sm:p-6">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <AlertCircle size={20} />
                  قائمة التلاميذ الغائبين - {selectedClassLibelle}
                </h2>
              </div>
              <div className="mt-2">
                <span className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                  عدد الغيابات: {absentStudents.length}
                </span>
              </div>
            </div>

            {absentStudents.length > 0 && (
              <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  type="button"
                >
                  <Bell size={18} />
                  إرسال إشعارات لجميع التلاميذ الغائبين
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل البيانات...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {absentStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <p className="text-gray-500 text-lg">لا يوجد تلاميذ غائبين</p>
                    <p className="text-gray-400 text-sm mt-2">جميع التلاميذ حاضرون في هذا القسم</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرقم</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم التلميذ</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ البدء</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت البدء</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ العودة</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">وقت العودة</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {absentStudents.map((student, index) => (
                        <tr key={student.id_eleve} className="hover:bg-red-50 transition-colors bg-red-50/30">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{student.num || '—'}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.nom}</td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.absence_start_date || '—'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.absence_start_time || '—'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.absence_end_date || '—'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.absence_end_time || '—'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(student.justified, student.is_returned)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => handleShowBillet(student, selectedClassLibelle)}
                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                type="button"
                              >
                                <Bell size={14} />
                                إشعار
                              </button>
                              {!student.is_returned && (
                                <button
                                  onClick={() => handleMarkReturned(
                                    student.id_eleve,
                                    selectedClass,
                                    student.absence_start_date,
                                    student.absence_start_time
                                  )}
                                  className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                  type="button"
                                >
                                  <ArrowLeftCircle size={14} />
                                  تسجيل عودة
                                </button>
                              )}
                              <button
                                onClick={() => handleViewAbsenceDetails(student)}
                                className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                type="button"
                              >
                                <FileText size={14} />
                                تفاصيل
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Billet Modal */}
      {showBillet && selectedStudent && (
        <Billet
          student={selectedStudent}
          classLibelle={selectedStudentClass}
          onClose={() => {
            setShowBillet(false)
            setSelectedStudent(null)
            setSelectedStudentClass('')
          }}
          onConfirm={handleBilletConfirm}
        />
      )}

      {/* Absence Details Modal */}
      {showAbsenceDetails && selectedAbsence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">تفاصيل الغياب</h2>
              <button
                onClick={() => setShowAbsenceDetails(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">اسم التلميذ</p>
                <p className="text-lg font-semibold">{selectedAbsence.student_name || selectedAbsence.nom}</p>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">الرقم</p>
                <p className="text-lg font-mono">{selectedAbsence.num || '—'}</p>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">القسم</p>
                <p className="text-lg">{selectedAbsence.class_libelle || selectedStudentClass}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <p className="text-sm text-gray-500">تاريخ بدء الغياب</p>
                  <p className="text-lg">{selectedAbsence.absence_start_date || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">وقت بدء الغياب</p>
                  <p className="text-lg">{selectedAbsence.absence_start_time || '—'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-b pb-3">
                <div>
                  <p className="text-sm text-gray-500">تاريخ العودة</p>
                  <p className="text-lg">{selectedAbsence.absence_end_date || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">وقت العودة</p>
                  <p className="text-lg">{selectedAbsence.absence_end_time || '—'}</p>
                </div>
              </div>
              
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">الحالة</p>
                <div className="mt-1">
                  {getStatusBadge(selectedAbsence.justified, selectedAbsence.is_returned)}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setShowAbsenceDetails(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                type="button"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}