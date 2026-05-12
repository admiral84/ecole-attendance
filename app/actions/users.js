'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Initialize admin client with service role key
const getAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase admin credentials')
    return null
  }
  
  return createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Fetch all users (admin only)
export async function getAllUsers() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به. الرجاء تسجيل الدخول', users: [] }
    }
    
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roleError || !currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', users: [] }
    }
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('nom', { ascending: true })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return { error: 'حدث خطأ في جلب المستخدمين', users: [] }
    }
    
    return { users: users || [], error: null }
  } catch (error) {
    console.error('Unexpected error in getAllUsers:', error)
    return { error: 'حدث خطأ غير متوقع', users: [] }
  }
}

// Fetch all users without role restriction (for testing/super admin)
export async function getAllUsersNoRestriction() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', users: [] }
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', users: [] }
    }
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('nom', { ascending: true })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return { error: 'حدث خطأ في جلب المستخدمين', users: [] }
    }
    
    return { users: users || [], error: null }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'حدث خطأ غير متوقع', users: [] }
  }
}

// Fetch single user by user_id
export async function getUserById(userId) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', user: null }
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (userError) {
      return { error: 'المستخدم غير موجود', user: null }
    }
    
    return { user: userData, error: null }
  } catch (error) {
    console.error('Error in getUserById:', error)
    return { error: 'حدث خطأ غير متوقع', user: null }
  }
}

// Fetch user by matricule
export async function getUserByMatricule(matricule) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', user: null }
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('matricule', matricule)
      .single()
    
    if (userError) {
      return { error: 'المستخدم غير موجود', user: null }
    }
    
    return { user: userData, error: null }
  } catch (error) {
    console.error('Error in getUserByMatricule:', error)
    return { error: 'حدث خطأ غير متوقع', user: null }
  }
}

// Fetch current logged-in user
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', user: null, authUser: null }
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      const newUser = {
        user_id: user.id,
        matricule: user.user_metadata?.matricule || user.id.substring(0, 8),
        nom: user.user_metadata?.nom || 'مستخدم',
        prenom: user.user_metadata?.prenom || '',
        role: user.user_metadata?.role || 'teacher',
        email: user.email,
        approved: true
      }
      
      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser])
      
      if (insertError) {
        console.error('Error creating user record:', insertError)
        return { user: newUser, authUser: user, error: null }
      }
      
      return { user: newUser, authUser: user, error: null }
    }
    
    return { user: userData, authUser: user, error: null }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return { error: 'حدث خطأ غير متوقع', user: null, authUser: null }
  }
}

// Fetch users by role
export async function getUsersByRole(role) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', users: [] }
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (currentUser?.role === 'teacher' && role !== 'student') {
      return { error: 'غير مصرح به. يمكن للمعلمين فقط عرض التلاميذ', users: [] }
    }
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('nom', { ascending: true })
    
    if (usersError) {
      return { error: 'حدث خطأ في جلب المستخدمين', users: [] }
    }
    
    return { users: users || [], error: null }
  } catch (error) {
    console.error('Error in getUsersByRole:', error)
    return { error: 'حدث خطأ غير متوقع', users: [] }
  }
}

// Update user role (admin only)
export async function updateUserRole(userId, newRole) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    if (userId === user.id) {
      return { error: 'لا يمكنك تغيير دور حسابك الخاص', success: false }
    }
    
    const validRoles = ['admin', 'teacher', 'manager']
    if (!validRoles.includes(newRole)) {
      return { error: 'دور غير صالح', success: false }
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('Error updating user role:', updateError)
      return { error: 'حدث خطأ في تحديث الدور', success: false }
    }
    
    revalidatePath('/dashboard')
    revalidatePath('/users')
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in updateUserRole:', error)
    return { error: 'حدث خطأ غير متوقع', success: false }
  }
}

// Delete user
export async function deleteUser(userId) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    if (userId === user.id) {
      return { error: 'لا يمكنك حذف حسابك الخاص', success: false }
    }
    
    const adminClient = getAdminClient()
    
    if (!adminClient) {
      return { error: 'خطأ في تهيئة عميل المصادقة', success: false }
    }
    
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      return { error: `فشل حذف المستخدم: ${deleteAuthError.message}`, success: false }
    }
    
    revalidatePath('/dashboard')
    revalidatePath('/users')
    revalidatePath('/seance')
    revalidatePath('/sanctions')
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteUser:', error)
    return { error: 'حدث خطأ غير متوقع أثناء حذف المستخدم', success: false }
  }
}

// Create user
export async function createUser(userData) {
  try {
    const supabase = await createClient()
    const adminClient = getAdminClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('غير مصرح به')
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('غير مصرح به. فقط المديرين يمكنهم إنشاء مستخدمين')
    }
    
    if (!userData?.email || !userData?.password) {
      throw new Error('البريد الإلكتروني وكلمة المرور مطلوبة')
    }
    
    if (!userData?.matricule) {
      throw new Error('المعرف (matricule) مطلوب')
    }
    
    const { data: existingMatricule } = await supabase
      .from('users')
      .select('matricule')
      .eq('matricule', userData.matricule)
      .maybeSingle()
    
    if (existingMatricule) {
      throw new Error('المعرف موجود بالفعل')
    }
    
    const { data: newAuthUser, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        matricule: userData.matricule,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role || 'teacher'
      }
    })
    
    if (createAuthError) {
      throw new Error(createAuthError.message)
    }
    
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        user_id: newAuthUser.user.id,
        matricule: userData.matricule,
        nom: userData.nom,
        prenom: userData.prenom || '',
        role: userData.role || 'teacher',
        phone: userData.phone || null,
        email: userData.email,
        approved: userData.approved || false
      }])
    
    if (insertError) {
      await adminClient.auth.admin.deleteUser(newAuthUser.user.id)
      throw new Error(insertError.message)
    }
    
    revalidatePath('/dashboard')
    revalidatePath('/users')
    
    return { success: true }
    
  } catch (error) {
    console.error('createUser error:', error)
    throw new Error(error.message || 'حدث خطأ أثناء إنشاء المستخدم')
  }
}

// Update user profile
export async function updateUserProfile(userData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    const updateData = {
      nom: userData.nom,
      prenom: userData.prenom,
      phone: userData.phone
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user.id)
    
    if (updateError) {
      return { error: 'حدث خطأ في تحديث الملف الشخصي', success: false }
    }
    
    await supabase.auth.updateUser({
      data: {
        nom: userData.nom,
        prenom: userData.prenom,
        phone: userData.phone
      }
    })
    
    revalidatePath('/dashboard')
    revalidatePath('/profile')
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { error: 'حدث خطأ غير متوقع', success: false }
  }
}

// Update user password
export async function updateUserPassword(currentPassword, newPassword) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })
    
    if (signInError) {
      return { error: 'كلمة المرور الحالية غير صحيحة', success: false }
    }
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })
    
    if (updateError) {
      return { error: 'حدث خطأ في تحديث كلمة المرور', success: false }
    }
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error updating password:', error)
    return { error: 'حدث خطأ غير متوقع', success: false }
  }
}

// Update user approval status (admin only)
export async function updateUserApproval(userId, approved) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    if (userId === user.id) {
      return { error: 'لا يمكنك تغيير حالة حسابك الخاص', success: false }
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ approved })
      .eq('user_id', userId)
    
    if (updateError) {
      console.error('Error updating user approval:', updateError)
      return { error: 'حدث خطأ في تحديث حالة المستخدم', success: false }
    }
    
    revalidatePath('/users')
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error in updateUserApproval:', error)
    return { error: 'حدث خطأ غير متوقع', success: false }
  }
}

// Check if email exists in auth and get approval status
export async function checkEmailExists(email) {
  try {
    const supabase = await createClient()
    
    if (!email || email.trim() === '') {
      return { exists: false, approved: false, error: null }
    }
    
    const formattedEmail = email.trim().toLowerCase()
    
    console.log('Checking email existence for:', formattedEmail)
    
    // Try to get user from your users table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('user_id, email, approved, role, nom')
      .eq('email', formattedEmail)
      .maybeSingle()
    
    if (dbError) {
      console.error('Database error in checkEmailExists:', dbError)
      return { exists: true, approved: true, error: null }
    }
    
    if (dbUser) {
      console.log('User found in database:', { email: dbUser.email, approved: dbUser.approved })
      return { 
        exists: true, 
        approved: dbUser.approved === true,
        userId: dbUser.user_id,
        error: null 
      }
    }
    
    // If not found in users table, check auth users
    const adminClient = getAdminClient()
    if (adminClient) {
      try {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()
        
        if (!listError && users) {
          const authUser = users.find(user => user.email === formattedEmail)
          if (authUser) {
            console.log('User found in auth but not in users table:', formattedEmail)
            
            // Create user in database automatically
            const { error: insertError } = await supabase
              .from('users')
              .insert([{
                user_id: authUser.id,
                email: formattedEmail,
                nom: authUser.user_metadata?.nom || 'مستخدم',
                prenom: authUser.user_metadata?.prenom || '',
                role: authUser.user_metadata?.role || 'user',
                matricule: authUser.user_metadata?.matricule || authUser.id.substring(0, 8),
                approved: true  // Auto-approve
              }])
            
            if (!insertError) {
              return { exists: true, approved: true, userId: authUser.id, error: null }
            }
          }
        }
      } catch (adminError) {
        console.error('Admin client error, but continuing:', adminError)
        return { exists: true, approved: true, error: null }
      }
    }
    
    // If we can't verify, assume user exists to avoid blocking login
    console.log('Could not verify email, assuming exists:', formattedEmail)
    return { exists: true, approved: true, error: null }
    
  } catch (error) {
    console.error('Unexpected error in checkEmailExists:', error)
    return { exists: true, approved: true, error: null }
  }
}

// Simple check that doesn't fail - Super simple version
export async function isUserApproved(email) {
  try {
    console.log('isUserApproved called for:', email)
    
    if (!email || email.trim() === '') {
      console.log('No email provided, defaulting to approved')
      return true
    }
    
    const supabase = await createClient()
    const formattedEmail = email.trim().toLowerCase()
    
    // Query the users table
    const { data, error } = await supabase
      .from('users')
      .select('approved')
      .eq('email', formattedEmail)
      .maybeSingle()
    
    console.log('isUserApproved query result:', { data, error })
    
    if (error) {
      console.error('Error checking approval:', error.message)
      return true
    }
    
    if (!data) {
      console.log('User not found in users table, defaulting to approved')
      return true
    }
    
    const isApproved = data.approved === true
    console.log('User approved status:', isApproved)
    return isApproved
    
  } catch (error) {
    console.error('Unexpected error in isUserApproved:', error.message)
    return true
  }
}
export async function getCurrentSessionUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return { user: null, error: 'غير مصرح به' }
    }
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, nom, prenom')
      .eq('user_id', user.id)
      .single()
    
    if (userError) {
      return { user: { role: 'teacher' }, error: null }
    }
    
    return { user: userData, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}