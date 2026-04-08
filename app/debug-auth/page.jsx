import { createClient } from '../../lib/supabase/server'

export default async function DebugAuthPage() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  let userData = null
  if (user) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    userData = data
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Auth Info</h1>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">Auth Error:</h2>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </div>
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">User from Auth:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold">User from Users Table:</h2>
        <pre>{JSON.stringify(userData, null, 2)}</pre>
      </div>
    </div>
  )
}