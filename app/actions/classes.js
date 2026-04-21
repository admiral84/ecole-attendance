// actions/class.js
'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get all classes
export async function getAllClasses() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به', data: [] }
    }
    
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('libelle', { ascending: true })
    
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

// Get class by ID
export async function getClassById(classId) {
  try {
    const supabase = await createClient()
    
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











// Create a new class
export async function createClass(classData) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    // Validate required fields
    if (!classData.id_class || classData.id_class.trim() === '') {
      return { success: false, error: 'معرف القسم مطلوب' }
    }
    
    if (!classData.libelle || classData.libelle.trim() === '') {
      return { success: false, error: 'اسم القسم مطلوب' }
    }
    
    // Check if class with same ID already exists
    const { data: existingClassById, error: checkIdError } = await supabase
      .from('classes')
      .select('id_class')
      .eq('id_class', classData.id_class.trim())
      .maybeSingle()
    
    if (existingClassById) {
      return { success: false, error: 'معرف القسم موجود بالفعل' }
    }
    
    // Check if class with same name already exists
    const { data: existingClassByName, error: checkNameError } = await supabase
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
    
    // Revalidate paths
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

// Update an existing class
export async function updateClass(classId, classData) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
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
    const { data: existingClass, error: checkError } = await supabase
      .from('classes')
      .select('id_class')
      .eq('libelle', classData.libelle.trim())
      .neq('id_class', classId)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking existing class:', checkError)
    }
    
    if (existingClass) {
      return { success: false, error: 'قسم بنفس الاسم موجود بالفعل' }
    }
    
    // Update class
    const { data, error } = await supabase
      .from('classes')
      .update({
        libelle: classData.libelle.trim(),
        // Add other fields if needed
      })
      .eq('id_class', classId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating class:', error)
      return { success: false, error: error.message }
    }
    
    // Revalidate paths
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

// Delete a class
export async function deleteClass(classId) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به' }
    }
    
    // Check if user has admin role (only admins can delete classes)
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      console.error('Error fetching user role:', userError)
    }
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'غير مصرح به. فقط المديرين يمكنهم حذف الأقسام' }
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
    
    // Revalidate paths
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


