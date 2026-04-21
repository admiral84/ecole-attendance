// app/students/StudentsClient.jsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Eye, Edit, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import AddStudentModal from '../../components/AddStudentModal'

// Function to convert Persian/Arabic digits to Western digits
function toWesternDigits(str) {
  if (!str) return '';
  
  const persianDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const westernDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = str.toString();
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replaceAll(persianDigits[i], westernDigits[i]);
  }
  return result;
}

// Function to format date as DD/MM/YYYY
function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return '-';
  }
}

export default function StudentsClient({ students, classes }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [studentsList, setStudentsList] = useState(students)

  // Handle adding a new student
  const handleStudentAdded = (newStudent) => {
    setStudentsList([newStudent, ...studentsList])
    toast.success('تم إضافة التلميذ بنجاح')
  }

  // Filter students - FIXED: Convert both values to strings for comparison
  const filteredStudents = studentsList.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.num_eleve?.includes(searchTerm)
    
    // Fix: Convert both sides to string for proper comparison
    const matchesClass = selectedClass === '' || 
      String(student.id_class) === String(selectedClass)
    
    return matchesSearch && matchesClass
  })

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا التلميذ؟')) {
      try {
        const response = await fetch(`/api/students/${id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          setStudentsList(studentsList.filter(student => 
            (student.id_eleve || student.id) !== id
          ))
          toast.success('تم حذف التلميذ بنجاح')
        } else {
          toast.error('حدث خطأ في حذف التلميذ')
        }
      } catch (error) {
        console.error('Delete error:', error)
        toast.error('حدث خطأ في حذف التلميذ')
      }
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            إدارة التلاميذ
          </h1>
          <p className="text-gray-600 mt-1">عرض وإدارة بيانات التلاميذ</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus size={20} />
          إضافة تلميذ
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم التسجيل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter size={20} />
            فلترة
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">جميع الأقسام</option>
                  {classes?.map((cls) => (
                    <option key={cls.id_class} value={String(cls.id_class)}>
                      {cls.libelle}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-500 text-lg">لا توجد تلاميذ مسجلين</p>
            <p className="text-gray-400 text-sm mt-2">قم بإضافة تلميذ جديد للبدء</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">رقم التسجيل</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الاسم الكامل</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">القسم</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ الولادة</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">ولي الأمر</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id_eleve || student.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4 text-sm font-mono">{student.num_eleve || student.id_eleve || '-'}</td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/students/${student.id_eleve || student.id}`}
                        className="hover:text-blue-600 transition"
                      >
                        <div className="font-medium text-gray-900">
                          {student.nom} {student.prenom}
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {student.classInfo?.libelle || student.libelle || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {formatDate(student.date_naissance)}
                    </td>
                    <td className="py-3 px-4 text-sm">{student.pere || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/students/${student.id_eleve || student.id}`}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </Link>
                        <Link
                          href={`/students/edit/${student.id_eleve || student.id}`}
                          className="p-1.5 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={() => handleDelete(student.id_eleve || student.id)}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classes={classes}
        onStudentAdded={handleStudentAdded}
      />
    </div>
  )
}