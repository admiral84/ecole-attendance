// actions/classes.js
'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all classes (filtered by user role)
export async function getAllClasses() {
  try {
    const supabase = await createClient()
    
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به', data: [] }
    }
    
    // 2. Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, user_id')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: [] }
    }
    
    let classesQuery = supabase
      .from('classes')
      .select('*')
      .order('libelle', { ascending: true })
    
    // 3. TEACHER: Filter by their assigned classes only
    if (userData.role === 'teacher') {
      const { data: teacherClasses, error: seanceError } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      if (seanceError) {
        console.error('Error fetching teacher classes:', seanceError)
        return { success: false, error: seanceError.message, data: [] }
      }
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length === 0) {
        return { success: true, data: [] }
      }
      
      classesQuery = classesQuery.in('id_class', assignedClassIds)
    }
    
    const { data: classes, error: classesError } = await classesQuery
    
    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return { success: false, error: classesError.message, data: [] }
    }
    
    // Get student count for each class
    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const { count, error: countError } = await supabase
          .from('eleve')
          .select('*', { count: 'exact', head: true })
          .eq('id_class', cls.id_class)
        
        return {
          ...cls,
          student_count: count || 0
        }
      })
    )
    
    return { success: true, data: classesWithCount }
    
  } catch (error) {
    console.error('Error in getAllClasses:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get class by ID (with permission check)
export async function getClassById(classId) {
  try {
    const supabase = await createClient()
    
    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به', data: null }
    }
    
    // 2. Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, user_id')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      return { success: false, error: 'لم يتم العثور على المستخدم', data: null }
    }
    
    // 3. TEACHER: Verify they have permission to view this class
    if (userData.role === 'teacher') {
      const { data: seance, error: seanceError } = await supabase
        .from('seance')
        .select('id')
        .eq('user_id', userData.user_id)
        .eq('id_classe', classId)
        .maybeSingle()
      
      if (seanceError || !seance) {
        console.warn(`Teacher ${user.id} attempted to access unauthorized class ${classId}`)
        return { success: false, error: 'غير مصرح به - أنت غير مسؤول عن هذا القسم', data: null }
      }
    }
    
    // 4. Get class data
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id_class', classId)
      .single()
    
    if (classError) {
      return { success: false, error: classError.message, data: null }
    }
    
    return { success: true, data: classData }
    
  } catch (error) {
    console.error('Error in getClassById:', error)
    return { success: false, error: error.message, data: null }
  }
}

// Create a new class (admin/manager only)
export async function createClass(classData) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      return { success: false, error: 'لم يتم العثور على المستخدم' }
    }
    
    // Only admin and manager can create classes
    if (userData.role !== 'admin' && userData.role !== 'manager') {
      return { success: false, error: 'غير مصرح به. فقط المديرين يمكنهم إضافة أقسام' }
    }
    
    // Validate required fields
    if (!classData.id_class || classData.id_class.trim() === '') {
      return { success: false, error: 'معرف القسم مطلوب' }
    }
    
    if (!classData.libelle || classData.libelle.trim() === '') {
      return { success: false, error: 'اسم القسم مطلوب' }
    }
    
    // Check if class with same ID already exists
    const { data: existingClassById } = await supabase
      .from('classes')
      .select('id_class')
      .eq('id_class', classData.id_class.trim())
      .maybeSingle()
    
    if (existingClassById) {
      return { success: false, error: 'معرف القسم موجود بالفعل' }
    }
    
    // Check if class with same name already exists
    const { data: existingClassByName } = await supabase
      .from('classes')
      .select('id_class')
      .eq('libelle', classData.libelle.trim())
      .maybeSingle()
    
    if (existingClassByName) {
      return { success: false, error: 'قسم بنفس الاسم موجود بالفعل' }
    }
    
    // Insert new class
    const { data, error } = await supabase
      .from('classes')
      .insert([
        {
          id_class: classData.id_class.trim(),
          libelle: classData.libelle.trim(),
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating class:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/classes')
    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      data: { ...data, student_count: 0 },
      message: 'تم إضافة القسم بنجاح' 
    }
    
  } catch (error) {
    console.error('Error in createClass:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

// Update an existing class (admin/manager only)
export async function updateClass(classId, classData) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      return { success: false, error: 'لم يتم العثور على المستخدم' }
    }
    
    // Only admin and manager can update classes
    if (userData.role !== 'admin' && userData.role !== 'manager') {
      return { success: false, error: 'غير مصرح به. فقط المديرين يمكنهم تعديل الأقسام' }
    }
    
    // Validate class ID
    if (!classId) {
      return { success: false, error: 'معرف القسم مطلوب' }
    }
    
    // Validate required fields
    if (!classData.libelle || classData.libelle.trim() === '') {
      return { success: false, error: 'اسم القسم مطلوب' }
    }
    
    // Check if another class with same name exists (excluding current class)
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id_class')
      .eq('libelle', classData.libelle.trim())
      .neq('id_class', classId)
      .maybeSingle()
    
    if (existingClass) {
      return { success: false, error: 'قسم بنفس الاسم موجود بالفعل' }
    }
    
    // Update class
    const { data, error } = await supabase
      .from('classes')
      .update({
        libelle: classData.libelle.trim(),
      })
      .eq('id_class', classId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating class:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/classes')
    revalidatePath(`/classes/${classId}`)
    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      data: data,
      message: 'تم تحديث القسم بنجاح' 
    }
    
  } catch (error) {
    console.error('Error in updateClass:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}

// Delete a class (ADMIN only)
export async function deleteClass(classId) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    // Get user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      return { success: false, error: 'لم يتم العثور على المستخدم' }
    }
    
    // ONLY admin can delete classes (not even manager)
    if (userData.role !== 'admin') {
      return { success: false, error: 'غير مصرح به. فقط المدير يمكنه حذف الأقسام' }
    }
    
    // Validate class ID
    if (!classId) {
      return { success: false, error: 'معرف القسم مطلوب' }
    }
    
    // Check if class has students
    const { count: studentCount, error: countError } = await supabase
      .from('eleve')
      .select('*', { count: 'exact', head: true })
      .eq('id_class', classId)
    
    if (countError) {
      console.error('Error checking students in class:', countError)
    }
    
    if (studentCount && studentCount > 0) {
      return { 
        success: false, 
        error: `لا يمكن حذف القسم لأنه يحتوي على ${studentCount} تلميذ. قم بنقل التلاميذ أولاً.` 
      }
    }
    
    // Delete class
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id_class', classId)
    
    if (error) {
      console.error('Error deleting class:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/classes')
    revalidatePath('/dashboard')
    
    return { 
      success: true, 
      message: 'تم حذف القسم بنجاح' 
    }
    
  } catch (error) {
    console.error('Error in deleteClass:', error)
    return { success: false, error: 'حدث خطأ غير متوقع' }
  }
}