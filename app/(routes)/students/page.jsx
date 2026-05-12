// app/students/page.js
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentsClient from './StudentsClient'
import { getClasses, getStudents } from '../../actions/students'
import { getCurrentUser } from '../../actions/users'  // ✅ Reuse existing!

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  // ✅ Use your existing getCurrentUser from users.js
  const { user, error } = await getCurrentUser()
  
  if (error || !user) {
    redirect('/login?redirect=/students')
  }
  
  const userRole = user?.role || 'teacher'
  
  // Fetch students using server action (already has permission checks)
  const students = await getStudents()
  
  // Fetch classes using server action (already has permission checks)
  const classes = await getClasses()
  
  return (
    <StudentsClient 
      students={students || []} 
      classes={classes || []}
      userRole={userRole}
    />
  )
}