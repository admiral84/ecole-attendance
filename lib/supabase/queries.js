import { supabase } from './client'

export async function getClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .order('id_class')
  
  if (error) throw error
  return data
}

export async function getStudents(classId) {
  let query = supabase.from('eleve').select('*')
  if (classId) {
    query = query.eq('id_class', classId)
  }
  const { data, error } = await query.order('nom')
  if (error) throw error
  return data
}

// Get all seances
export async function getSeances() {
  const { data, error } = await supabase
    .from('seance')
    .select('*, classes(*), users(*)')
    .order('jour')
  
  if (error) throw error
  return data
}

// Get seances by class
export async function getSeancesByClass(classId) {
  const { data, error } = await supabase
    .from('seance')
    .select('*, users(*)')
    .eq('id_classe', classId)
    .order('jour')
  
  if (error) throw error
  return data
}

// Add new seance
export async function addSeance(seanceData) {
  const { data, error } = await supabase
    .from('seance')
    .insert(seanceData)
    .select()
    .single()
  
  if (error) throw error
  return data
}