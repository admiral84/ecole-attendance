import SingleEleve from './SingleEleve'
import { supabase } from '../../../../lib/supabase/client'

export default async function StudentPage({ params }) {
  const { id } = await params
  
  // Fetch student data
  const { data: student } = await supabase
    .from('eleve')
    .select('*')
    .eq('id_eleve', id)
    .single()
  
  // Fetch class info
  const { data: classInfo } = await supabase
    .from('classes')
    .select('id_class, ilbella')
    .eq('id_class', student?.id_class)
    .single()
  
  // Fetch attendance history
  const { data: attendance } = await supabase
    .from('absence')
    .select('*')
    .eq('id_eleve', id)
    .order('date_deb', { ascending: false })
  
  // Fetch sanctions
  const { data: sanctions } = await supabase
    .from('sanctions')
    .select('*')
    .eq('id_eleve', id)
    .order('debut', { ascending: false })
  
  // Calculate statistics
  const totalAbsences = attendance?.length || 0
  const justifiedAbsences = attendance?.filter(a => a.justified === true).length || 0
  const unJustifiedAbsences = totalAbsences - justifiedAbsences
  const totalSanctions = sanctions?.length || 0

  return (
    <SingleEleve 
      student={student}
      classInfo={classInfo}
      attendance={attendance || []}
      sanctions={sanctions || []}
      stats={{
        totalAbsences,
        justifiedAbsences,
        unJustifiedAbsences,
        totalSanctions
      }}
    />
  )
}