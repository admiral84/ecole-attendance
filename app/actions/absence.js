'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper: require authenticated user
async function requireUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('غير مصرح به')
  }
  return user
}

// Helper: get user role
async function getUserRole(supabase, userId) {
  const { data: userData } = await supabase
    .from('users')
    .select('role, user_id')
    .eq('user_id', userId)
    .single()
  return userData
}

// Get currently absent students (active absences with date_fin IS NULL)
export async function getStudentsWithPresentFalse() {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: [] }
    }
    
    // Query absence table directly for active absences
    let query = supabase
      .from('absence')
      .select(`
        id,
        id_eleve,
        id_classe,
        date_deb,
        heure_deb,
        date_fin,
        heure_fin,
        justified,
        present,
        eleve!absence_id_eleve_fkey (
          id_eleve,
          nom,
          num,
          classes!eleve_id_class_fkey (
            libelle
          )
        )
      `)
      .is('date_fin', null)
    
    // TEACHER: Filter by their assigned classes only
    if (userData.role === 'teacher') {
      const { data: teacherClasses } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length === 0) {
        return { success: true, data: [] }
      }
      
      query = query.in('id_classe', assignedClassIds)
    }
    
    const { data: absences, error: absencesError } = await query.order('date_deb', { ascending: false })
    
    if (absencesError) {
      console.error('Error fetching absent students:', absencesError)
      return { success: false, error: absencesError.message, data: [] }
    }
    
    const formattedStudents = (absences || []).map(absence => ({
      id_eleve: absence.id_eleve,
      nom: absence.eleve?.nom || 'غير معروف',
      num: absence.eleve?.num || '',
      present: absence.present,
      id_class: absence.id_classe,
      class_libelle: absence.eleve?.classes?.libelle || 'بدون قسم',
      absence_id: absence.id,
      absence_start_date: absence.date_deb,
      absence_start_time: absence.heure_deb,
      absence_end_date: absence.date_fin,
      absence_end_time: absence.heure_fin,
      justified: absence.justified || false,
      is_returned: false
    }))
    
    return { success: true, data: formattedStudents }
    
  } catch (error) {
    console.error('Error in getStudentsWithPresentFalse:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Get absent students by class (active absences only)
export async function getAbsentStudentsByClass(classId) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: [] }
    }
    
    // TEACHER: Verify they have permission to access this class
    if (userData.role === 'teacher') {
      const { data: seance, error: seanceError } = await supabase
        .from('seance')
        .select('id')
        .eq('user_id', userData.user_id)
        .eq('id_classe', classId)
        .maybeSingle()
      
      if (seanceError || !seance) {
        return { success: false, error: 'غير مصرح به - أنت غير مسؤول عن هذا القسم', data: [] }
      }
    }
    
    // Get active absences for this class
    const { data: absences, error: absenceError } = await supabase
      .from('absence')
      .select(`
        id,
        id_eleve,
        id_classe,
        date_deb,
        heure_deb,
        date_fin,
        heure_fin,
        justified,
        present,
        eleve!absence_id_eleve_fkey (
          id_eleve,
          nom,
          num
        )
      `)
      .eq('id_classe', classId)
      .is('date_fin', null)
      .order('date_deb', { ascending: false })
    
    if (absenceError) {
      return { success: false, error: absenceError.message, data: [] }
    }
    
    const formattedStudents = (absences || []).map(absence => ({
      id_eleve: absence.id_eleve,
      nom: absence.eleve?.nom || 'غير معروف',
      num: absence.eleve?.num || '',
      justified: absence.justified || false,
      present: absence.present,
      class_libelle: null,
      id_class: absence.id_classe,
      absence_id: absence.id,
      absence_start_date: absence.date_deb,
      absence_start_time: absence.heure_deb,
      absence_end_date: absence.date_fin,
      absence_end_time: absence.heure_fin,
      is_returned: false
    }))
    
    return { success: true, data: formattedStudents }
    
  } catch (error) {
    console.error('Error in getAbsentStudentsByClass:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Get absent students by specific date
export async function getAbsentStudentsByDateRange(date) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: [] }
    }
    
    let query = supabase
      .from('absence')
      .select(`
        id,
        id_eleve,
        id_classe,
        date_deb,
        heure_deb,
        date_fin,
        heure_fin,
        justified,
        present,
        eleve!absence_id_eleve_fkey (
          id_eleve,
          nom,
          num,
          id_class
        )
      `)
      .eq('date_deb', date)
    
    if (userData.role === 'teacher') {
      const { data: teacherClasses } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length === 0) {
        return { success: true, data: [] }
      }
      
      query = query.in('id_classe', assignedClassIds)
    }
    
    const { data: absences, error } = await query.order('date_deb', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message, data: [] }
    }
    
    const formattedAbsences = []
    for (const absence of (absences || [])) {
      let className = 'بدون قسم'
      if (absence.eleve?.id_class) {
        const { data: classData } = await supabase
          .from('classes')
          .select('libelle')
          .eq('id_class', absence.eleve.id_class)
          .single()
        className = classData?.libelle || 'بدون قسم'
      }
      
      formattedAbsences.push({
        id: absence.id,
        student_id: absence.id_eleve,
        student_name: absence.eleve?.nom || 'غير معروف',
        student_num: absence.eleve?.num,
        class_libelle: className,
        absence_start_date: absence.date_deb,
        absence_start_time: absence.heure_deb,
        absence_end_date: absence.date_fin,
        absence_end_time: absence.heure_fin,
        justified: absence.justified || false,
        present: absence.present,
        is_returned: absence.date_fin !== null
      })
    }
    
    return { success: true, data: formattedAbsences }
    
  } catch (error) {
    console.error('Error in getAbsentStudentsByDateRange:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Get teacher's classes (or all classes for admin/manager)
export async function getTeacherClasses() {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: [] }
    }
    
    if (userData.role === 'admin' || userData.role === 'manager') {
      const { data: allClasses, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('libelle', { ascending: true })
      
      if (classesError) {
        return { success: false, error: classesError.message, data: [] }
      }
      
      return { success: true, data: allClasses || [] }
    }
    
    const { data: teacherClasses, error: seanceError } = await supabase
      .from('seance')
      .select(`
        id_classe,
        classes!inner (
          id_class,
          libelle,
          nbstudent
        )
      `)
      .eq('user_id', userData.user_id)
    
    if (seanceError) {
      return { success: false, error: seanceError.message, data: [] }
    }
    
    const uniqueClasses = []
    const classMap = new Map()
    
    for (const item of (teacherClasses || [])) {
      if (item.classes && !classMap.has(item.classes.id_class)) {
        classMap.set(item.classes.id_class, item.classes)
        uniqueClasses.push(item.classes)
      }
    }
    
    return { success: true, data: uniqueClasses }
    
  } catch (error) {
    console.error('Error in getTeacherClasses:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Mark student as present (end absence)
export async function markStudentPresent(studentId, classId, startDate, startTime, endDate, endTime) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData || userData.role !== 'teacher') {
      return { success: false, error: 'غير مصرح به - فقط الأساتذة' }
    }
    
    const { data: seance } = await supabase
      .from('seance')
      .select('id')
      .eq('user_id', userData.user_id)
      .eq('id_classe', classId)
      .maybeSingle()
    
    if (!seance) {
      return { success: false, error: 'غير مصرح به - أنت غير مسؤول عن هذا القسم' }
    }
    
    const { error: updateError } = await supabase
      .from('absence')
      .update({ 
        date_fin: endDate,
        heure_fin: endTime,
        present: true
      })
      .eq('id_eleve', studentId)
      .eq('id_classe', classId)
      .eq('date_deb', startDate)
      .eq('heure_deb', startTime)
      .is('date_fin', null)
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    revalidatePath('/attendance')
    revalidatePath('/dashboard')
    revalidatePath('/classes')
    
    return { success: true }
    
  } catch (error) {
    console.error('Error in markStudentPresent:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

// Mark student as absent (create absence record)
export async function markStudentAbsent(studentId, classId, startDate, startTime, justified = false) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData || userData.role !== 'teacher') {
      return { success: false, error: 'غير مصرح به - فقط الأساتذة' }
    }
    
    const { data: seance } = await supabase
      .from('seance')
      .select('id')
      .eq('user_id', userData.user_id)
      .eq('id_classe', classId)
      .maybeSingle()
    
    if (!seance) {
      return { success: false, error: 'غير مصرح به - أنت غير مسؤول عن هذا القسم' }
    }
    
    const { data: student } = await supabase
      .from('eleve')
      .select('id_eleve')
      .eq('id_eleve', studentId)
      .eq('id_class', classId)
      .maybeSingle()
    
    if (!student) {
      return { success: false, error: 'هذا التلميذ ليس مسجلاً في هذا القسم' }
    }
    
    const { data: existingAbsence } = await supabase
      .from('absence')
      .select('id')
      .eq('id_eleve', studentId)
      .is('date_fin', null)
      .maybeSingle()
    
    if (existingAbsence) {
      return { success: false, error: 'هذا التلميذ مسجل غائب بالفعل' }
    }
    
    const { error: absenceError } = await supabase
      .from('absence')
      .insert({
        id_eleve: studentId,
        id_classe: classId,
        date_deb: startDate,
        heure_deb: startTime,
        justified: justified,
        marked_by: userData.user_id,
        present: false
      })
    
    if (absenceError) {
      return { success: false, error: absenceError.message }
    }
    
    revalidatePath('/attendance')
    revalidatePath('/dashboard')
    
    return { success: true }
    
  } catch (error) {
    console.error('Error in markStudentAbsent:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

// Send absence notification
export async function sendAbsenceNotification(studentId, classLibelle, startDate, startTime, isJustified = false) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData || userData.role !== 'teacher') {
      return { success: false, error: 'غير مصرح به - فقط الأساتذة' }
    }
    
    try {
      await supabase
        .from('absence_notifications')
        .insert({
          student_id: studentId,
          class_id: classLibelle,
          absence_date: startDate,
          absence_time: startTime,
          is_justified: isJustified,
          status: 'pending',
          teacher_matricule: user.id
        })
    } catch (notifError) {
      // Notification table optional
    }
    
    revalidatePath('/attendance')
    
    return { success: true, teacherName: userData.nom || '' }
    
  } catch (error) {
    console.error('Error in sendAbsenceNotification:', error)
    return { success: true, teacherName: '' }
  }
}

// Get attendance history for a specific student
export async function getAttendanceByStudent(studentId) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: [] }
    }
    
    if (userData.role === 'teacher') {
      const { data: student } = await supabase
        .from('eleve')
        .select('id_class')
        .eq('id_eleve', studentId)
        .single()
      
      if (student?.id_class) {
        const { data: seance } = await supabase
          .from('seance')
          .select('id')
          .eq('user_id', userData.user_id)
          .eq('id_classe', student.id_class)
          .maybeSingle()
        
        if (!seance) {
          return { success: false, error: 'غير مصرح به', data: [] }
        }
      }
    }
    
    const { data, error } = await supabase
      .from('absence')
      .select('*')
      .eq('id_eleve', studentId)
      .order('date_deb', { ascending: false })
    
    if (error) {
      return { success: false, error: error.message, data: [] }
    }
    
    const formattedAttendance = (data || []).map(record => ({
      id: record.id,
      studentId: record.id_eleve,
      classId: record.id_classe,
      date_deb: record.date_deb,
      heure_deb: record.heure_deb,
      date_fin: record.date_fin,
      heure_fin: record.heure_fin,
      justified: record.justified || false,
      present: record.present
    }))
    
    return { success: true, data: formattedAttendance, count: formattedAttendance.length }
    
  } catch (error) {
    console.error('Error in getAttendanceByStudent:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get attendance summary for a student
export async function getAttendanceSummaryByStudent(studentId) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: null }
    }
    
    if (userData.role === 'teacher') {
      const { data: student } = await supabase
        .from('eleve')
        .select('id_class')
        .eq('id_eleve', studentId)
        .single()
      
      if (student?.id_class) {
        const { data: seance } = await supabase
          .from('seance')
          .select('id')
          .eq('user_id', userData.user_id)
          .eq('id_classe', student.id_class)
          .maybeSingle()
        
        if (!seance) {
          return { success: false, error: 'غير مصرح به', data: null }
        }
      }
    }
    
    const { count: totalAbsences, error: totalError } = await supabase
      .from('absence')
      .select('*', { count: 'exact', head: true })
      .eq('id_eleve', studentId)
    
    if (totalError) {
      return { success: false, error: totalError.message, data: null }
    }
    
    const { count: justifiedAbsences, error: justifiedError } = await supabase
      .from('absence')
      .select('*', { count: 'exact', head: true })
      .eq('id_eleve', studentId)
      .eq('justified', true)
    
    if (justifiedError) {
      return { success: false, error: justifiedError.message, data: null }
    }
    
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { count: currentMonthAbsences, error: monthError } = await supabase
      .from('absence')
      .select('*', { count: 'exact', head: true })
      .eq('id_eleve', studentId)
      .gte('date_deb', startOfMonth.toISOString().split('T')[0])
    
    if (monthError) {
      console.error('Error counting current month absences:', monthError)
    }
    
    return {
      success: true,
      data: {
        total: totalAbsences || 0,
        justified: justifiedAbsences || 0,
        unJustified: (totalAbsences || 0) - (justifiedAbsences || 0),
        currentMonth: currentMonthAbsences || 0
      }
    }
    
  } catch (error) {
    console.error('Error in getAttendanceSummaryByStudent:', error)
    return { success: false, error: error.message, data: null }
  }
}