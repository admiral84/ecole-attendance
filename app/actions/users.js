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
    
    // Get current user's role - using user_id instead of id
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roleError || !currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', users: [] }
    }
    
    // Fetch all users
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
    
    // Check if user is admin - using user_id instead of id
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    // Only allow admins to use this function
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
      // If user exists in auth but not in users table, create it
      const newUser = {
        user_id: user.id,
        matricule: user.user_metadata?.matricule || user.id,
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
      .eq('user_id', user.id)  // Changed from 'id' to 'user_id'
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    if (userId === user.id) {
      return { error: 'لا يمكنك تغيير دور حسابك الخاص', success: false }
    }
    
    const validRoles = ['admin', 'teacher', 'manager']  // Updated roles
    if (!validRoles.includes(newRole)) {
      return { error: 'دور غير صالح', success: false }
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('user_id', userId)  // Changed from 'id' to 'user_id'
    
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
// Delete user - Deletes from auth.users (cascade will delete from users table)
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
    
    // Delete from auth.users (ON DELETE CASCADE will automatically delete from public.users)
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

// Create user - Creates both auth user and users table record
export async function createUser(userData) {
  try {
    const supabase = await createClient()
    const adminClient = getAdminClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('غير مصرح به')
    }
    
    // Check if current user is admin - using user_id instead of id
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
    
    // Check if matricule already exists
    const { data: existingMatricule } = await supabase
      .from('users')
      .select('matricule')
      .eq('matricule', userData.matricule)
      .maybeSingle()
    
    if (existingMatricule) {
      throw new Error('المعرف موجود بالفعل')
    }
    
    // Create auth user
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
    
    // Create users table record with user_id as primary key
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
      // Rollback: delete the auth user if users table insert fails
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
    
    // Update auth user metadata
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
      .eq('user_id', user.id)  // Changed from 'id' to 'user_id'
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    // Don't allow changing your own approval status
    if (userId === user.id) {
      return { error: 'لا يمكنك تغيير حالة حسابك الخاص', success: false }
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ approved })
      .eq('user_id', userId)  // Changed from 'id' to 'user_id'
    
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