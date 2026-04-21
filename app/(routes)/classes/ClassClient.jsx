// app/classes/ClassesListClient.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, X, Save, Trash2, Edit } from 'lucide-react'
import { createClass, updateClass, deleteClass } from '../../actions/classes'
import { toast } from 'sonner'

export default function ClassClient({ initialClasses }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [classes, setClasses] = useState(initialClasses)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({ 
    id_class: '', 
    libelle: '' 
  })
  const [errors, setErrors] = useState({})

  const filteredClasses = classes.filter(cls =>
    cls.libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.id_class?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    
    // Validate
    const newErrors = {}
    if (!formData.id_class.trim()) {
      newErrors.id_class = 'معرف القسم مطلوب'
    }
    if (!formData.libelle.trim()) {
      newErrors.libelle = 'اسم القسم مطلوب'
    }
    
    // Check if ID already exists
    const existingClassById = classes.find(cls => cls.id_class === formData.id_class.trim())
    if (existingClassById) {
      newErrors.id_class = 'هذا المعرف موجود بالفعل'
    }
    
    // Check if name already exists
    const existingClassByName = classes.find(cls => cls.libelle === formData.libelle.trim())
    if (existingClassByName) {
      newErrors.libelle = 'هذا الاسم موجود بالفعل'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await createClass(formData)
      
      if (result.success) {
        // Add the new class to the list
        setClasses(prev => [result.data, ...prev])
        toast.success(result.message || 'تم إضافة القسم بنجاح')
        closeAddModal()
        router.refresh()
      } else {
        toast.error(result.error || 'حدث خطأ أثناء إضافة القسم')
      }
    } catch (error) {
      console.error('Error creating class:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    // Validate
    const newErrors = {}
    if (!formData.libelle.trim()) {
      newErrors.libelle = 'اسم القسم مطلوب'
    }
    
    // Check if name already exists (excluding current class)
    const existingClassByName = classes.find(cls => 
      cls.libelle === formData.libelle.trim() && cls.id_class !== selectedClass?.id_class
    )
    if (existingClassByName) {
      newErrors.libelle = 'هذا الاسم موجود بالفعل'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    
    try {
      const result = await updateClass(selectedClass.id_class, { libelle: formData.libelle })
      
      if (result.success) {
        // Update the class in the list
        setClasses(prev => prev.map(cls => 
          cls.id_class === selectedClass.id_class 
            ? { ...cls, libelle: formData.libelle }
            : cls
        ))
        toast.success(result.message || 'تم تحديث القسم بنجاح')
        closeEditModal()
        router.refresh()
      } else {
        toast.error(result.error || 'حدث خطأ أثناء تحديث القسم')
      }
    } catch (error) {
      console.error('Error updating class:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedClass) return
    
    setIsDeleting(true)
    
    try {
      const result = await deleteClass(selectedClass.id_class)
      
      if (result.success) {
        // Remove the deleted class from the list
        setClasses(prev => prev.filter(cls => cls.id_class !== selectedClass.id_class))
        toast.success(result.message || 'تم حذف القسم بنجاح')
        closeDeleteModal()
        router.refresh()
      } else {
        toast.error(result.error || 'حدث خطأ أثناء حذف القسم')
      }
    } catch (error) {
      console.error('Error deleting class:', error)
      toast.error('حدث خطأ غير متوقع')
    } finally {
      setIsDeleting(false)
    }
  }

  const openAddModal = () => {
    setFormData({ id_class: '', libelle: '' })
    setErrors({})
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setFormData({ id_class: '', libelle: '' })
    setErrors({})
  }

  const openEditModal = (cls) => {
    setSelectedClass(cls)
    setFormData({ 
      id_class: cls.id_class, 
      libelle: cls.libelle 
    })
    setErrors({})
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedClass(null)
    setFormData({ id_class: '', libelle: '' })
    setErrors({})
  }

  const openDeleteModal = (cls) => {
    setSelectedClass(cls)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSelectedClass(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            إدارة الأقسام
          </h1>
          <p className="text-gray-600 mt-1">عرض وإدارة جميع الأقسام</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} />
          إضافة قسم
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="بحث باسم القسم أو المعرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-gray-500 text-lg">لا توجد أقسام مسجلة</p>
          <p className="text-gray-400 text-sm mt-2">قم بإضافة قسم جديد للبدء</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id_class}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 block group relative"
            >
              {/* Action Buttons - Always visible */}
              <div className="absolute top-4 left-4 flex gap-2">
                <button
                  onClick={() => openEditModal(cls)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-sm"
                  title="تعديل القسم"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => openDeleteModal(cls)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition shadow-sm"
                  title="حذف القسم"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {/* Class Content Link */}
              <Link href={`/classes/${cls.id_class}`} className="block">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition">
                    {cls.libelle}
                  </h3>
                  <span className="text-2xl">📖</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">المعرف:</span> {cls.id_class}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">عدد التلاميذ:</span>{' '}
                    <span className="font-bold text-blue-600">{cls.student_count || 0}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t text-blue-600 text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  عرض التفاصيل
                  <span>←</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Add Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeAddModal}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">إضافة قسم جديد</h2>
                <button
                  onClick={closeAddModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label htmlFor="id_class" className="block text-sm font-medium text-gray-700 mb-2">
                      معرف القسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="id_class"
                      name="id_class"
                      value={formData.id_class}
                      onChange={handleChange}
                      placeholder="مثال: CLS001, SCI-A, MATHS-01"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.id_class ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="ltr"
                      autoFocus
                    />
                    {errors.id_class && (
                      <p className="mt-1 text-sm text-red-600">{errors.id_class}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      معرف فريد للقسم (أحرف وأرقام فقط)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="libelle" className="block text-sm font-medium text-gray-700 mb-2">
                      اسم القسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="libelle"
                      name="libelle"
                      value={formData.libelle}
                      onChange={handleChange}
                      placeholder="مثال: السنة الأولى, السنة الثانية, قسم A"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.libelle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="rtl"
                    />
                    {errors.libelle && (
                      <p className="mt-1 text-sm text-red-600">{errors.libelle}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      اسم القسم (يجب أن يكون فريداً)
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      'جاري الإضافة...'
                    ) : (
                      <>
                        <Save size={18} />
                        إضافة القسم
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {isEditModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeEditModal}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">تعديل القسم</h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      معرف القسم
                    </label>
                    <input
                      type="text"
                      value={selectedClass.id_class}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      dir="ltr"
                    />
                    <p className="mt-1 text-sm text-gray-500">المعرف لا يمكن تغييره</p>
                  </div>

                  <div>
                    <label htmlFor="edit_libelle" className="block text-sm font-medium text-gray-700 mb-2">
                      اسم القسم <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit_libelle"
                      name="libelle"
                      value={formData.libelle}
                      onChange={handleChange}
                      placeholder="مثال: السنة الأولى, السنة الثانية, قسم A"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.libelle ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="rtl"
                      autoFocus
                    />
                    {errors.libelle && (
                      <p className="mt-1 text-sm text-red-600">{errors.libelle}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">
                      اسم القسم (يجب أن يكون فريداً)
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      'جاري التحديث...'
                    ) : (
                      <>
                        <Save size={18} />
                        تحديث القسم
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeDeleteModal}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full transform transition-all">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-xl font-bold text-red-600">تأكيد الحذف</h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    هل أنت متأكد من حذف هذا القسم؟
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">القسم:</span> {selectedClass.libelle}
                    </p>
                    <p className="text-gray-700 mt-1">
                      <span className="font-medium">المعرف:</span> {selectedClass.id_class}
                    </p>
                    {selectedClass.student_count > 0 && (
                      <p className="text-red-600 mt-2 text-sm">
                        ⚠️ يحتوي هذا القسم على {selectedClass.student_count} تلميذ. لا يمكن حذفه إلا بعد نقل التلاميذ إلى قسم آخر.
                      </p>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">
                    هذا الإجراء لا يمكن التراجع عنه
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || selectedClass.student_count > 0}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    'جاري الحذف...'
                  ) : (
                    <>
                      <Trash2 size={18} />
                      حذف القسم
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}