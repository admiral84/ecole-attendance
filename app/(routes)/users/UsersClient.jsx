'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllUsers, updateUserRole, deleteUser } from '../../actions/users'
import { toast } from 'sonner'

export default function UsersClient({ 
  isAuthenticated = false, 
  userRole = null, 
  userMatricule = null,
  userEmail = null 
}) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  // Handle redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (userRole !== 'admin') {
      router.push('/')
      return
    }
    
    loadUsers()
  }, [isAuthenticated, userRole])

  async function loadUsers() {
    setLoading(true)
    const { users: allUsers, error } = await getAllUsers()
    
    if (error) {
      toast.error(error)
      if (error.includes('غير مصرح')) {
        router.push('/login')
      }
    } else {
      setUsers(allUsers || [])
    }
    setLoading(false)
  }

  async function handleRoleChange(matricule, newRole) {
    setUpdating(matricule)
    const { success, error } = await updateUserRole(matricule, newRole)
    
    if (success) {
      toast.success('تم تحديث الدور بنجاح')
      await loadUsers()
    } else {
      toast.error(error)
    }
    
    setUpdating(null)
  }

  async function handleDeleteUser(matricule, userName) {
    if (confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟`)) {
      const { success, error } = await deleteUser(matricule)
      
      if (success) {
        toast.success('تم حذف المستخدم بنجاح')
        await loadUsers()
      } else {
        toast.error(error)
      }
    }
  }

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'مدير'
      case 'teacher': return 'أستاذ'
      case 'parent': return 'ولي أمر'
      default: return 'مستخدم'
    }
  }

  // Show loading while checking auth
  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render if not admin (will redirect via useEffect)
  if (userRole !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-1">إجمالي المستخدمين: {users.length}</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          إضافة مستخدم جديد
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المعرف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    لا يوجد مستخدمين
                   </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.matricule} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.matricule}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.nom} {user.prenom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {userRole === 'admin' ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.matricule, e.target.value)}
                          disabled={updating === user.matricule || user.matricule === userMatricule}
                          className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="admin">مدير</option>
                          <option value="teacher">أستاذ</option>
                          <option value="parent">ولي أمر</option>
                        </select>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getRoleLabel(user.role)}
                        </span>
                      )}
                      {updating === user.matricule && (
                        <span className="mr-2 inline-block animate-spin text-sm">⏳</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {userRole === 'admin' && user.matricule !== userMatricule && (
                        <button
                          onClick={() => handleDeleteUser(user.matricule, `${user.nom} ${user.prenom}`)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          حذف
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">المديرين</h3>
          <p className="text-2xl font-bold text-blue-700">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-900">المعلمين</h3>
          <p className="text-2xl font-bold text-green-700">
            {users.filter(u => u.role === 'teacher').length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900">أولياء الأمور</h3>
          <p className="text-2xl font-bold text-purple-700">
            {users.filter(u => u.role === 'parent').length}
          </p>
        </div>
      </div>
    </div>
  )
}