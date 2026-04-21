'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAllUsers, deleteUser, updateUserRole, updateUserApproval } from '../../actions/users'
import { toast } from 'sonner'

export default function UsersClient({ 
  isAuthenticated = false, 
  userRole = null, 
  userId = null 
}) {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [updatingRole, setUpdatingRole] = useState(null)
  const [updatingApproval, setUpdatingApproval] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (userRole !== 'admin') {
      console.log("user role is ",userRole)
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

  async function handleRoleChange(userId, newRole) {
    setUpdatingRole(userId)
    const { success, error } = await updateUserRole(userId, newRole)
    
    if (success) {
      toast.success(`تم تغيير دور المستخدم إلى ${getRoleLabel(newRole)} بنجاح`)
      await loadUsers()
    } else {
      toast.error(error || 'حدث خطأ في تغيير الدور')
    }
    
    setUpdatingRole(null)
  }

  async function handleApprovalChange(userId, currentApproved) {
    setUpdatingApproval(userId)
    const newApprovedStatus = !currentApproved
    
    const { success, error } = await updateUserApproval(userId, newApprovedStatus)
    
    if (success) {
      toast.success(newApprovedStatus ? '✅ تم تفعيل المستخدم بنجاح' : '❌ تم إلغاء تفعيل المستخدم')
      await loadUsers()
    } else {
      toast.error(error || 'حدث خطأ في تغيير حالة المستخدم')
    }
    
    setUpdatingApproval(null)
  }

  const openDeleteConfirm = (user) => {
    setUserToDelete(user)
    setShowConfirmModal(true)
  }

  const closeDeleteConfirm = () => {
    setShowConfirmModal(false)
    setUserToDelete(null)
  }

  async function handleDeleteUser() {
    if (!userToDelete) return
    
    setDeleting(userToDelete.user_id)
    closeDeleteConfirm()
    
    const loadingToast = toast.loading('جاري حذف المستخدم...')
    
    const { success, error } = await deleteUser(userToDelete.user_id)
    
    toast.dismiss(loadingToast)
    
    if (success) {
      toast.success(`تم حذف المستخدم "${userToDelete.nom} ${userToDelete.prenom}" بنجاح`)
      await loadUsers()
    } else {
      toast.error(error || 'حدث خطأ أثناء حذف المستخدم')
    }
    
    setDeleting(null)
  }

  const getRoleLabel = (role) => {
    switch(role) {
      case 'admin': return 'أدمين'
      case 'teacher': return 'أستاذ'
      case 'manager': return 'إداري'
      default: return 'مستخدم'
    }
  }

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getApprovalLabel = (approved) => {
    return approved ? '✅ مفعل' : '❌ غير مفعل'
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Delete Confirmation Modal */}
      {showConfirmModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">تأكيد الحذف</h2>
              <button
                onClick={closeDeleteConfirm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                هل أنت متأكد من حذف المستخدم التالي؟
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                <p className="font-semibold text-gray-800">
                  {userToDelete.nom} {userToDelete.prenom}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  المعرف: {userToDelete.matricule}
                </p>
                <p className="text-sm text-gray-600">
                  البريد الإلكتروني: {userToDelete.email || '-'}
                </p>
                <p className="text-sm text-gray-600">
                  الدور: {getRoleLabel(userToDelete.role)}
                </p>
                <p className="text-sm text-gray-600">
                  الحالة: {getApprovalLabel(userToDelete.approved)}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-yellow-800 text-sm">
                  ⚠️ ملاحظة: سيتم حذف المستخدم نهائياً من النظام. جميع السجلات المرتبطة سيتم تعيين معرفها إلى NULL.
                </p>
              </div>
              <p className="text-red-600 text-sm mt-3">
                ⚠️ تحذير: لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting === userToDelete.user_id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting === userToDelete.user_id ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-1">إجمالي المستخدمين: {users.length}</p>
        </div>
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
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    لا يوجد مستخدمين
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
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
                      {user.user_id !== userId ? (
                        <select
                          value={user.role || 'teacher'}
                          onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                          disabled={updatingRole === user.user_id}
                          className={`px-3 py-1 rounded-lg text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            getRoleBadgeColor(user.role)
                          } ${updatingRole === user.user_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <option value="admin">أدمين</option>
                          <option value="teacher">أستاذ</option>
                          <option value="manager">إداري</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleApprovalChange(user.user_id, user.approved)}
                        disabled={updatingApproval === user.user_id || user.user_id === userId}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          user.approved 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${(updatingApproval === user.user_id || user.user_id === userId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {updatingApproval === user.user_id ? (
                          <span className="inline-block animate-spin">⏳</span>
                        ) : (
                          getApprovalLabel(user.approved)
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        {userRole === 'admin' && user.user_id !== userId && (
                          <button
                            onClick={() => openDeleteConfirm(user)}
                            disabled={deleting === user.user_id}
                            className={`text-red-600 hover:text-red-900 transition-colors ${
                              deleting === user.user_id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="حذف"
                          >
                            {deleting === user.user_id ? (
                              <span className="inline-block animate-spin">⏳</span>
                            ) : (
                              'حذف'
                            )}
                          </button>
                        )}
                        {user.user_id === userId && (
                          <span className="text-gray-400 text-sm">(أنت)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900">أدمين</h3>
          <p className="text-2xl font-bold text-red-700">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-purple-900">الإداريين</h3>
          <p className="text-2xl font-bold text-purple-700">
            {users.filter(u => u.role === 'manager').length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900">الأساتذة</h3>
          <p className="text-2xl font-bold text-blue-700">
            {users.filter(u => u.role === 'teacher').length}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-emerald-900">المفعلين</h3>
          <p className="text-2xl font-bold text-emerald-700">
            {users.filter(u => u.approved === true).length}
          </p>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={loadUsers}
          disabled={loading}
          className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>جاري التحديث...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>تحديث القائمة</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}