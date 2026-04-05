'use client'

import { useEffect, useState } from 'react'
import { getStudents, getClasses, deleteStudent, updateStudent } from '../../actions/students'
import { toast } from 'sonner'
import Link from 'next/link'

export default function StudentsClient({ initialStudents = [], initialClasses = [] }) {
  const [students, setStudents] = useState(initialStudents)
  const [classes, setClasses] = useState(initialClasses)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [editingStudent, setEditingStudent] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [studentsData, classesData] = await Promise.all([
        getStudents(),
        getClasses()
      ])
      
      const studentsWithClasses = studentsData.map(student => ({
        ...student,
        classInfo: classesData.find(c => c.id_class === student.id_class)
      }))
      
      setStudents(studentsWithClasses)
      setClasses(classesData)
    } catch (error) {
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return
    
    try {
      await deleteStudent(id)
      toast.success('تم حذف الطالب بنجاح')
      loadData()
    } catch (error) {
      toast.error('خطأ في حذف الطالب')
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    
    try {
      await updateStudent(editingStudent)
      toast.success('تم تحديث الطالب بنجاح')
      setShowEditModal(false)
      setEditingStudent(null)
      loadData()
    } catch (error) {
      toast.error('خطأ في تحديث الطالب')
    }
  }

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.id_eleve?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = !selectedClass || student.id_class === selectedClass
    return matchesSearch && matchesClass
  })

  if (loading && students.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <div>جاري تحميل التلاميذ...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">قائمة التلاميذ</h1>
          <p className="text-sm text-gray-600 mt-1">
            إجمالي التلاميذ: {filteredStudents.length}
          </p>
        </div>
        <Link
          href="/students/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <span>+</span> إضافة تلميذ جديد
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="بحث بالاسم أو المعرف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الفصول</option>
              {classes.map((cls) => (
                <option key={cls.id_class} value={cls.id_class}>
                  {cls.ilbella || cls.id_class}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-3 px-4">المعرف</th>
                <th className="text-right py-3 px-4">اسم التلميذ</th>
                <th className="text-right py-3 px-4">القسم</th>
                <th className="text-right py-3 px-4">رقم التسجيل</th>
                <th className="text-right py-3 px-4">الحالة</th>
                <th className="text-right py-3 px-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <p>لا يوجد تلاميذ</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id_eleve} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{student.id_eleve}</td>
                    <td className="py-3 px-4 font-medium">
  <Link 
    href={`/students/${student.id_eleve}`}
    className="text-blue-600 hover:text-blue-800 hover:underline"
  >
    {student.nom || '-'}
  </Link>
</td>
                    <td className="py-3 px-4">{student.classInfo?.ilbella || student.id_class || '-'}</td>
                    <td className="py-3 px-4">{student.num || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {student.present ? 'حاضر' : 'غائب'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingStudent(student)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(student.id_eleve)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">تعديل التلميذ</h2>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">الاسم</label>
                  <input
                    type="text"
                    value={editingStudent.nom || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, nom: e.target.value})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">القسم</label>
                  <select
                    value={editingStudent.id_class || ''}
                    onChange={(e) => setEditingStudent({...editingStudent, id_class: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">اختر القسم</option>
                    {classes.map((cls) => (
                      <option key={cls.id_class} value={cls.id_class}>
                        {cls.ilbella || cls.id_class}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">الحالة</label>
                  <select
                    value={editingStudent.present ? 'true' : 'false'}
                    onChange={(e) => setEditingStudent({...editingStudent, present: e.target.value === 'true'})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="true">حاضر</option>
                    <option value="false">غائب</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 py-2 rounded"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}