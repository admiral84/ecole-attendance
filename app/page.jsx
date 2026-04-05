'use client'

import { useEffect, useState } from 'react'
import { supabase } from "../lib/supabase/client"
import { getStudents, getClasses } from "../lib/supabase/queries"
import { toast } from 'sonner'
import Link from 'next/link'

export default function Dashboard() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [users, setUsers] = useState([])
  const [seances, setSeances] = useState([])
  const [todayAttendance, setTodayAttendance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [recentAbsences, setRecentAbsences] = useState([])

  useEffect(() => {
    loadData()
    getTodayAttendance()
    getRecentAbsences()
    getUsers()
    getSeances()
  }, [])

  async function loadData() {
    try {
      const classesData = await getClasses()
      setClasses(classesData || [])
      
      const studentsData = await getStudents()
      setStudents(studentsData || [])
    } catch (error) {
      toast.error('خطأ في تحميل البيانات')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (!error && data) {
      setUsers(data)
    }
  }

  async function getSeances() {
    const { data, error } = await supabase
      .from('seance')
      .select('*')
    
    if (!error && data) {
      setSeances(data)
    }
  }

  async function getTodayAttendance() {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('absence')
      .select('*', { count: 'exact' })
      .eq('date_deb', today)
    
    if (!error && data) {
      setTodayAttendance(data.length)
    }
  }

  async function getRecentAbsences() {
    const { data, error } = await supabase
      .from('absence')
      .select(`
        *,
        eleve (nom, id_eleve)
      `)
      .order('date_deb', { ascending: false })
      .limit(5)
    
    if (!error && data) {
      setRecentAbsences(data)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-gray-600">جاري تحميل لوحة التحكم...</div>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'الفصول الدراسية',
      value: classes.length,
      icon: '📚',
      color: 'bg-blue-500',
      link: '/classes'
    },
    {
      title: 'الطلاب المسجلين',
      value: students.length,
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
      value: todayAttendance,
      icon: '📝',
      color: 'bg-yellow-500',
      link: '/attendance'
    },
    {
      title: 'الفصول النشطة',
      value: classes.filter(c => c.nstudent > 0).length,
      icon: '🏫',
      color: 'bg-purple-500',
      link: '/classes'
    },
    {
      title: 'الحصص',
      value: seances.length,
      icon: '📅',
      color: 'bg-indigo-500',
      link: '/seances'
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-600 mt-1">مرحباً بك! إليك ملخص اليوم</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
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
            <Link
              href="/attendance"
              className="flex items-center justify-between w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="font-medium">📝 تسجيل حضور اليوم</span>
              <span>←</span>
            </Link>
            <Link
              href="/students/new"
              className="flex items-center justify-between w-full bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="font-medium">➕ إضافة طالب جديد</span>
              <span>←</span>
            </Link>
            <Link
              href="/users/new"
              className="flex items-center justify-between w-full bg-orange-50 hover:bg-orange-100 text-orange-700 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="font-medium">👥 إضافة مستخدم جديد</span>
              <span>←</span>
            </Link>
            <Link
              href="/classes/new"
              className="flex items-center justify-between w-full bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="font-medium">📖 إنشاء فصل جديد</span>
              <span>←</span>
            </Link>
            <Link
              href="/sanctions/new"
              className="flex items-center justify-between w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="font-medium">⚠️ إضافة عقوبة</span>
              <span>←</span>
            </Link>
          </div>
        </div>

        {/* Recent Absences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">أحدث حالات الغياب</h2>
          {recentAbsences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>لا توجد غيابات حديثة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAbsences.map((absence) => (
                <div key={absence.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium text-gray-900">{absence.eleve?.nom || 'غير معروف'}</p>
                    <p className="text-sm text-gray-500">
                      {absence.date_deb} {absence.heure_deb ? `الساعة ${absence.heure_deb}` : ''}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${absence.justified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {absence.justified ? 'مبرر' : 'غير مبرر'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">المستخدمين</h2>
          <Link href="/users" className="text-blue-600 hover:text-blue-800 text-sm">
            عرض الكل ←
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">المعرف</th>
                <th className="text-right py-3 px-4">الاسم</th>
                <th className="text-right py-3 px-4">اللقب</th>
                <th className="text-right py-3 px-4">الدور</th>
               </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((user) => (
                <tr key={user.matricule} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{user.matricule}</td>
                  <td className="py-3 px-4">{user.nom || '-'}</td>
                  <td className="py-3 px-4">{user.prenom || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-500">
                    لا يوجد مستخدمين
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Classes */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">نظرة عامة على الفصول</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right py-3 px-4">معرف الفصل</th>
                <th className="text-right py-3 px-4">اسم الفصل</th>
                <th className="text-right py-3 px-4">عدد الطلاب</th>
                <th className="text-right py-3 px-4">إجراءات</th>
               </tr>
            </thead>
            <tbody>
              {classes.slice(0, 5).map((classItem) => (
                <tr key={classItem.id_class} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-sm">{classItem.id_class}</td>
                  <td className="py-3 px-4">{classItem.ilbella || '-'}</td>
                  <td className="py-3 px-4">{classItem.nstudent || 0}</td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/students?class=${classItem.id_class}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      عرض الطلاب ←
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}