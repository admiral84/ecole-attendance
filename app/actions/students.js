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
    .eq('matricule', user.user_metadata?.matricule)
    .single()

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
    throw new Error('غير مصرح به')
  }
}

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

export async function getClasses() {
  const supabase = await createClient()
  await requireUser(supabase)

  const { data, error } = await supabase
    .from('classes')
    .select('id_class, libelle')
    .order('id_class')

  if (error) throw new Error(error.message)
  return data || []
}

export async function deleteStudent(id) {
  const supabase = await createClient()
  const user = await requireUser(supabase)
  await requireAdminOrManager(supabase, user)

  if (!id) throw new Error('معرف الطالب مطلوب')

  const { error } = await supabase
    .from('eleve')
    .delete()
    .eq('id_eleve', id)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateStudent(studentData) {
  const supabase = await createClient()
  const user = await requireUser(supabase)
  await requireAdminOrManager(supabase, user)

  if (!studentData?.id_eleve) {
    throw new Error('بيانات الطالب غير صالحة')
  }

  const { error } = await supabase
    .from('eleve')
    .update({
      nom: studentData.nom,
      pere: studentData.pere,
      parentphone: studentData.parentphone,
      num: studentData.num,
      id_class: studentData.id_class,
      present: studentData.present
    })
    .eq('id_eleve', studentData.id_eleve)

  if (error) throw new Error(error.message)

  return { success: true }
}