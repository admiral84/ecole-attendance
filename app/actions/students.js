'use server'

import { createClient } from '../../lib/supabase/server'

// Helper: require authenticated user
async function requireUser(supabase) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('غير مصرح به')
  }
  
  return user
}

// Helper: require admin/manager role
async function requireAdminOrManager(supabase, user) {
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'teacher')) {
    console.log(currentUser.email)

    throw new Error('غير مصرح به')
  }
}

// Get all students
export async function getStudents() {
  const supabase = await createClient()
  await requireUser(supabase)

  const { data, error } = await supabase
    .from('eleve')
    .select('*')
    .order('nom')

  if (error) throw new Error(error.message)
  return data || []
}

// Get all classes
export async function getClasses() {
  const supabase = await createClient()
  await requireUser(supabase)

  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('libelle')

  if (error) throw new Error(error.message)
  return data || []
}

// Get students by class ID
export async function getStudentsByClass(classId) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in getStudentsByClass:', authError)
      return { success: false, error: 'غير مصرح به', data: [] }
    }
    
    console.log('Fetching students for class ID:', classId)
    
    // Get students from eleve table
    const { data: students, error: studentsError } = await supabase
      .from('eleve')
      .select('*')
      .eq('id_class', classId)
      .order('nom', { ascending: true })
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return { success: false, error: studentsError.message, data: [] }
    }
    
    console.log('Students found:', students?.length || 0)
    
    // Format student data
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
      present: student.present
    }))
    
    return { success: true, data: formattedStudents }
  } catch (error) {
    console.error('Error in getStudentsByClass:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// Get single student by ID
export async function getStudentById(studentId) {
  try {
    const supabase = await createClient()
    await requireUser(supabase)

    const { data, error } = await supabase
      .from('eleve')
      .select('*')
      .eq('id_eleve', studentId)
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error) {
    console.error('Error in getStudentById:', error)
    return { success: false, error: error.message, data: null }
  }
}

// Delete student
export async function deleteStudent(id) {
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
}

// Update student
export async function updateStudent(studentData) {
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
      present: studentData.present
    })
    .eq('id_eleve', studentData.id_eleve)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/students')
  
  return { success: true }
}

// Create new student
export async function createStudent(studentData) {
  const supabase = await createClient()
  const user = await requireUser(supabase)
  await requireAdminOrManager(supabase, user)

  if (!studentData.nom || !studentData.id_class) {
    throw new Error('الاسم والقسم مطلوبان')
  }

  const { data, error } = await supabase
    .from('eleve')
    .insert([{
      nom: studentData.nom,
      prenom: studentData.prenom || '',
      pere: studentData.pere || '',
      parentphone: studentData.parentphone || '',
      num: studentData.num || '',
      id_class: studentData.id_class,
      
    }])
    .select()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard')
  revalidatePath('/students')
  
  return { success: true, data: data[0] }
}

// Get student count by class
export async function getStudentCountByClass() {
  const supabase = await createClient()
  await requireUser(supabase)

  const { data, error } = await supabase
    .from('eleve')
    .select('id_class', { count: 'exact' })
    .group('id_class')

  if (error) throw new Error(error.message)
  
  const countMap = {}
  data.forEach(item => {
    countMap[item.id_class] = item.count
  })
  
  return countMap
}

// Bulk import students
export async function bulkImportStudents(studentsList) {
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
  
  return { success: true, count: data.length, data }
}
export async function getStudentsCount() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به', count: 0 }
    }
    
    // Get total count of students
    const { count, error } = await supabase
      .from('eleve')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('Error counting students:', error)
      return { success: false, error: error.message, count: 0 }
    }
    
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Unexpected error in getStudentsCount:', error)
    return { success: false, error: error.message, count: 0 }
  }
}

// Optional: Get students count with filters
export async function getStudentsCountWithFilters(filters = {}) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { success: false, error: 'غير مصرح به', count: 0 }
    }
    
    let query = supabase.from('eleve').select('*', { count: 'exact', head: true })
    
    // Apply filters if provided
    if (filters.present !== undefined) {
      query = query.eq('present', filters.present)
    }
    
    if (filters.id_class) {
      query = query.eq('id_class', filters.id_class)
    }
    
    const { count, error } = await query
    
    if (error) {
      console.error('Error counting students with filters:', error)
      return { success: false, error: error.message, count: 0 }
    }
    
    return { success: true, count: count || 0 }
  } catch (error) {
    console.error('Unexpected error in getStudentsCountWithFilters:', error)
    return { success: false, error: error.message, count: 0 }
  }
}



