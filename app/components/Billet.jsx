// components/Billet.jsx
'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { getTeacherSeance } from '../actions/seances'
import { submitEntryRequest } from '../actions/billet'
import { getAllClasses } from '../actions/classes'
import { sendAbsenceNotification } from '../actions/absence'

export default function Billet({ 
  student, 
  classLibelle, 
  userId,
  currentUserName,
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [teacher, setTeacher] = useState(null)
  const [allTeachers, setAllTeachers] = useState([])
  const [needsSelection, setNeedsSelection] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [isJustified, setIsJustified] = useState(false)
  const [classId, setClassId] = useState(null)

  // Convert numbers to Arabic
  const toArabicNumbers = (str) => {
    const arabicNumbers = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    }
    return str.replace(/[٠-٩]/g, (digit) => arabicNumbers[digit])
  }

  // Calculate current date and time directly during rendering
  const now = new Date()
  const formattedDate = now.toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = now.toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const currentDateTime = {
    date: toArabicNumbers(formattedDate),
    time: toArabicNumbers(formattedTime)
  }

  // Load class ID and teachers using server actions
  useEffect(() => {
    const loadClassAndTeachers = async () => {
      if (!classLibelle) return
      
      setLoading(true)
      console.log('\n========== STARTING LOADING PROCESS ==========')
      console.log('📋 Class Name:', classLibelle)
      
      try {
        // Step 1: Get class ID by libelle using server action
        console.log('\n🔍 Getting class ID for libelle:', classLibelle)
        const classesResult = await getAllClasses()
        
        if (!classesResult.success) {
          console.error('❌ Error loading classes:', classesResult.error)
          setLoading(false)
          return
        }
        
        const foundClass = classesResult.data.find(cls => cls.libelle === classLibelle)
        
        if (!foundClass) {
          console.error('❌ Class not found:', classLibelle)
          setLoading(false)
          return
        }
        
        console.log('✅ Found class:', { id_class: foundClass.id_class, libelle: foundClass.libelle })
        setClassId(foundClass.id_class)
        
        // Step 2: Get teachers for this class using server action
        console.log('\n🔍 Getting teachers for class ID:', foundClass.id_class)
        const teacherSeanceResult = await getTeacherSeance(foundClass.id_class)
        console.log('📊 getTeacherSeance Response:', teacherSeanceResult)
        
        if (teacherSeanceResult.success) {
          const teacherIds = teacherSeanceResult.data
          console.log('\n👨‍🏫 TEACHER IDS FOUND:')
          console.log('  ├─ Total teacher IDs:', teacherIds.length)
          console.log('  └─ Teacher IDs:', teacherIds)
          
          if (teacherIds.length === 1) {
            // Single teacher - auto select
            const teacherId = teacherIds[0]
            console.log('\n✅ Single teacher found - user_id:', teacherId)
            setTeacher({ id: teacherId, name: `أستاذ ${teacherId}` })
            setNeedsSelection(false)
          } else if (teacherIds.length > 1) {
            // Multiple teachers - show selection
            console.log('\n⚠️ Multiple teachers found - user_ids:', teacherIds)
            const teachersList = teacherIds.map(id => ({ 
              id, 
              name: `أستاذ ${id}` 
            }))
            setAllTeachers(teachersList)
            setNeedsSelection(true)
            setSelectedTeacherId('')
          } else {
            // No teachers found
            console.log('\n❌ No teachers found for this class')
            setTeacher(null)
            setNeedsSelection(false)
            setAllTeachers([])
          }
        } else {
          console.error('❌ Error in getTeacherSeance:', teacherSeanceResult.error)
          setTeacher(null)
          setNeedsSelection(false)
          setAllTeachers([])
        }
      } catch (error) {
        console.error('❌ Error in loadClassAndTeachers:', error)
        setTeacher(null)
        setNeedsSelection(false)
        setAllTeachers([])
      } finally {
        setLoading(false)
      }
      
      console.log('\n========== LOADING COMPLETE ==========\n')
    }
    
    loadClassAndTeachers()
  }, [classLibelle])

  // Log all information when component loads and data is ready
  useEffect(() => {
    if (!loading && classId && student) {
      const teacherId = teacher?.id || selectedTeacherId || 'غير محدد'
      const teacherName = teacher?.name || allTeachers.find(t => t.id === selectedTeacherId)?.name || 'غير محدد'
      
      console.log('\n╔════════════════════════════════════════════════════════════════╗')
      console.log('║              📋 BILLET COMPONENT INFORMATION                    ║')
      console.log('╚════════════════════════════════════════════════════════════════╝')
      
      console.log('\n📚 STUDENT INFORMATION:')
      console.log('  ├─ student_id (UUID):', student.student_id)
      console.log('  ├─ num (Student Number):', student.num)
      console.log('  ├─ nom (Name):', student.nom || student.student_name)
      console.log('  └─ is_returned:', student.is_returned || false)
      
      console.log('\n🏫 CLASS INFORMATION:')
      console.log('  ├─ id_class (Class ID):', classId)
      console.log('  ├─ libelle (Class Name):', classLibelle)
      
      console.log('\n📅 ABSENCE INFORMATION:')
      console.log('  ├─ absence_start_date:', student.absence_start_date)
      console.log('  ├─ absence_start_time:', student.absence_start_time)
      console.log('  ├─ absence_end_date:', student.absence_end_date || 'غير محدد')
      console.log('  ├─ absence_end_time:', student.absence_end_time || 'غير محدد')
      console.log('  └─ is_returned:', student.is_returned ? 'نعم' : 'لا')
      
      console.log('\n👤 REQUESTER INFORMATION:')
      console.log('  ├─ requested_by (User ID):', userId)
      console.log('  ├─ requested_by_name:', currentUserName || 'الإدارة')
      
      console.log('\n⏰ CURRENT TIME (REQUEST TIME):')
      console.log('  ├─ Date (Arabic):', currentDateTime.date)
      console.log('  ├─ Time (Arabic):', currentDateTime.time)
      
      console.log('\n👨‍🏫 TEACHER INFORMATION:')
      console.log('  ├─ teacher_id (user_id):', teacherId)
      console.log('  ├─ teacher_name:', teacherName)
      console.log('  ├─ teacher_found_automatically:', teacher ? 'نعم' : 'لا')
      console.log('  ├─ needs_manual_selection:', needsSelection ? 'نعم' : 'لا')
      console.log('  └─ all_teachers:', allTeachers.map(t => `${t.name} (${t.id})`).join(', '))
      
      console.log('\n⚙️ UI STATE:')
      console.log('  ├─ isJustified (غياب مبرر):', isJustified ? 'نعم' : 'لا')
      console.log('  ├─ canSubmit (يمكن الإرسال):', !!(teacher || (needsSelection && selectedTeacherId)) ? 'نعم' : 'لا')
      console.log('  ├─ loading:', loading ? 'نعم' : 'لا')
      console.log('  └─ selectedTeacherId:', selectedTeacherId || 'غير محدد')
      
      console.log('\n╔════════════════════════════════════════════════════════════════╗')
      console.log('║                    END OF BILLET INFO                          ║')
      console.log('╚════════════════════════════════════════════════════════════════╝\n')
    }
  }, [loading, classId, student, teacher, needsSelection, selectedTeacherId, userId, currentUserName, currentDateTime, classLibelle, isJustified, allTeachers])

  const handleSendNotification = async () => {
    const teacherId = teacher?.id || selectedTeacherId
    
    if (!teacherId) {
      alert('❌ الرجاء اختيار الأستاذ أولاً')
      return
    }
    
    setSending(true)
    
    console.log('\n╔════════════════════════════════════════════════════════════════╗')
    console.log('║              📤 SENDING PUSH NOTIFICATION                        ║')
    console.log('╚════════════════════════════════════════════════════════════════╝')
    
    console.log('\n📚 STUDENT INFO:')
    console.log('  ├─ student_id:', student.student_id)
    console.log('  ├─ num:', student.num)
    console.log('  ├─ name:', student.nom || student.student_name)
    
    console.log('\n🏫 CLASS INFO:')
    console.log('  ├─ id_class:', classId)
    console.log('  ├─ libelle:', classLibelle)
    
    console.log('\n📅 ABSENCE INFO:')
    console.log('  ├─ start_date:', student.absence_start_date)
    console.log('  ├─ start_time:', student.absence_start_time)
    console.log('  ├─ isJustified:', isJustified ? 'نعم' : 'لا')
    
    console.log('\n👤 REQUESTER INFO:')
    console.log('  ├─ requested_by (user_id):', userId)
    console.log('  ├─ requested_by_name:', currentUserName || 'الإدارة')
    
    console.log('\n⏰ REQUEST TIME:')
    console.log('  ├─ date:', currentDateTime.date)
    console.log('  ├─ time:', currentDateTime.time)
    
    console.log('\n👨‍🏫 TEACHER INFO:')
    console.log('  ├─ teacher_id (user_id):', teacherId)
    console.log('  ├─ teacher_type:', teacher ? 'Auto-detected' : 'Manually selected')
    
    console.log('\n📱 Sending push notification to teacher...')
    
    try {
      // Create FormData for server action
      const formData = new FormData()
      formData.append('studentId', student.student_id)
      formData.append('studentName', student.nom || student.student_name)
      formData.append('classId', classId)
      formData.append('className', classLibelle)
      formData.append('absenceStartDate', student.absence_start_date || new Date().toISOString().split('T')[0])
      formData.append('absenceStartTime', student.absence_start_time || '08:00')
      formData.append('isJustified', isJustified)
      formData.append('requestedBy', userId)
      formData.append('requestedByName', currentUserName || 'الإدارة')
      formData.append('requestDate', now.toISOString().split('T')[0])
      formData.append('requestTime', now.toTimeString().slice(0, 5))
      formData.append('teacherId', teacherId)
      
      // Call server action
      const result = await submitEntryRequest(formData)
      
      setSending(false)
      
      if (result.success) {
        
        await sendAbsenceNotification(
  student.student_id,                                    // student_id
  classId,                                               // class_id
  student.absence_start_date || new Date().toISOString().split('T')[0], // startDate (DATE)
  student.absence_start_time || '08:00',                // startTime (TIME)
  isJustified                                           // isJustified (BOOLEAN)
)

        console.log('\n✅ Push notification sent successfully to teacher')
        console.log('╔════════════════════════════════════════════════════════════════╗')
        console.log('║                    NOTIFICATION SENT                           ║')
        console.log('╚════════════════════════════════════════════════════════════════╝\n')
        alert('✅ تم إرسال الإشعار للأستاذ بنجاح')
        if (onClose) onClose()
        if (onSuccess) onSuccess()
      } else {
        console.error('\n❌ Push notification failed:', result.error)
        console.log('\n╔════════════════════════════════════════════════════════════════╗')
        console.log('║                    NOTIFICATION FAILED                         ║')
        console.log('╚════════════════════════════════════════════════════════════════╝\n')
        alert(`❌ فشل إرسال الإشعار: ${result.error}`)
      }
    } catch (error) {
      setSending(false)
      console.error('\n❌ Error sending notification:', error)
      alert(`❌ حدث خطأ: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
          <p className="mt-2 text-gray-600">جاري البحث عن الأستاذ...</p>
        </div>
      </div>
    )
  }

  const hasTeacher = teacher || (needsSelection && allTeachers.length > 0)
  const canSubmit = (teacher || (selectedTeacherId && needsSelection)) && !sending

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-3 px-4 text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            <h2 className="text-lg font-bold">طلب دخول</h2>
          </div>
          <p className="text-blue-100 text-xs mt-1">طلب إذن بدخول قاعة الدرس</p>
        </div>

        <div className="p-4">
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-sm">يطلب من الأستاذ السماح للتلميذ</p>
            
            <p className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 py-2 px-3 rounded-lg inline-block">
              {student.nom || student.student_name}
            </p>
            
            <p className="text-gray-500 text-sm">بالدخول إلى قسم</p>
            
            <p className="text-lg font-semibold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-lg inline-block">
              {classLibelle}
            </p>
            
            <p className="text-gray-500 text-sm">في الوقت التالي</p>
            
            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
              <p className="text-sm font-medium text-gray-800">{currentDateTime.date}</p>
              <p className="text-sm text-gray-600">الساعة {currentDateTime.time}</p>
            </div>

            {teacher && !needsSelection && (
              <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                <p className="text-xs text-green-800">
                  ✅ سيتم إرسال الإشعار للأستاذ: {teacher.name || 'الأستاذ'}
                </p>
              </div>
            )}

            {needsSelection && allTeachers.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
                  اختر الأستاذ:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    console.log('📝 Teacher selected manually - user_id:', e.target.value)
                    setSelectedTeacherId(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-right"
                  required
                >
                  <option value="">-- اختر أستاذ --</option>
                  {allTeachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!hasTeacher && (
              <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                <p className="text-xs text-red-800">
                  ❌ لا يوجد أساتذة مسجلين لهذا القسم
                </p>
                <p className="text-xs text-red-600 mt-1">
                  الرجاء التأكد من تسجيل حصص لهذا القسم في جدول الحصص
                </p>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-gray-200">
              <label className="flex items-center justify-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isJustified}
                  onChange={(e) => {
                    console.log('📝 Justified absence toggled:', e.target.checked ? 'نعم' : 'لا')
                    setIsJustified(e.target.checked)
                  }}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 text-sm font-medium">غياب مبرر</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-3 flex gap-2 border-t border-gray-200">
          <button
            onClick={handleSendNotification}
            disabled={!canSubmit}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                إرسال إشعار للأستاذ
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle size={16} />
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}