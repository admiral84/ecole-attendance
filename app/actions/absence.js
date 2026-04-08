// actions/absence.js
'use server'

import { createClient } from '../../lib/supabase/server'

export async function getAbsentStudents() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('absence')
      .select(`
        id,
        date_deb,
        heure_deb,
        date_fin,
        heure_fin,
        justified,
        eleve!inner (
          id_eleve,
          name
        ),
        classes!inner (
          id_class,
          libelle
        )
      `)
      .eq('justified', false)
      .order('date_deb', { ascending: false })
      .order('heure_deb', { ascending: false })

    if (error) {
      console.error('Error fetching absent students:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    const formattedData = data.map(absence => ({
      id: absence.id,
      student_name: absence.eleve?.name,
      student_id: absence.eleve?.id_eleve,
      class_libelle: absence.classes?.libelle,
      class_id: absence.classes?.id_class,
      absence_start_date: absence.date_deb,
      absence_start_time: absence.heure_deb,
      absence_end_date: absence.date_fin,
      absence_end_time: absence.heure_fin,
      justified: absence.justified
    }))

    return {
      success: true,
      data: formattedData,
      count: formattedData.length
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'Failed to fetch absent students',
      data: []
    }
  }
}

// Get only currently active absences
export async function getActiveAbsentStudents() {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toLocaleTimeString('en-US', { hour12: false })

    const { data, error } = await supabase
      .from('absence')
      .select(`
        id,
        date_deb,
        heure_deb,
        date_fin,
        heure_fin,
        justified,
        eleve!inner (
          id_eleve,
          name
        ),
        classes!inner (
          id_class,
          libelle
        )
      `)
      .or(`date_fin.gt.${today},and(date_fin.eq.${today},heure_fin.gt.${now})`)
      .eq('justified', false)
      .order('date_deb', { ascending: false })

    if (error) {
      console.error('Error fetching active absent students:', error)
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    const formattedData = data.map(absence => ({
      id: absence.id,
      student_name: absence.eleve?.name,
      class_libelle: absence.classes?.libelle,
      absence_start_date: absence.date_deb,
      absence_start_time: absence.heure_deb,
      justified: absence.justified
    }))

    return {
      success: true,
      data: formattedData,
      count: formattedData.length
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return {
      success: false,
      error: 'Failed to fetch active absent students',
      data: []
    }
  }
}