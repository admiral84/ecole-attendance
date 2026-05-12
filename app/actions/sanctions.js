'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
        created_at
      `)
      .eq('id_eleve', studentId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching sanctions by student:', error.message)
      return { success: false, error: error.message, data: [] }
    }
    
    // Get class names separately
    const formattedData = []
    for (const sanction of (data || [])) {
      let className = '-'
      if (sanction.id_classe) {
        const { data: classData } = await supabase
          .from('classes')
          .select('libelle')
          .eq('id_class', sanction.id_classe)
          .single()
        className = classData?.libelle || '-'
      }
      
      formattedData.push({
        id: sanction.id,
        studentId: sanction.id_eleve,
        classId: sanction.id_classe,
        className: className,
        motif: sanction.motif || '-',
        rapport: sanction.rapport,
        startDate: sanction.debut,
        endDate: sanction.fin,
        createdAt: sanction.created_at
      })
    }
    
    return { success: true, data: formattedData, count: formattedData.length }
    
  } catch (error) {
    console.error('Error in getSanctionsByStudent:', error.message)
    return { success: false, error: error.message, data: [] }
  }
}

export async function addSanction(sanctionData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به. الرجاء تسجيل الدخول أولاً' }
    }
    
    const { error } = await supabase
      .from('sanctions')
      .insert({
        id_eleve: sanctionData.studentId,
        id_classe: sanctionData.classId,
        motif: sanctionData.motif,
        rapport: sanctionData.rapport,
        debut: sanctionData.startDate,
        fin: sanctionData.endDate || null,
        created_by: user.id
      })
    
    if (error) {
      console.error('Error adding sanction:', error.message)
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/students/${sanctionData.studentId}`)
    revalidatePath('/sanctions')
    
    return { success: true, message: 'تم إضافة العقوبة بنجاح' }
    
  } catch (error) {
    console.error('Error in addSanction:', error.message)
    return { success: false, error: error.message }
  }
}

export async function deleteSanction(sanctionId) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به. الرجاء تسجيل الدخول أولاً' }
    }
    
    const { error } = await supabase
      .from('sanctions')
      .delete()
      .eq('id', sanctionId)
    
    if (error) {
      console.error('Error deleting sanction:', error.message)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/sanctions')
    
    return { 
      success: true, 
      message: 'تم حذف العقوبة بنجاح' 
    }
    
  } catch (error) {
    console.error('Error in deleteSanction:', error.message)
    return { success: false, error: error.message }
  }
}

export async function getSanctions(filters = {}) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in getSanctions:', authError?.message)
      return { success: false, error: 'غير مصرح به', data: [] }
    }
    
    // Start building the query - select only from sanctions table
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
        created_by
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (filters.studentId && filters.studentId.trim() !== '') {
      query = query.eq('id_eleve', filters.studentId)
    }
    
    if (filters.classId && filters.classId !== 'all' && filters.classId !== '') {
      query = query.eq('id_classe', filters.classId)
    }
    
    if (filters.startDate && filters.startDate !== '') {
      query = query.gte('debut', filters.startDate)
    }
    
    if (filters.endDate && filters.endDate !== '') {
      query = query.lte('debut', filters.endDate)
    }
    
    const { data: sanctionsData, error } = await query
    
    if (error) {
      console.error('Error fetching sanctions:', error.message)
      return { success: false, error: error.message, data: [] }
    }
    
    if (!sanctionsData || sanctionsData.length === 0) {
      return { success: true, data: [], count: 0 }
    }
    
    // Get all unique student IDs to fetch student names
    const studentIds = [...new Set(sanctionsData.map(s => s.id_eleve).filter(id => id))]
    const classIds = [...new Set(sanctionsData.map(s => s.id_classe).filter(id => id))]
    
    // Fetch student names
    const studentMap = new Map()
    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('eleve')
        .select('id_eleve, nom, prenom, num')
        .in('id_eleve', studentIds)
      
      if (students) {
        students.forEach(student => {
          studentMap.set(student.id_eleve, {
            name: `${student.nom || ''} ${student.prenom || ''}`.trim() || 'غير معروف',
            num: student.num || '-'
          })
        })
      }
    }
    
    // Fetch class names
    const classMap = new Map()
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id_class, libelle')
        .in('id_class', classIds)
      
      if (classes) {
        classes.forEach(cls => {
          classMap.set(cls.id_class, cls.libelle || '-')
        })
      }
    }
    
    // Format the data
    const formattedData = sanctionsData.map(sanction => {
      const studentInfo = studentMap.get(sanction.id_eleve) || { name: 'غير معروف', num: '-' }
      
      return {
        id: sanction.id,
        studentId: sanction.id_eleve,
        studentName: studentInfo.name,
        studentNum: studentInfo.num,
        classId: sanction.id_classe,
        className: classMap.get(sanction.id_classe) || '-',
        motif: sanction.motif || '-',
        rapport: sanction.rapport,
        startDate: sanction.debut,
        endDate: sanction.fin,
        createdAt: sanction.created_at,
        createdBy: sanction.created_by
      }
    })
    
    return { success: true, data: formattedData, count: formattedData.length }
    
  } catch (error) {
    console.error('Unexpected error in getSanctions:', error.message)
    return { success: false, error: error.message, data: [] }
  }
}

export async function getSanctionsStats() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in getSanctionsStats:', authError?.message)
      return { success: false, error: 'غير مصرح به', data: null }
    }
    
    // Get total sanctions count
    const { count: total, error: totalError } = await supabase
      .from('sanctions')
      .select('*', { count: 'exact', head: true })
    
    if (totalError) {
      console.error('Error getting total sanctions:', totalError.message)
      return { success: false, error: totalError.message, data: null }
    }
    
    // Get sanctions grouped by class
    const { data: sanctionsByClass, error: classError } = await supabase
      .from('sanctions')
      .select('id_classe')
      .not('id_classe', 'is', null)
    
    if (classError) {
      console.error('Error getting sanctions by class:', classError.message)
    }
    
    // Get class names separately
    const classStats = {}
    if (sanctionsByClass && sanctionsByClass.length > 0) {
      const uniqueClassIds = [...new Set(sanctionsByClass.map(s => s.id_classe))]
      
      const { data: classes } = await supabase
        .from('classes')
        .select('id_class, libelle')
        .in('id_class', uniqueClassIds)
      
      const classMap = new Map()
      if (classes) {
        classes.forEach(cls => {
          classMap.set(cls.id_class, cls.libelle)
        })
      }
      
      // Count sanctions per class
      sanctionsByClass.forEach(item => {
        const className = classMap.get(item.id_classe) || item.id_classe
        classStats[className] = (classStats[className] || 0) + 1
      })
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
      console.error('Error getting monthly sanctions:', monthlyError.message)
    }
    
    const monthlyStats = {}
    if (monthlyData && monthlyData.length > 0) {
      monthlyData.forEach(s => {
        if (s.created_at) {
          const date = new Date(s.created_at)
          const month = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
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
    console.error('Error in getSanctionsStats:', error.message)
    return { 
      success: false, 
      error: error.message, 
      data: {
        total: 0,
        byClass: {},
        monthly: {}
      } 
    }
  }
}