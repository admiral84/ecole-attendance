'use server'

import { supabase } from '../../lib/supabase/client'

export async function getStudents() {
  const { data, error } = await supabase
    .from('eleve')
    .select('*')
    .order('nom')
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function getClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id_class, libelle')
    .order('id_class')
  
  if (error) throw new Error(error.message)
  return data || []
}

export async function deleteStudent(id) {
  const { error } = await supabase
    .from('eleve')
    .delete()
    .eq('id_eleve', id)
  
  if (error) throw new Error(error.message)
  return { success: true }
}

export async function updateStudent(studentData) {
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