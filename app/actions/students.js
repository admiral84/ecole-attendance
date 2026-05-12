// actions/students.js
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

// Helper: require admin or manager role (for write operations)
async function requireAdminOrManager(supabase, user) {
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    throw new Error('غير مصرح به. فقط المديرين يمكنهم تعديل البيانات')
  }
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

// Get all students (filtered by role)
export async function getStudents() {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    
    // Get user role
    const userData = await getUserRole(supabase, user.id)
    
    if (!userData) {
      return []
    }
    
    let query = supabase
      .from('eleve')
      .select(`
        *,
        classInfo:classes!eleve_id_class_fkey(
          id_class,
          libelle
        )
      `)
      .order('nom', { ascending: true })
    
    // TEACHER: Only see students in their classes
    if (userData.role === 'teacher') {
      // Get teacher's assigned classes
      const { data: teacherClasses } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length === 0) {
        return []
      }
      
      query = query.in('id_class', assignedClassIds)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return data || []
    
  } catch (error) {
    console.error('Error in getStudents:', error)
    return []
  }
}

// Get all classes (filtered by role)
export async function getClasses() {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    
    const userData = await getUserRole(supabase, user.id)
    
    let query = supabase
      .from('classes')
      .select('*')
      .order('libelle', { ascending: true })
    
    // TEACHER: Only see their assigned classes
    if (userData?.role === 'teacher') {
      const { data: teacherClasses } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length === 0) {
        return []
      }
      
      query = query.in('id_class', assignedClassIds)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return data || []
    
  } catch (error) {
    console.error('Error in getClasses:', error)
    return []
  }
}

// Get students by class ID
export async function getStudentsByClass(classId) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به', data: [] }
    }
    
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
        console.warn(`Teacher ${user.id} attempted to access unauthorized class ${classId}`)
        return { success: false, error: 'غير مصرح به - أنت غير مسؤول عن هذا القسم', data: [] }
      }
    }
    
    const { data: students, error: studentsError } = await supabase
      .from('eleve')
      .select('*')
      .eq('id_class', classId)
      .order('nom', { ascending: true })
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return { success: false, error: studentsError.message, data: [] }
    }
    
    const formattedStudents = (students || []).map(student => ({
      id_eleve: student.id_eleve,
      matricule: student.id_eleve,
      name: student.name || `${student.nom || ''} ${student.prenom || ''}`.trim(),
      nom: student.nom || '',
      prenom: student.prenom || '',
      num: student.num || '',
      id_class: student.id_class,
      pere: student.pere || '',
      parentphone: student.parentphone || '',
      present: student.present,
      date_naissance: student.date_naissance || null
    }))
    
    return { success: true, data: formattedStudents }
    
  } catch (error) {
    console.error('Error in getStudentsByClass:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get single student by ID (with permission check)
export async function getStudentById(studentId) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    
    const userData = await getUserRole(supabase, user.id)
    
    // First get the student to check their class
    const { data: student, error: studentError } = await supabase
      .from('eleve')
      .select('*, classInfo:classes!eleve_id_class_fkey(id_class, libelle)')
      .eq('id_eleve', studentId)
      .single()
    
    if (studentError) throw new Error(studentError.message)
    
    // TEACHER: Verify they have permission to view this student
    if (userData?.role === 'teacher') {
      const { data: seance, error: seanceError } = await supabase
        .from('seance')
        .select('id')
        .eq('user_id', userData.user_id)
        .eq('id_classe', student.id_class)
        .maybeSingle()
      
      if (seanceError || !seance) {
        throw new Error('غير مصرح به - هذا التلميذ ليس في أقسامك')
      }
    }
    
    return { success: true, data: student }
    
  } catch (error) {
    console.error('Error in getStudentById:', error)
    return { success: false, error: error.message, data: null }
  }
}

// Delete student (admin/manager only)
export async function deleteStudent(id) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    await requireAdminOrManager(supabase, user)
    
    if (!id) throw new Error('معرف التلميذ مطلوب')
    
    const { error } = await supabase
      .from('eleve')
      .delete()
      .eq('id_eleve', id)
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard')
    revalidatePath('/students')
    
    return { success: true }
    
  } catch (error) {
    console.error('Error in deleteStudent:', error)
    return { success: false, error: error.message }
  }
}

// Update student (admin/manager only)
export async function updateStudent(studentData) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    await requireAdminOrManager(supabase, user)
    
    if (!studentData?.id_eleve) {
      throw new Error('بيانات التلميذ غير صالحة')
    }
    
    const { error } = await supabase
      .from('eleve')
      .update({
        nom: studentData.nom,
        prenom: studentData.prenom,
        pere: studentData.pere,
        parentphone: studentData.parentphone,
        num: studentData.num,
        id_class: studentData.id_class,
        date_naissance: studentData.date_naissance,
        present: studentData.present
      })
      .eq('id_eleve', studentData.id_eleve)
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard')
    revalidatePath('/students')
    revalidatePath(`/students/${studentData.id_eleve}`)
    
    return { success: true }
    
  } catch (error) {
    console.error('Error in updateStudent:', error)
    return { success: false, error: error.message }
  }
}

// Create new student (admin/manager only)
export async function createStudent(studentData) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    await requireAdminOrManager(supabase, user)
    
    if (!studentData.nom || !studentData.id_class) {
      throw new Error('الاسم والقسم مطلوبان')
    }
    
    const { data, error } = await supabase
      .from('eleve')
      .insert([{
        id_eleve: studentData.num_eleve || studentData.id_eleve,
        nom: studentData.nom,
        prenom: studentData.prenom || '',
        pere: studentData.pere || '',
        parentphone: studentData.phone || studentData.parentphone || '',
        num: studentData.num || '',
        id_class: studentData.id_class,
        date_naissance: studentData.date_naissance || null,
        present: true
      }])
      .select()
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard')
    revalidatePath('/students')
    
    return { success: true, data: data[0] }
    
  } catch (error) {
    console.error('Error in createStudent:', error)
    return { success: false, error: error.message }
  }
}

// Get student count by class
export async function getStudentCountByClass() {
  try {
    const supabase = await createClient()
    await requireUser(supabase)
    
    const { data, error } = await supabase
      .from('eleve')
      .select('id_class, count')
      .group('id_class')
    
    if (error) throw new Error(error.message)
    
    const countMap = {}
    data?.forEach(item => {
      countMap[item.id_class] = item.count
    })
    
    return countMap
    
  } catch (error) {
    console.error('Error in getStudentCountByClass:', error)
    return {}
  }
}

// Bulk import students (admin/manager only)
export async function bulkImportStudents(studentsList) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    await requireAdminOrManager(supabase, user)
    
    if (!studentsList || studentsList.length === 0) {
      throw new Error('لا توجد بيانات للاستيراد')
    }
    
    const { data, error } = await supabase
      .from('eleve')
      .insert(studentsList)
      .select()
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/dashboard')
    revalidatePath('/students')
    
    return { success: true, count: data?.length || 0, data }
    
  } catch (error) {
    console.error('Error in bulkImportStudents:', error)
    return { success: false, error: error.message, count: 0 }
  }
}

// Get students count
export async function getStudentsCount() {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    
    const userData = await getUserRole(supabase, user.id)
    
    let query = supabase.from('eleve').select('*', { count: 'exact', head: true })
    
    // TEACHER: Only count students in their classes
    if (userData?.role === 'teacher') {
      const { data: teacherClasses } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length > 0) {
        query = query.in('id_class', assignedClassIds)
      } else {
        return { success: true, count: 0 }
      }
    }
    
    const { count, error } = await query
    
    if (error) throw new Error(error.message)
    
    return { success: true, count: count || 0 }
    
  } catch (error) {
    console.error('Error in getStudentsCount:', error)
    return { success: false, error: error.message, count: 0 }
  }
}

// Get students count with filters
export async function getStudentsCountWithFilters(filters = {}) {
  try {
    const supabase = await createClient()
    const user = await requireUser(supabase)
    
    const userData = await getUserRole(supabase, user.id)
    
    let query = supabase.from('eleve').select('*', { count: 'exact', head: true })
    
    // Apply filters
    if (filters.present !== undefined) {
      query = query.eq('present', filters.present)
    }
    
    if (filters.id_class) {
      query = query.eq('id_class', filters.id_class)
    }
    
    // TEACHER: Filter by their classes
    if (userData?.role === 'teacher') {
      const { data: teacherClasses } = await supabase
        .from('seance')
        .select('id_classe')
        .eq('user_id', userData.user_id)
      
      const assignedClassIds = teacherClasses?.map(c => c.id_classe) || []
      
      if (assignedClassIds.length > 0) {
        query = query.in('id_class', assignedClassIds)
      } else {
        return { success: true, count: 0 }
      }
    }
    
    const { count, error } = await query
    
    if (error) throw new Error(error.message)
    
    return { success: true, count: count || 0 }
    
  } catch (error) {
    console.error('Error in getStudentsCountWithFilters:', error)
    return { success: false, error: error.message, count: 0 }
  }
}