// components/AddSanction.jsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

// Initialize Supabase client for client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AddSanction({ studentId, studentName, classId, className, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)
  const [formData, setFormData] = useState({
    motif: '',
    rapport: '',
    debut: '',
    fin: ''
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        toast.error('الرجاء تسجيل الدخول أولاً')
        return
      }
      
      // Get the user_id from the custom users table (this is UUID)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      if (userError) {
        console.error('Error fetching user:', userError)
        toast.error('حدث خطأ في التحقق من المستخدم')
        return
      }
      
      if (userData) {
        setUserId(userData.user_id) // This is the UUID
      }
    }
    
    getUser()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!userId) {
      toast.error('لم يتم التعرف على المستخدم. يرجى تسجيل الدخول مرة أخرى.')
      setLoading(false)
      return
    }

    if (!formData.debut) {
      toast.error('الرجاء إدخال تاريخ بدء العقوبة')
      setLoading(false)
      return
    }

    try {
      const sanctionData = {
        id_eleve: studentId,
        id_classe: classId,
        motif: formData.motif || null,
        rapport: formData.rapport || null,
        debut: formData.debut,
        fin: formData.fin || null,
        created_by: userId // UUID from users.user_id
      }

      const { error } = await supabase
        .from('sanctions')
        .insert([sanctionData])

      if (error) {
        console.error('Supabase error:', error)
        toast.error(error.message || 'حدث خطأ في إضافة العقوبة')
      } else {
        toast.success('تم إضافة العقوبة بنجاح')
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">إضافة عقوبة</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">التلميذ:</p>
            <p className="font-semibold">{studentName || studentId}</p>
            <p className="text-sm text-gray-600 mt-1">القسم:</p>
            <p className="font-semibold">{className || classId}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              سبب العقوبة *
            </label>
            <input
              type="text"
              name="motif"
              value={formData.motif}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="مثال: غياب متكرر، سلوك غير لائق..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تفاصيل إضافية
            </label>
            <textarea
              name="rapport"
              value={formData.rapport}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="تفاصيل إضافية عن العقوبة..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ البدء *
            </label>
            <input
              type="date"
              name="debut"
              value={formData.debut}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ الانتهاء (اختياري)
            </label>
            <input
              type="date"
              name="fin"
              value={formData.fin}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'جاري الإضافة...' : 'إضافة عقوبة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}