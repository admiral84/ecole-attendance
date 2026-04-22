// app/(dashboard)/classes/[id]/page.jsx
import SingleClass from './SingleClass'
import { createClient } from '../../../../lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function page({ params }) {
  const supabase = await createClient() // ✅ Added await here
  const { id } = await params
  
  // Fetch class info
  const { data: classInfo, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id_class', id)
    .single()
  
  if (classError || !classInfo) {
    console.error('Class fetch error:', classError)
    notFound()
  }
  
  // Fetch students in this class
  const { data: students, error: studentsError } = await supabase
    .from('eleve')
    .select('*')
    .eq('id_class', id)
    .order('nom')
  
  if (studentsError) {
    console.error('Students fetch error:', studentsError)
  }
  
  // Calculate statistics
  const totalStudents = students?.length || 0
  const presentStudents = students?.filter(s => s.present === true).length || 0
  const absentStudents = totalStudents - presentStudents

  return (
    <SingleClass
      classInfo={classInfo}
      students={students || []}
      stats={{
        totalStudents,
        presentStudents,
        absentStudents
      }}
    />
  )
}