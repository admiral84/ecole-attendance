import SingleClass from './SingleClass'
import { supabase } from '../../../../lib/supabase/client'

export default async function page({ params }) {
  const { id } = await params
  
  // Fetch class info
  const { data: classInfo } = await supabase
    .from('classes')
    .select('*')
    .eq('id_class', id)
    .single()
  
  // Fetch students in this class
  const { data: students } = await supabase
    .from('eleve')
    .select('*')
    .eq('id_class', id)
    .order('nom')
  
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