// app/dashboard/page.js
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Plus, X, User, BookOpen, Calendar, Phone, Mail } from 'lucide-react'

// Import server actions
import { getStudents, getClasses, getStudentsCount } from './actions/students'
import { getAllUsersNoRestriction } from './actions/users'
import { getStudentsWithPresentFalse, getAbsentStudentsByDateRange } from './actions/absence'
import { createStudent } from './actions/students'

export default function Dashboard() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [users, setUsers] = useState([])
  const [todayAbsenceCount, setTodayAbsenceCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recentAbsences, setRecentAbsences] = useState([])
  const [currentlyAbsent, setCurrentlyAbsent] = useState([])
  const [studentsCount, setStudentsCount] = useState(0)
  
  // Modal states
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  const [addingStudent, setAddingStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({
    num_eleve: '',
    nom: '',
    prenom: '',
    date_naissance: '',
    id_class: '',
    pere: '',
    mere: '',
    phone: '',
    email: '',
    adresse: ''
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Get all required data
      const [studentsData, classesData, usersRes, todayAbsencesRes, currentAbsencesRes, studentsCountRes] = await Promise.all([
        getStudents(),
        getClasses(),
        getAllUsersNoRestriction(),
        getAbsentStudentsByDateRange(today),
        getStudentsWithPresentFalse(),
        getStudentsCount()
      ])

      setStudents(studentsData || [])
      setClasses(classesData || [])
      setUsers(usersRes?.users || [])
      
      // Set students count
      if (studentsCountRes.success) {
        setStudentsCount(studentsCountRes.count)
      } else {
        setStudentsCount(studentsData?.length || 0)
      }
      
      // Handle today's absences
      const todayAbsences = todayAbsencesRes?.data || []
      setRecentAbsences(todayAbsences.slice(0, 5))
      setTodayAbsenceCount(todayAbsences.length)
      
      // Handle currently absent students (active absences)
      if (currentAbsencesRes.success) {
        setCurrentlyAbsent(currentAbsencesRes.data || [])
      }
      
    } catch (error) {
      console.error('Error loading dashboard:', error)
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!newStudent.num_eleve || !newStudent.nom || !newStudent.prenom || !newStudent.id_class) {
      toast.error('الرجاء تعبئة جميع الحقول المطلوبة')
      return
    }
    
    setAddingStudent(true)
    
    try {
      const result = await createStudent(newStudent)
      
      if (result.success) {
        toast.success('تم إضافة التلميذ بنجاح')
        setIsAddStudentModalOpen(false)
        setNewStudent({
          num_eleve: '',
          nom: '',
          prenom: '',
          date_naissance: '',
          id_class: '',
          pere: '',
          mere: '',
          phone: '',
          email: '',
          adresse: ''
        })
        // Refresh dashboard data
        await loadDashboardData()
      } else {
        toast.error(result.error || 'حدث خطأ في إضافة التلميذ')
      }
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error('حدث خطأ في إضافة التلميذ')
    } finally {
      setAddingStudent(false)
    }
  }

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'مدير'
      case 'manager': return 'مدير'
      case 'teacher': return 'أستاذ'
      case 'parent': return 'ولي أمر'
      case 'student': return 'تلميذ'
      default: return 'مستخدم'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">جاري تحميل لوحة التحكم...</div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'الأقسام',
      value: classes.length,
      icon: '📚',
      color: 'bg-blue-500',
      link: '/classes'
    },
    {
      title: 'التلاميذ',
      value: studentsCount,
      icon: '👨‍🎓',
      color: 'bg-green-500',
      link: '/students'
    },
    {
      title: 'المستخدمين',
      value: users.length,
      icon: '👥',
      color: 'bg-orange-500',
      link: '/users'
    },
    {
      title: 'غيابات اليوم',
      value: todayAbsenceCount,
      icon: '📝',
      color: 'bg-yellow-500',
      link: '/attendance'
    },
  ]

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-1">مرحباً بك! إليك ملخص اليوم</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.link}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white text-2xl p-3 rounded-full`}>
                {stat.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
          <div className="space-y-3">
            <Link href="/profile" className="flex items-center justify-between w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg transition">
              <span>👤 تعديل الملف الشخصي</span>
              <span>←</span>
            </Link>
            <Link href="/attendance" className="flex items-center justify-between w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition">
              <span>📝 تسجيل حضور اليوم</span>
              <span>←</span>
            </Link>
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="flex items-center justify-between w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition"
            >
              <span>➕ إضافة تلميذ جديد</span>
              <span>←</span>
            </button>
            
          </div>
        </div>

        {/* Currently Absent Students */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">التلاميذ الغائبين حالياً</h2>
          {currentlyAbsent.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>لا يوجد تلاميذ غائبين حالياً</p>
              <p className="text-sm text-gray-400 mt-2">جميع التلاميذ حاضرون</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {currentlyAbsent.map((student) => (
                <div key={student.id_eleve} className="flex justify-between items-center border-b pb-3">
                  <div>
                    <p className="font-medium">{student.nom}</p>
                    <p className="text-sm text-gray-500">{student.class_libelle}</p>
                  </div>
                  <span className="text-sm text-red-600">غائب</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Absences Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">غيابات اليوم</h2>
          <Link href="/attendance" className="text-blue-600 text-sm hover:underline">عرض الكل ←</Link>
        </div>
        {recentAbsences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">✅</div>
            <p>لا توجد غيابات مسجلة اليوم</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">اسم التلميذ</th>
                  <th className="text-right py-3 px-4">القسم</th>
                  <th className="text-right py-3 px-4">وقت الغياب</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentAbsences.map((absence) => (
                  <tr key={absence.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{absence.student_name}</td>
                    <td className="py-3 px-4">{absence.class_libelle}</td>
                    <td className="py-3 px-4">{absence.absence_start_time || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm ${absence.justified ? 'text-green-600' : 'text-red-600'}`}>
                        {absence.justified ? 'مبرر' : 'غير مبرر'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">أحدث المستخدمين</h2>
          <Link href="/users" className="text-blue-600 text-sm hover:underline">
            عرض الكل ←
          </Link>
        </div>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">لا يوجد مستخدمين</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4">المعرف</th>
                  <th className="text-right py-3 px-4">الاسم</th>
                  <th className="text-right py-3 px-4">اللقب</th>
                  <th className="text-right py-3 px-4">الدور</th>
                  <th className="text-right py-3 px-4">البريد</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((user) => (
                  <tr key={user.matricule} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{user.matricule}</td>
                    <td className="py-3 px-4">{user.nom}</td>
                    <td className="py-3 px-4">{user.prenom || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-center mt-4 pt-3 border-t">
              <Link href="/users" className="text-blue-600 text-sm hover:underline">
                عرض جميع المستخدمين ({users.length})
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">إضافة تلميذ جديد</h2>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddStudent} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Numéro d'étudiant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline ml-1" />
                    رقم التسجيل *
                  </label>
                  <input
                    type="text"
                    value={newStudent.num_eleve}
                    onChange={(e) => setNewStudent({...newStudent, num_eleve: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: 2024001"
                    required
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline ml-1" />
                    الاسم *
                  </label>
                  <input
                    type="text"
                    value={newStudent.nom}
                    onChange={(e) => setNewStudent({...newStudent, nom: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="الاسم"
                    required
                  />
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User size={16} className="inline ml-1" />
                    اللقب *
                  </label>
                  <input
                    type="text"
                    value={newStudent.prenom}
                    onChange={(e) => setNewStudent({...newStudent, prenom: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="اللقب"
                    required
                  />
                </div>

                {/* Date de naissance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline ml-1" />
                    تاريخ الولادة
                  </label>
                  <input
                    type="date"
                    value={newStudent.date_naissance}
                    onChange={(e) => setNewStudent({...newStudent, date_naissance: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen size={16} className="inline ml-1" />
                    القسم *
                  </label>
                  <select
                    value={newStudent.id_class}
                    onChange={(e) => setNewStudent({...newStudent, id_class: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">اختر القسم</option>
                    {classes.map((cls) => (
                      <option key={cls.id_class} value={cls.id_class}>
                        {cls.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Père */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الأب
                  </label>
                  <input
                    type="text"
                    value={newStudent.pere}
                    onChange={(e) => setNewStudent({...newStudent, pere: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم الأب"
                  />
                </div>

                {/* Mère */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الأم
                  </label>
                  <input
                    type="text"
                    value={newStudent.mere}
                    onChange={(e) => setNewStudent({...newStudent, mere: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="اسم الأم"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline ml-1" />
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="رقم الهاتف"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline ml-1" />
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="البريد الإلكتروني"
                  />
                </div>

                {/* Adresse - full width */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان
                  </label>
                  <textarea
                    value={newStudent.adresse}
                    onChange={(e) => setNewStudent({...newStudent, adresse: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="العنوان الكامل"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {addingStudent ? 'جاري الإضافة...' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}