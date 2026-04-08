'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Fetch all users (admin only)
export async function getAllUsers() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به. الرجاء تسجيل الدخول', users: null }
    }
    
    // Check if user has admin role
    const { data: currentUser, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    if (roleError || !currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'manager')) {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', users: null }
    }
    
    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('nom', { ascending: true })
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return { error: 'حدث خطأ في جلب المستخدمين', users: null }
    }
    
    return { users, error: null }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'حدث خطأ غير متوقع', users: null }
  }
}

// Fetch single user by matricule
export async function getUserByMatricule(matricule) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', user: null }
    }
    
    // Fetch user
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
    console.error('Error:', error)
    return { error: 'حدث خطأ غير متوقع', user: null }
  }
}

// Fetch current logged-in user
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    
    // Get auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', user: null, authUser: null }
    }
    
    // Get additional user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    if (userError) {
      // Return auth user data as fallback
      return { 
        user: {
          email: user.email,
          nom: user.user_metadata?.nom || 'مستخدم',
          prenom: user.user_metadata?.prenom || '',
          role: user.user_metadata?.role || 'teacher',
          matricule: user.user_metadata?.matricule
        },
        authUser: user,
        error: null 
      }
    }
    
    return { 
      user: userData,
      authUser: user,
      error: null 
    }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'حدث خطأ غير متوقع', user: null, authUser: null }
  }
}

// Fetch users by role
export async function getUsersByRole(role) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', users: null }
    }
    
    // Check if user has permission (admin can view all, teachers can view students only)
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    // Validate permissions
    if (currentUser?.role === 'teacher' && role !== 'student') {
      return { error: 'غير مصرح به. يمكن للمعلمين فقط عرض التلاميذ', users: null }
    }
    
    // Fetch users by role
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('nom', { ascending: true })
    
    if (usersError) {
      return { error: 'حدث خطأ في جلب المستخدمين', users: null }
    }
    
    return { users, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'حدث خطأ غير متوقع', users: null }
  }
}

// Update user role (admin only)
export async function updateUserRole(matricule, newRole) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    // Check if current user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    // Validate new role
    const validRoles = ['admin', 'teacher', 'parent']
    if (!validRoles.includes(newRole)) {
      return { error: 'دور غير صالح', success: false }
    }
    
    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('matricule', matricule)
    
    if (updateError) {
      return { error: 'حدث خطأ في تحديث الدور', success: false }
    }
    
    // Revalidate paths that display users
    revalidatePath('/users')
    revalidatePath('/dashboard')
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'حدث خطأ غير متوقع', success: false }
  }
}

// Delete user (admin only)
export async function deleteUser(matricule) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'غير مصرح به', success: false }
    }
    
    // Check if current user is admin
    const { data: currentUser } = await supabase
      .from('users')
      .select('role')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'غير مصرح به. هذه الخاصية متاحة فقط للمديرين', success: false }
    }
    
    // Prevent deleting yourself
    if (matricule === user.user_metadata?.matricule) {
      return { error: 'لا يمكنك حذف حسابك الخاص', success: false }
    }
    
    // Delete from users table
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('matricule', matricule)
    
    if (deleteError) {
      return { error: 'حدث خطأ في حذف المستخدم', success: false }
    }
    
    // Revalidate paths
    revalidatePath('/users')
    revalidatePath('/dashboard')
    
    return { success: true, error: null }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'حدث خطأ غير متوقع', success: false }
  }
}

// Create user after email verification (self registration)
export async function createUser(userData) {
  try {
    const supabase = await createClient()

    // Check authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('غير مصرح به')
    }

    // Validate data
    if (!userData?.matricule || !userData?.nom) {
      throw new Error('بيانات غير صالحة')
    }

    // Ensure user can only create himself
    if (user.user_metadata?.matricule !== userData.matricule) {
      throw new Error('غير مصرح به')
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('matricule')
      .eq('matricule', userData.matricule)
      .maybeSingle()

    if (existingUser) {
      return { success: true }
    }

    // Insert user
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        matricule: userData.matricule,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role || 'teacher',
        phone: userData.phone || null
      }])

    if (insertError) {
      throw new Error(insertError.message)
    }

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
    
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('matricule', user.user_metadata?.matricule)
      .single()
    
    if (userError) {
      return { error: 'المستخدم غير موجود', success: false }
    }
    
    const updateData = {
      nom: userData.nom || currentUser.nom,
      prenom: userData.prenom || currentUser.prenom,
      phone: userData.phone || currentUser.phone,
      updated_at: new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('matricule', currentUser.matricule)
    
    if (updateError) {
      return { error: 'حدث خطأ في تحديث الملف الشخصي', success: false }
    }
    
    // Update auth metadata
    await supabase.auth.updateUser({
      data: {
        nom: updateData.nom,
        prenom: updateData.prenom,
        phone: updateData.phone
      }
    })
    
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
    
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })
    
    if (signInError) {
      return { error: 'كلمة المرور الحالية غير صحيحة', success: false }
    }
    
    // Update password
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