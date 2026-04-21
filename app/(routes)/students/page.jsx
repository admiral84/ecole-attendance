// app/students/page.js
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentsClient from './StudentsClient'
import { getClasses } from '../../actions/students'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/students')
  }
  
  // Fetch students with their class information
  const { data: students, error: studentsError } = await supabase
    .from('eleve')
    .select(`
      *,
      classInfo:classes!eleve_id_class_fkey(
        id_class,
        libelle
      )
    `)
    .order('nom', { ascending: true })
  
  if (studentsError) {
    console.error('Error fetching students:', studentsError)
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>خطأ في تحميل البيانات: {studentsError.message}</p>
      </div>
    )
  }
  
  // Fetch classes for the dropdown
  const classes = await getClasses()
  
  return <StudentsClient students={students || []} classes={classes} />
}