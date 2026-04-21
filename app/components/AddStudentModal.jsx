// app/students/AddStudentModal.jsx
'use client'

import { useState } from 'react'
import { X, User, BookOpen, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createStudent } from '../actions/students'

export default function AddStudentModal({ isOpen, onClose, classes, onStudentAdded }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    num: '',
    id_class: '',
    pere: '',
    parentphone: '',
    present: false
  })
  
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.nom || !formData.id_class) {
      toast.error('الاسم والقسم مطلوبان')
      return
    }

    setLoading(true)
    
    try {
      const studentData = {
        nom: formData.nom,
        prenom: formData.prenom,
        pere: formData.pere,
        parentphone: formData.parentphone,
        num: formData.num,
        id_class: parseInt(formData.id_class),
        present: formData.present
      }
      
      const result = await createStudent(studentData)
      
      if (result.success) {
        toast.success('تم إضافة التلميذ بنجاح')
        
        const newStudent = {
          ...result.data,
          ...studentData
        }
        
        onStudentAdded(newStudent)
        onClose()
        
        // Reset form
        setFormData({
          nom: '',
          prenom: '',
          num: '',
          id_class: '',
          pere: '',
          parentphone: '',
          present: false
        })
      } else {
        toast.error(result.error || 'حدث خطأ في إضافة التلميذ')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error('حدث خطأ في إضافة التلميذ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">إضافة تلميذ جديد</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User size={18} className="text-blue-600" />
                  المعلومات الشخصية
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم * <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="الاسم"
                />
              </div>

             

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم التسجيل
                </label>
                <input
                  type="text"
                  name="num"
                  value={formData.num}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="رقم التسجيل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القسم * <span className="text-red-500">*</span>
                </label>
                <select
                  name="id_class"
                  value={formData.id_class}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">اختر القسم</option>
                  {classes?.map((cls) => (
                    <option key={cls.id_class} value={cls.id_class}>
                      {cls.libelle}
                    </option>
                  ))}
                </select>
              </div>

            

              {/* Parent Information */}
              <div className="md:col-span-2 mt-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <User size={18} className="text-green-600" />
                  معلومات ولي الأمر
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الأب
                </label>
                <input
                  type="text"
                  name="pere"
                  value={formData.pere}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="اسم الأب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم هاتف ولي الأمر
                </label>
                <input
                  type="tel"
                  name="parentphone"
                  value={formData.parentphone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="رقم الهاتف"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-8 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'جاري الإضافة...' : 'إضافة التلميذ'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}