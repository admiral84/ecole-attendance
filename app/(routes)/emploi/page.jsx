// app/(auth)/complete-profile/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function CompleteProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [classes, setClasses] = useState([])
  const [matieres, setMatieres] = useState([])
  const [seances, setSeances] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [mobileView, setMobileView] = useState(false)
  const [selectedDayForMobile, setSelectedDayForMobile] = useState('lundi')
  const [selectedMatiere, setSelectedMatiere] = useState('')
  const [currentSeance, setCurrentSeance] = useState({
    jour: 'lundi',
    debut_heure: '8',
    fin_heure: '9',
    id_classe: ''
  })

  // Days in Arabic with their French equivalents for DB storage
  const days = [
    { arabic: 'الإثنين', french: 'lundi' },
    { arabic: 'الثلاثاء', french: 'mardi' },
    { arabic: 'الأربعاء', french: 'mercredi' },
    { arabic: 'الخميس', french: 'jeudi' },
    { arabic: 'الجمعة', french: 'vendredi' },
    { arabic: 'السبت', french: 'samedi' }
  ]

  // Time slots from 8:00 to 18:00
  const timeSlots = [
    '8:00', '9:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ]

  // Time options for beginning (8 to 17)
  const startTimes = Array.from({ length: 10 }, (_, i) => i + 8)
  
  // Time options for end (9 to 18)
  const endTimes = Array.from({ length: 10 }, (_, i) => i + 9)

  useEffect(() => {
    checkUserAndLoadData()
    
    // Check screen size for responsive view
    const handleResize = () => {
      setMobileView(window.innerWidth < 768)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function checkUserAndLoadData() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('matricule, nom, prenom, role, code_matiere')
        .eq('email', session.user.email)
        .single()

      if (userError) {
        console.error('Error fetching user:', userError)
        toast.error('خطأ في تحميل بيانات المستخدم')
        return
      }

      if (userData.role !== 'teacher') {
        toast.error('هذه الصفحة مخصصة للمعلمين فقط')
        router.push('/')
        return
      }

      // Set the teacher's subject if they already have one
      if (userData.code_matiere) {
        setSelectedMatiere(userData.code_matiere)
      }

      const { data: existingSeances, error: seancesError } = await supabase
        .from('seance')
        .select(`
          *,
          classes!inner (
            libelle
          )
        `)
        .eq('matricule', userData.matricule)

      if (!seancesError && existingSeances) {
        setSeances(existingSeances)
      }

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id_class, libelle')
        .order('libelle')

      if (classesError) {
        console.error('Error loading classes:', classesError)
        toast.error('خطأ في تحميل قائمة الأقسام')
      } else {
        setClasses(classesData || [])
      }

      // Load subjects
      const { data: matieresData, error: matieresError } = await supabase
        .from('matiere')
        .select('code_matiere, libelle')
        .order('libelle')

      if (matieresError) {
        console.error('Error loading subjects:', matieresError)
        toast.error('خطأ في تحميل قائمة المواد')
      } else {
        setMatieres(matieresData || [])
      }

    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ غير متوقع')
    }
  }

  async function saveTeacherSubject() {
    if (!selectedMatiere) {
      toast.error('الرجاء اختيار المادة التي تدرسها')
      return false
    }

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('matricule')
        .eq('email', user.email)
        .single()

      if (!userData) {
        toast.error('لم يتم العثور على بيانات المستخدم')
        return false
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ code_matiere: selectedMatiere })
        .eq('matricule', userData.matricule)

      if (updateError) {
        console.error('Error saving subject:', updateError)
        toast.error('حدث خطأ في حفظ المادة')
        return false
      }

      return true
    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ غير متوقع')
      return false
    }
  }

  function handleSeanceChange(e) {
    setCurrentSeance({
      ...currentSeance,
      [e.target.name]: e.target.value
    })
  }

  function getSeanceForTimeSlot(day, timeSlot) {
    const slotHour = parseInt(timeSlot.split(':')[0])
    
    return seances.find(s => {
      if (s.jour !== day) return false
      const startHour = parseInt(s.debut_heure.split(':')[0])
      const endHour = parseInt(s.fin_heure.split(':')[0])
      return slotHour >= startHour && slotHour < endHour
    })
  }

  function isStartOfSeance(day, timeSlot) {
    const slotHour = parseInt(timeSlot.split(':')[0])
    const seance = getSeanceForTimeSlot(day, timeSlot)
    if (!seance) return false
    const startHour = parseInt(seance.debut_heure.split(':')[0])
    return slotHour === startHour
  }

  function getColSpan(day, timeSlot) {
    const seance = getSeanceForTimeSlot(day, timeSlot)
    if (!seance || !isStartOfSeance(day, timeSlot)) return 0
    
    const startHour = parseInt(seance.debut_heure.split(':')[0])
    const endHour = parseInt(seance.fin_heure.split(':')[0])
    return endHour - startHour
  }

  function validateSeance() {
    if (!selectedMatiere) {
      toast.error('الرجاء اختيار المادة أولاً')
      return false
    }

    if (!currentSeance.id_classe) {
      toast.error('الرجاء اختيار القسم')
      return false
    }
    
    const start = parseInt(currentSeance.debut_heure)
    const end = parseInt(currentSeance.fin_heure)
    
    if (end <= start) {
      toast.error('وقت النهاية يجب أن يكون بعد وقت البداية')
      return false
    }

    if (end > 18 || start < 8) {
      toast.error('الوقت يجب أن يكون بين 8:00 و 18:00')
      return false
    }

    // Check for overlaps, excluding the current seance being edited
    const hasOverlap = seances.some(seance => {
      // Skip the seance being edited
      if (selectedCell && seance.id === selectedCell.id) return false
      
      if (seance.jour !== currentSeance.jour) return false
      
      const existingStart = parseInt(seance.debut_heure.split(':')[0])
      const existingEnd = parseInt(seance.fin_heure.split(':')[0])
      
      return (start < existingEnd && end > existingStart)
    })

    if (hasOverlap) {
      toast.error('هناك تعارض في المواعيد لنفس اليوم')
      return false
    }

    return true
  }

  function addOrUpdateSeance() {
    if (!validateSeance()) return

    if (selectedCell) {
      // Update existing seance
      const updatedSeances = seances.map(seance => {
        if (seance.id === selectedCell.id) {
          return {
            ...seance,
            jour: currentSeance.jour,
            debut_heure: `${currentSeance.debut_heure}:00:00`,
            fin_heure: `${currentSeance.fin_heure}:00:00`,
            id_classe: currentSeance.id_classe,
            classes: {
              libelle: classes.find(c => c.id_class === currentSeance.id_classe)?.libelle
            }
          }
        }
        return seance
      })
      
      setSeances(updatedSeances)
      toast.success('تم تحديث الحصة')
    } else {
      // Add new seance
      const newSeance = {
        id: Date.now(),
        jour: currentSeance.jour,
        debut_heure: `${currentSeance.debut_heure}:00:00`,
        fin_heure: `${currentSeance.fin_heure}:00:00`,
        id_classe: currentSeance.id_classe,
        matricule: user?.matricule,
        code_matiere: selectedMatiere,
        classes: {
          libelle: classes.find(c => c.id_class === currentSeance.id_classe)?.libelle
        }
      }

      setSeances([...seances, newSeance])
      toast.success('تم إضافة الحصة')
    }
    
    // Reset form
    setSelectedCell(null)
    setCurrentSeance({
      jour: 'lundi',
      debut_heure: '8',
      fin_heure: '9',
      id_classe: ''
    })
  }

  function removeSeance(seanceId) {
    setSeances(seances.filter(s => s.id !== seanceId))
    toast.success('تم حذف الحصة')
  }

  function editSeance(seance) {
    setCurrentSeance({
      jour: seance.jour,
      debut_heure: seance.debut_heure.split(':')[0],
      fin_heure: seance.fin_heure.split(':')[0],
      id_classe: seance.id_classe
    })
    setSelectedCell(seance)
    
    // On mobile, scroll to form
    if (mobileView) {
      document.getElementById('seance-form')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  async function saveAllSeances() {
    if (!selectedMatiere) {
      toast.error('الرجاء اختيار المادة أولاً')
      return
    }

    if (seances.length === 0) {
      toast.error('الرجاء إضافة حصص على الأقل')
      return
    }

    setLoading(true)

    try {
      // First save the teacher's subject
      const subjectSaved = await saveTeacherSubject()
      if (!subjectSaved) {
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('matricule')
        .eq('email', user.email)
        .single()

      if (!userData) {
        toast.error('لم يتم العثور على بيانات المستخدم')
        setLoading(false)
        return
      }

      // Delete existing seances
      const { error: deleteError } = await supabase
        .from('seance')
        .delete()
        .eq('matricule', userData.matricule)

      if (deleteError) {
        console.error('Error deleting existing seances:', deleteError)
        toast.error('حدث خطأ في تحديث الجدول')
        setLoading(false)
        return
      }

      // Prepare seances for insertion (remove temporary id and classes object)
      const seancesToInsert = seances.map(({ id, classes, ...seance }) => ({
        ...seance,
        matricule: userData.matricule,
        code_matiere: selectedMatiere
      }))

      // Insert new seances
      const { error: insertError } = await supabase
        .from('seance')
        .insert(seancesToInsert)

      if (insertError) {
        console.error('Error saving seances:', insertError)
        toast.error('حدث خطأ في حفظ الجدول')
        setLoading(false)
        return
      }

      toast.success('تم حفظ الجدول بنجاح!')
      
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  // Mobile Schedule View Component
  function MobileScheduleView() {
    return (
      <div className="space-y-4">
        {/* Day Selector */}
        <div className="flex overflow-x-auto gap-2 pb-2">
          {days.map(day => (
            <button
              key={day.french}
              onClick={() => setSelectedDayForMobile(day.french)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedDayForMobile === day.french
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {day.arabic}
            </button>
          ))}
        </div>

        {/* Time Slots for Selected Day */}
        <div className="space-y-2">
          {timeSlots.map((timeSlot, index) => {
            const seance = getSeanceForTimeSlot(selectedDayForMobile, timeSlot)
            const isStart = isStartOfSeance(selectedDayForMobile, timeSlot)
            
            if (!seance) {
              return (
                <div key={timeSlot} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="text-sm text-gray-500">{timeSlot}</div>
                  <div className="text-gray-400 text-center py-2">—</div>
                </div>
              )
            }
            
            if (isStart) {
              const colspan = getColSpan(selectedDayForMobile, timeSlot)
              const endTime = timeSlots[index + colspan - 1]
              const classLibelle = seance.classes?.libelle || 
                                  classes.find(c => c.id_class === seance.id_classe)?.libelle
              const matiereLibelle = matieres.find(m => m.code_matiere === selectedMatiere)?.libelle
              
              return (
                <div key={timeSlot} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-semibold text-blue-800">
                        {timeSlot} - {endTime}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editSeance(seance)}
                        className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => removeSeance(seance.id)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                  <div className="text-center py-2">
                    <div className="font-medium text-blue-900">{classLibelle}</div>
                    <div className="text-sm text-blue-700 mt-1">{matiereLibelle}</div>
                  </div>
                </div>
              )
            }
            
            return null
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-gray-100 py-4 sm:py-8 px-2 sm:px-4">
      <div className="container mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-center mb-2">إكمال الملف الشخصي</h1>
          <p className="text-sm sm:text-base text-center text-gray-600">قم بإضافة جدول حصصك الأسبوعي</p>
        </div>

        {/* Subject Selection Card - Only shown if no subject selected yet */}
        {!selectedMatiere && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8 border-2 border-purple-200">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-purple-800">اختر المادة التي تدرسها</h2>
            <p className="text-sm text-gray-600 mb-4">سيتم تطبيق هذه المادة على جميع حصصك في الجدول</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {matieres.map(matiere => (
                <button
                  key={matiere.code_matiere}
                  onClick={() => setSelectedMatiere(matiere.code_matiere)}
                  className="px-4 py-2 bg-white hover:bg-purple-100 border border-purple-300 rounded-lg transition-colors text-right"
                >
                  {matiere.libelle}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Show selected subject badge */}
        {selectedMatiere && (
          <div className="bg-green-50 rounded-xl shadow-xl p-3 sm:p-4 mb-4 sm:mb-8 border border-green-200 flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-600">المادة المختارة:</span>
              <span className="font-bold text-green-800 mr-2">
                {matieres.find(m => m.code_matiere === selectedMatiere)?.libelle}
              </span>
            </div>
            <button
              onClick={() => setSelectedMatiere('')}
              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm"
            >
              تغيير المادة
            </button>
          </div>
        )}

        {/* Add/Edit Seance Form - Only show if subject is selected */}
        {selectedMatiere && (
          <>
            <div id="seance-form" className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {selectedCell ? 'تعديل الحصة' : 'إضافة حصة جديدة'}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">اليوم</label>
                  <select
                    name="jour"
                    value={currentSeance.jour}
                    onChange={handleSeanceChange}
                    className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    {days.map(day => (
                      <option key={day.french} value={day.french}>
                        {day.arabic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">بداية الحصة</label>
                  <select
                    name="debut_heure"
                    value={currentSeance.debut_heure}
                    onChange={handleSeanceChange}
                    className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    {startTimes.map(time => (
                      <option key={time} value={time}>
                        {time}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نهاية الحصة</label>
                  <select
                    name="fin_heure"
                    value={currentSeance.fin_heure}
                    onChange={handleSeanceChange}
                    className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    {endTimes.map(time => (
                      <option key={time} value={time}>
                        {time}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                  <select
                    name="id_classe"
                    value={currentSeance.id_classe}
                    onChange={handleSeanceChange}
                    className="w-full p-2 sm:p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                  >
                    <option value="">اختر القسم</option>
                    {classes.map(cls => (
                      <option key={cls.id_class} value={cls.id_class}>
                        {cls.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={addOrUpdateSeance}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base"
                >
                  {selectedCell ? 'تحديث الحصة' : '+ إضافة الحصة'}
                </button>
                {selectedCell && (
                  <button
                    onClick={() => {
                      setSelectedCell(null)
                      setCurrentSeance({
                        jour: 'lundi',
                        debut_heure: '8',
                        fin_heure: '9',
                        id_classe: ''
                      })
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors text-sm sm:text-base"
                  >
                    إلغاء
                  </button>
                )}
              </div>
            </div>

            {/* Schedule Display - Responsive */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4">جدول الحصص الأسبوعي</h2>
              
              {mobileView ? (
                <MobileScheduleView />
              ) : (
                /* Desktop Table View */
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 sm:p-3 text-center sticky right-0 bg-gray-100 w-24 sm:w-32 text-sm sm:text-base">
                          اليوم / الوقت
                        </th>
                        {timeSlots.map(time => (
                          <th key={time} className="border p-2 sm:p-3 text-center min-w-[80px] sm:min-w-[100px] text-sm sm:text-base">
                            {time}
                          </th>
                        ))}
                        <th className="border p-2 sm:p-3 text-center sticky left-0 bg-gray-100 w-20 sm:w-24 text-sm sm:text-base">
                          إجراءات
                        </th>
                       </tr>
                    </thead>
                    <tbody>
                      {days.map(day => {
                        let currentColIndex = 0
                        const cells = []
                        
                        while (currentColIndex < timeSlots.length) {
                          const currentTimeSlot = timeSlots[currentColIndex]
                          const seance = getSeanceForTimeSlot(day.french, currentTimeSlot)
                          const isStart = isStartOfSeance(day.french, currentTimeSlot)
                          
                          if (seance && isStart) {
                            const colspan = getColSpan(day.french, currentTimeSlot)
                            const classLibelle = seance.classes?.libelle || 
                                                classes.find(c => c.id_class === seance.id_classe)?.libelle
                            const matiereLibelle = matieres.find(m => m.code_matiere === selectedMatiere)?.libelle
                            
                            cells.push(
                              <td 
                                key={currentTimeSlot} 
                                colSpan={colspan}
                                className="border p-0"
                              >
                                <div className="relative group">
                                  <div className="p-2 sm:p-3 bg-blue-50 min-h-[50px] sm:min-h-[60px]">
                                    <div className="text-center">
                                      <div className="font-medium text-blue-800 text-sm sm:text-base">
                                        {classLibelle}
                                      </div>
                                      <div className="text-xs text-blue-600 mt-1">
                                        {matiereLibelle}
                                      </div>
                                    </div>
                                    <div className="hidden group-hover:flex gap-1 absolute top-1 left-1">
                                      <button
                                        onClick={() => editSeance(seance)}
                                        className="px-1 sm:px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs"
                                      >
                                        تعديل
                                      </button>
                                      <button
                                        onClick={() => removeSeance(seance.id)}
                                        className="px-1 sm:px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                                      >
                                        حذف
                                      </button>
                                    </div>
                                  </div>
                                </div>
                               </td>
                            )
                            currentColIndex += colspan
                          } else if (!seance) {
                            cells.push(
                              <td 
                                key={currentTimeSlot} 
                                className="border p-0"
                              >
                                <div className="p-2 sm:p-3 text-gray-300 text-center min-h-[50px] sm:min-h-[60px] flex items-center justify-center text-sm sm:text-base">
                                  —
                                </div>
                               </td>
                            )
                            currentColIndex++
                          } else {
                            currentColIndex++
                          }
                        }
                        
                        return (
                          <tr key={day.french} className="hover:bg-gray-50">
                            <td className="border p-2 sm:p-3 text-center font-semibold sticky right-0 bg-white text-sm sm:text-base">
                              {day.arabic}
                             </td>
                            {cells}
                            <td className="border p-2 sm:p-3 text-center sticky left-0 bg-white">
                              <button
                                onClick={() => {
                                  const daySeance = seances.find(s => s.jour === day.french)
                                  if (daySeance) {
                                    editSeance(daySeance)
                                  }
                                }}
                                className="px-2 sm:px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs sm:text-sm"
                              >
                                إدارة
                              </button>
                             </td>
                           </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {seances.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                  لا توجد حصص مضافة. قم بإضافة حصصك باستخدام النموذج أعلاه
                </div>
              )}
            </div>

            {/* Legend and Save Button */}
            {seances.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                <div className="bg-white rounded-xl shadow p-3 sm:p-4">
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">إرشادات:</h3>
                  <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <li>• مرر الماوس فوق أي حصة لتظهر أزرار التعديل والحذف</li>
                    <li>• الحصص تمتد أفقياً عبر الساعات المحددة</li>
                    <li>• يمكنك تعديل أو حذف أي حصة من الجدول مباشرة</li>
                    <li>• جميع الحصص تحمل نفس المادة التي اخترتها</li>
                  </ul>
                </div>
                
                <button
                  onClick={saveAllSeances}
                  disabled={loading}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ الجدول'}
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}