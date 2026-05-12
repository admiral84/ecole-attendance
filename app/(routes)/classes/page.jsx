// app/classes/page.js
import { Suspense } from 'react'
import ClassesListClient from './ClassClient'
import { getAllClasses } from '../../actions/classes'
import { createClient } from '../../../lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function page() {
  const supabase = await createClient()
  
  // Get current user and role
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', user.id)
    .single()
  
  const result = await getAllClasses()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <Suspense fallback={<div className="text-center py-12">جاري التحميل...</div>}>
          <ClassesListClient 
            initialClasses={result.data || []} 
            userRole={userData?.role || 'teacher'}
          />
        </Suspense>
      </div>
    </div>
  )
}