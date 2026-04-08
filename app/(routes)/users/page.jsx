import { createClient } from '../../../lib/supabase/server'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  
  // Get user data on server
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user role
  let userRole = null
  let userMatricule = null
  
  if (user) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    userRole = currentUser?.role
    userMatricule = user.user_metadata?.matricule
  }
  
  // Pass auth state to client component
  return (
    <UsersClient 
      isAuthenticated={!!user}
      userRole={userRole}
      userMatricule={userMatricule}
      userEmail={user?.email}
    />
  )
}