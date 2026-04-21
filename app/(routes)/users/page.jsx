// app/users/page.js
import { createClient } from '../../../lib/supabase/server'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  let userRole = null
  let userId = null
  
  if (user) {
    // Fix: Use 'user_id' column instead of 'id'
    const { data: currentUser, error } = await supabase
      .from('users')
      .select('role, user_id')
      .eq('user_id', user.id)  // Changed from 'id' to 'user_id'
      .single()
    
    if (error) {
      console.error('Error fetching user role:', error)
    } else {
      userRole = currentUser?.role
      userId = currentUser?.user_id  // This will be the same as user.id
    }
  }
  
  console.log('UsersPage - User role:', userRole) // Should now show 'admin'
  
  return (
    <UsersClient 
      isAuthenticated={!!user}
      userRole={userRole}
      userId={userId}
    />
  )
}