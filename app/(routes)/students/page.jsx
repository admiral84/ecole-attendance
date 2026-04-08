// app/students/page.js
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentsClient from './StudentsClient'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const supabase = await createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login?redirect=/students')
  }
  
  // Fetch students with their class information
  const { data: students, error } = await supabase
    .from('eleve')
    .select(`
      *,
      classInfo:classes!eleve_id_class_fkey(
        id_class,
        libelle
      )
    `)
    .order('nom', { ascending: true })
  
  if (error) {
    console.error('Error fetching students:', error)
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>خطأ في تحميل البيانات: {error.message}</p>
      </div>
    )
  }
  
  return <StudentsClient students={students || []} />
}