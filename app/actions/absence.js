// app/actions/absence.js
'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all students with active absences (date_fin is null)
export async function getStudentsWithPresentFalse() {
  try {
    const supabase = await createClient()
    
    const { data: activeAbsences, error: absenceError } = await supabase
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
        eleve!absence_id_eleve_fkey (
          id_eleve,
          nom,
          num,
          present,
          id_class
        )
      `)
      .is('date_fin', null)
    
    if (absenceError) {
      console.error('Error fetching absences:', absenceError)
      return { success: false, error: absenceError.message, data: [] }
    }
    
    // Get class names separately
    const formattedStudents = []
    for (const absence of (activeAbsences || [])) {
      let className = 'بدون قسم'
      if (absence.eleve?.id_class) {
        const { data: classData } = await supabase
          .from('classes')
          .select('libelle')
          .eq('id_class', absence.eleve.id_class)
          .single()
        className = classData?.libelle || 'بدون قسم'
      }
      
      formattedStudents.push({
        id_eleve: absence.id_eleve,
        nom: absence.eleve?.nom || 'غير معروف',
        num: absence.eleve?.num || '',
        present: absence.eleve?.present || false,
        id_class: absence.id_classe,
        class_libelle: className,
        absence_start_date: absence.date_deb,
        absence_start_time: absence.heure_deb,
        absence_end_date: absence.date_fin,
        absence_end_time: absence.heure_fin,
        justified: absence.justified || false,
        is_returned: false,
        absence_id: absence.id
      })
    }
    
    return { success: true, data: formattedStudents }
    
  } catch (error) {
    console.error('Error in getStudentsWithPresentFalse:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Get absent students by class
export async function getAbsentStudentsByClass(classId) {
  try {
    const supabase = await createClient()
    
    const { data: activeAbsences, error: absenceError } = await supabase
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
        eleve!absence_id_eleve_fkey (
          id_eleve,
          nom,
          num,
          present
        )
      `)
      .eq('id_classe', classId)
      .is('date_fin', null)
    
    if (absenceError) {
      console.error('Error fetching absences by class:', absenceError)
      return { success: false, error: absenceError.message, data: [] }
    }
    
    const formattedStudents = (activeAbsences || []).map(absence => ({
      id_eleve: absence.id_eleve,
      nom: absence.eleve?.nom || 'غير معروف',
      num: absence.eleve?.num || '',
      present: absence.eleve?.present || false,
      id_class: absence.id_classe,
      absence_start_date: absence.date_deb,
      absence_start_time: absence.heure_deb,
      absence_end_date: absence.date_fin,
      absence_end_time: absence.heure_fin,
      justified: absence.justified || false,
      is_returned: false,
      absence_id: absence.id
    }))
    
    return { success: true, data: formattedStudents }
    
  } catch (error) {
    console.error('Error in getAbsentStudentsByClass:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Get absent students by specific date (for dashboard and reports)
export async function getAbsentStudentsByDateRange(date) {
  try {
    const supabase = await createClient()
    
    const { data: absences, error } = await supabase
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
        eleve!absence_id_eleve_fkey (
          id_eleve,
          nom,
          num,
          id_class
        )
      `)
      .eq('date_deb', date)
      .order('date_deb', { ascending: false })
    
    if (error) {
      console.error('Error fetching absences by date:', error)
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
        justified: absence.justified || false
      })
    }
    
    return { success: true, data: formattedAbsences }
    
  } catch (error) {
    console.error('Error in getAbsentStudentsByDateRange:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Get teacher's classes
export async function getTeacherClasses() {
  try {
    const supabase = await createClient()
    
    const { data: allClasses, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('libelle', { ascending: true })
    
    if (classesError) {
      return { success: false, error: classesError.message, data: [] }
    }
    
    return { success: true, data: allClasses || [] }
    
  } catch (error) {
    console.error('Error in getTeacherClasses:', error)
    return { success: false, error: 'حدث خطأ غير متوقع', data: [] }
  }
}

// Mark student as present (end absence)
export async function markStudentPresent(studentId, classId, startDate, startTime, endDate, endTime) {
  try {
    const supabase = await createClient()
    
    // Update the absence record with end date/time
    const { error: updateError } = await supabase
      .from('absence')
      .update({ 
        date_fin: endDate,
        heure_fin: endTime
      })
      .eq('id_eleve', studentId)
      .eq('id_classe', classId)
      .eq('date_deb', startDate)
      .is('date_fin', null)
    
    if (updateError) {
      console.error('Error updating absence:', updateError)
      return { success: false, error: updateError.message }
    }
    
    // Update student's present status in eleve table
    const { error: presentError } = await supabase
      .from('eleve')
      .update({ present: true })
      .eq('id_eleve', studentId)
    
    if (presentError) {
      console.error('Error updating student present status:', presentError)
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
    
    // Check if student already has an active absence
    const { data: existingAbsence } = await supabase
      .from('absence')
      .select('id')
      .eq('id_eleve', studentId)
      .is('date_fin', null)
      .maybeSingle()
    
    if (existingAbsence) {
      return { success: false, error: 'هذا التلميذ مسجل غائب بالفعل' }
    }
    
    // Create absence record
    const { error: absenceError } = await supabase
      .from('absence')
      .insert({
        id_eleve: studentId,
        id_classe: classId,
        date_deb: startDate,
        heure_deb: startTime,
        justified: justified
      })
    
    if (absenceError) {
      console.error('Error creating absence:', absenceError)
      return { success: false, error: absenceError.message }
    }
    
    // Update student's present status
    await supabase
      .from('eleve')
      .update({ present: false })
      .eq('id_eleve', studentId)
    
    revalidatePath('/attendance')
    revalidatePath('/dashboard')
    
    return { success: true }
    
  } catch (error) {
    console.error('Error in markStudentAbsent:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

// Send absence notification
export async function sendAbsenceNotification(studentId, classId, startDate, startTime, isJustified = false) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    // Get teacher name
    const { data: userData } = await supabase
      .from('users')
      .select('nom, prenom')
      .eq('user_id', user.id)
      .single()
    
    // Create notification
    const { error: notificationError } = await supabase
      .from('absence_notifications')
      .insert({
        student_id: studentId,
        class_id: classId,
        absence_date: startDate,
        absence_time: startTime,
        is_justified: isJustified,
        status: 'pending',
        teacher_matricule: user.id
      })
    
    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      return { success: false, error: notificationError.message }
    }
    
    revalidatePath('/attendance')
    
    return { 
      success: true,
      teacherName: userData ? `${userData.nom} ${userData.prenom || ''}` : ''
    }
    
  } catch (error) {
    console.error('Error in sendAbsenceNotification:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

// Add to app/actions/absence.js

// Get attendance history for a specific student
export async function getAttendanceByStudent(studentId) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('absence')
      .select('*')
      .eq('id_eleve', studentId)
      .order('date_deb', { ascending: false })
    
    if (error) {
      console.error('Error fetching attendance by student:', error)
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
      justified: record.justified || false
    }))
    
    return { success: true, data: formattedAttendance, count: formattedAttendance.length }
    
  } catch (error) {
    console.error('Error in getAttendanceByStudent:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get attendance summary for a student (optional - for stats)
export async function getAttendanceSummaryByStudent(studentId) {
  try {
    const supabase = await createClient()
    
    // Get total absences
    const { count: totalAbsences, error: totalError } = await supabase
      .from('absence')
      .select('*', { count: 'exact', head: true })
      .eq('id_eleve', studentId)
    
    if (totalError) {
      console.error('Error counting total absences:', totalError)
      return { success: false, error: totalError.message, data: null }
    }
    
    // Get justified absences
    const { count: justifiedAbsences, error: justifiedError } = await supabase
      .from('absence')
      .select('*', { count: 'exact', head: true })
      .eq('id_eleve', studentId)
      .eq('justified', true)
    
    if (justifiedError) {
      console.error('Error counting justified absences:', justifiedError)
      return { success: false, error: justifiedError.message, data: null }
    }
    
    // Get current month absences
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { count: currentMonthAbsences, error: monthError } = await supabase
      .from('absence')
      .select('*', { count: 'exact', head: true })
      .eq('id_eleve', studentId)
      .gte('date_deb', startOfMonth.toISOString())
    
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