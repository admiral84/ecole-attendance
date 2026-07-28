// actions/seance.js
'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireTeacher(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('غير مصرح به')
  
  const { data: userData } = await supabase
    .from('users')
    .select('role, user_id')
    .eq('user_id', user.id)
    .single()
  
  if (!userData || userData.role !== 'teacher') {
    throw new Error('غير مصرح به - هذه الصفحة للمعلمين فقط')
  }
  
  return { user, userData }
}

// ========== CRUD FUNCTIONS ==========

// SAVE a single seance
export async function saveSeance(seanceData) {
  try {
    const supabase = await createClient()
    const { user, userData } = await requireTeacher(supabase)
    
    // Validate required fields
    if (!seanceData.id_classe) throw new Error('القسم مطلوب')
    if (!seanceData.jour) throw new Error('اليوم مطلوب')
    if (!seanceData.debut_heure) throw new Error('وقت البداية مطلوب')
    if (!seanceData.fin_heure) throw new Error('وقت النهاية مطلوب')
    
    // Add user_id to the seance
    seanceData.user_id = userData.user_id
    
    const { data, error } = await supabase
      .from('seance')
      .insert([seanceData])
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/seances')
    revalidatePath(`/classes/${seanceData.id_classe}`)
    
    return { success: true, data, message: 'تم إضافة الحصة بنجاح' }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// SAVE multiple seances (bulk insert)
export async function saveTeacherSeances(seances, selectedMatiere) {
  try {
    const supabase = await createClient()
    const { user, userData } = await requireTeacher(supabase)
    
    if (!selectedMatiere) throw new Error('المادة مطلوبة')
    if (!seances || seances.length === 0) throw new Error('لا توجد حصص للحفظ')
    
    for (const seance of seances) {
      if (seance.user_id !== userData.user_id) {
        throw new Error('بيانات غير مصرح بها')
      }
    }
    
    await supabase
      .from('seance')
      .delete()
      .eq('user_id', userData.user_id)
    
    const { error } = await supabase
      .from('seance')
      .insert(seances)
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/complete-profile')
    return { success: true }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// UPDATE a seance
export async function updateSeance(seanceId, seanceData) {
  try {
    const supabase = await createClient()
    const { user, userData } = await requireTeacher(supabase)
    
    // First check if this seance belongs to the teacher
    const { data: existingSeance, error: checkError } = await supabase
      .from('seance')
      .select('user_id')
      .eq('id', seanceId)
      .single()
    
    if (checkError) throw new Error('الحصة غير موجودة')
    
    if (existingSeance.user_id !== userData.user_id) {
      throw new Error('غير مصرح لك بتعديل هذه الحصة')
    }
    
    // Update the seance
    const { data, error } = await supabase
      .from('seance')
      .update({
        id_classe: seanceData.id_classe,
        jour: seanceData.jour,
        debut_heure: seanceData.debut_heure,
        fin_heure: seanceData.fin_heure,
        code_matiere: seanceData.code_matiere,
        user_id: userData.user_id
      })
      .eq('id', seanceId)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/seances')
    revalidatePath(`/classes/${seanceData.id_classe}`)
    
    return { success: true, data, message: 'تم تحديث الحصة بنجاح' }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// DELETE a seance
export async function deleteSeance(seanceId) {
  try {
    const supabase = await createClient()
    const { user, userData } = await requireTeacher(supabase)
    
    // First check if this seance belongs to the teacher
    const { data: existingSeance, error: checkError } = await supabase
      .from('seance')
      .select('user_id, id_classe')
      .eq('id', seanceId)
      .single()
    
    if (checkError) throw new Error('الحصة غير موجودة')
    
    if (existingSeance.user_id !== userData.user_id) {
      throw new Error('غير مصرح لك بحذف هذه الحصة')
    }
    
    // Delete the seance
    const { error } = await supabase
      .from('seance')
      .delete()
      .eq('id', seanceId)
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/seances')
    revalidatePath(`/classes/${existingSeance.id_classe}`)
    
    return { success: true, message: 'تم حذف الحصة بنجاح' }
    
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// ========== QUERY FUNCTIONS ==========
export async function getTeacherSeance(classId) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('seance')
      .select('user_id')
      .eq('id_classe', classId)
    
    if (error) throw new Error(error.message)
    
    // Extract unique user_ids
    const teacherIds = [...new Set(data.map(item => item.user_id).filter(id => id))]
    
    return { success: true, data: teacherIds, rawData: data }
    
  } catch (error) {
    console.error('Error in getTeacherSeance:', error)
    return { success: false, error: error.message, data: [] }
  }
}