import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  console.log('=== PASSWORD RESET API CALLED ===')
  
  try {
    const { email } = await request.json()
    console.log('Email received:', email)
    
    if (!email || email.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        error: 'البريد الإلكتروني مطلوب' 
      }, { status: 400 })
    }
    
    const formattedEmail = email.trim().toLowerCase()
    
    // Use correct environment variable names
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    
    console.log('Environment check:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL exists:', !!supabaseUrl)
    console.log('- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY exists:', !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json({ 
        success: false, 
        error: 'خطأ في تكوين الخادم: بيانات Supabase غير متوفرة' 
      }, { status: 500 })
    }
    
    // Create Supabase client with publishable key
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    console.log('Origin:', origin)
    
    // Send password reset email
    const { data, error } = await supabase.auth.resetPasswordForEmail(formattedEmail, {
      redirectTo: `${origin}/reset-password`,
    })
    
    if (error) {
      console.error('Supabase reset password error:', error)
      console.error('Error details:', error.message)
      
      return NextResponse.json({ 
        success: false, 
        error: `حدث خطأ: ${error.message}` 
      }, { status: 500 })
    }
    
    console.log('Password reset email sent successfully to:', formattedEmail)
    
    return NextResponse.json({ 
      success: true, 
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' 
    })
    
  } catch (error) {
    console.error('Password reset API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `حدث خطأ غير متوقع: ${error.message}` 
    }, { status: 500 })
  }
}