// app/actions/sanctions.js
'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSanctions(filters = {}) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('sanctions')
      .select(`
        id,
        id_eleve,
        id_classe,
        motif,
        rapport,
        debut,
        fin,
        created_at,
        created_by,
        eleve!sanctions_id_eleve_fkey (
          id_eleve,
          nom,
          num
        ),
        classes!sanctions_id_classe_fkey (
          id_class,
          libelle
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters.studentId) {
      query = query.eq('id_eleve', filters.studentId)
    }
    
    if (filters.classId) {
      query = query.eq('id_classe', filters.classId)
    }
    
    if (filters.startDate) {
      query = query.gte('debut', filters.startDate)
    }
    
    if (filters.endDate) {
      query = query.lte('debut', filters.endDate)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching sanctions:', error)
      return { success: false, error: error.message, data: [] }
    }
    
    const formattedData = (data || []).map(sanction => ({
      id: sanction.id,
      studentId: sanction.id_eleve,
      studentName: sanction.eleve?.nom || 'غير معروف',
      studentNum: sanction.eleve?.num || '-',
      classId: sanction.id_classe,
      className: sanction.classes?.libelle || '-',
      motif: sanction.motif || '-',
      rapport: sanction.rapport,
      startDate: sanction.debut,
      endDate: sanction.fin,
      createdAt: sanction.created_at,
      createdBy: sanction.created_by
    }))
    
    return { success: true, data: formattedData, count: formattedData.length }
    
  } catch (error) {
    console.error('Unexpected error in getSanctions:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function getSanctionsStats() {
  try {
    const supabase = await createClient()
    
    // Get total sanctions count
    const { count: total, error: totalError } = await supabase
      .from('sanctions')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('Error getting total sanctions:', totalError)
      return { success: false, error: totalError.message, data: null }
    }
    
    // Get sanctions grouped by class
    const { data: sanctionsByClass, error: classError } = await supabase
      .from('sanctions')
      .select(`
        id_classe,
        classes!sanctions_id_classe_fkey (
          libelle
        )
      `)
      .not('id_classe', 'is', null)
    
    if (classError) {
      console.error('Error getting sanctions by class:', classError)
    }
    
    const classStats = {}
    if (sanctionsByClass) {
      for (const item of sanctionsByClass) {
        const className = item.classes?.libelle || item.id_classe
        classStats[className] = (classStats[className] || 0) + 1
      }
    }
    
    // Get monthly sanctions (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('sanctions')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true })
    
    if (monthlyError) {
      console.error('Error getting monthly sanctions:', monthlyError)
    }
    
    const monthlyStats = {}
    if (monthlyData) {
      monthlyData.forEach(s => {
        if (s.created_at) {
          const date = new Date(s.created_at)
          const month = date.toLocaleDateString('ar', { month: 'long', year: 'numeric' })
          monthlyStats[month] = (monthlyStats[month] || 0) + 1
        }
      })
    }
    
    return {
      success: true,
      data: {
        total: total || 0,
        byClass: classStats,
        monthly: monthlyStats
      }
    }
    
  } catch (error) {
    console.error('Error in getSanctionsStats:', error)
    return { success: false, error: error.message, data: null }
  }
}

export async function deleteSanction(sanctionId) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('sanctions')
      .delete()
      .eq('id', sanctionId)
    
    if (error) {
      console.error('Error deleting sanction:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/sanctions')
    return { success: true, message: 'تم حذف العقوبة بنجاح' }
    
  } catch (error) {
    console.error('Error in deleteSanction:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSanction(sanctionId, updateData) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sanctions')
      .update({
        motif: updateData.motif,
        rapport: updateData.rapport,
        debut: updateData.debut,
        fin: updateData.fin
      })
      .eq('id', sanctionId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating sanction:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/sanctions')
    return { success: true, data, message: 'تم تحديث العقوبة بنجاح' }
    
  } catch (error) {
    console.error('Error in updateSanction:', error)
    return { success: false, error: error.message }
  }
}

export async function getSanctionsByStudent(studentId) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sanctions')
      .select(`
        id,
        id_eleve,
        id_classe,
        motif,
        rapport,
        debut,
        fin,
        created_at,
        classes!sanctions_id_classe_fkey (
          libelle
        )
      `)
      .eq('id_eleve', studentId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching sanctions by student:', error)
      return { success: false, error: error.message, data: [] }
    }
    
    const formattedData = (data || []).map(sanction => ({
      id: sanction.id,
      studentId: sanction.id_eleve,
      classId: sanction.id_classe,
      className: sanction.classes?.libelle || '-',
      motif: sanction.motif || '-',
      rapport: sanction.rapport,
      startDate: sanction.debut,
      endDate: sanction.fin,
      createdAt: sanction.created_at
    }))
    
    return { success: true, data: formattedData, count: formattedData.length }
    
  } catch (error) {
    console.error('Error in getSanctionsByStudent:', error)
    return { success: false, error: error.message, data: [] }
  }
}

export async function addSanction(sanctionData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    const { data, error } = await supabase
      .from('sanctions')
      .insert({
        id_eleve: sanctionData.studentId,
        id_classe: sanctionData.classId,
        motif: sanctionData.motif,
        rapport: sanctionData.rapport || null,
        debut: sanctionData.startDate,
        fin: sanctionData.endDate || null,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error adding sanction:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/sanctions')
    return { success: true, data, message: 'تم إضافة العقوبة بنجاح' }
    
  } catch (error) {
    console.error('Error in addSanction:', error)
    return { success: false, error: error.message }
  }
}