// app/sanctions/SanctionsClient.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  X, 
  Eye, 
  Trash2,
  Calendar,
  User,
  BookOpen,
  FileText,
  Download,
  TrendingUp
} from 'lucide-react'
import { deleteSanction } from '../../actions/sanctions'

export default function SanctionsClient({ initialSanctions, stats, classes, filters: initialFilters }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [sanctions, setSanctions] = useState(initialSanctions)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    studentId: initialFilters.studentId || '',
    classId: initialFilters.classId || '',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || ''
  })
  const [selectedSanction, setSelectedSanction] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Format date as DD-MM-YYYY (e.g., 24-03-1958)
  const formatDate = (date) => {
    if (!date) return '-'
    
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      
      return `${day}-${month}-${year}`
    } catch (error) {
      return '-'
    }
  }

  // Format date for input fields (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return ''
    return date.split('T')[0]
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filters.studentId) params.set('student', filters.studentId)
    if (filters.classId) params.set('class', filters.classId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    
    router.push(`/sanctions?${params.toString()}`)
    router.refresh()
  }

  const clearFilters = () => {
    setFilters({
      studentId: '',
      classId: '',
      startDate: '',
      endDate: ''
    })
    router.push('/sanctions')
    router.refresh()
  }

  const handleDelete = async (id, studentName) => {
    if (confirm(`هل أنت متأكد من حذف عقوبة التلميذ "${studentName}"؟`)) {
      setLoading(true)
      const result = await deleteSanction(id)
      if (result.success) {
        toast.success('تم حذف العقوبة بنجاح')
        router.refresh()
      } else {
        toast.error(result.error || 'حدث خطأ في حذف العقوبة')
      }
      setLoading(false)
    }
  }

  const viewDetails = (sanction) => {
    setSelectedSanction(sanction)
    setShowDetailsModal(true)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <AlertTriangle size={28} className="text-orange-600" />
          إدارة العقوبات
        </h1>
        <p className="text-gray-600 mt-1">عرض وإدارة عقوبات التلاميذ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">إجمالي العقوبات</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertTriangle size={24} className="text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">الأقسام</p>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byClass).length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <BookOpen size={24} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">هذا الشهر</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(stats.monthly).pop() || 0}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">متوسط شهري</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(stats.total / 6) || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Calendar size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toggle */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <span className="font-medium">فلترة العقوبات</span>
          </div>
          <span className="text-gray-500">{showFilters ? '▲' : '▼'}</span>
        </button>
        
        {showFilters && (
          <div className="px-6 pb-6 border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البحث بتلميذ</label>
                <input
                  type="text"
                  value={filters.studentId}
                  onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
                  placeholder="معرف التلميذ أو الاسم"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                <select
                  value={filters.classId}
                  onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">جميع الأقسام</option>
                  {classes.map((cls) => (
                    <option key={cls.id_class} value={cls.id_class}>
                      {cls.libelle}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Search size={16} />
                تطبيق الفلترة
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition flex items-center gap-2"
              >
                <X size={16} />
                مسح الفلترة
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sanctions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {sanctions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">لا توجد عقوبات مسجلة</p>
            <p className="text-gray-400 text-sm mt-2">قم بإضافة عقوبة جديدة من صفحة التلميذ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">التلميذ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">القسم</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">سبب العقوبة</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ البدء</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ الانتهاء</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاريخ الإضافة</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {sanctions.map((sanction, index) => (
                  <tr key={sanction.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-sm text-gray-500">{index + 1}</td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/students/${sanction.studentId}`}
                        className="hover:text-blue-600 transition"
                      >
                        <div className="font-medium text-gray-900">{sanction.studentName}</div>
                        <div className="text-xs text-gray-500">رقم: {sanction.studentNum}</div>
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        {sanction.className}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-800 max-w-xs truncate">
                        {sanction.motif}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(sanction.startDate)}</td>
                    <td className="py-3 px-4 text-sm">
                      {sanction.endDate ? formatDate(sanction.endDate) : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm">{formatDate(sanction.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewDetails(sanction)}
                          className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition"
                          title="عرض التفاصيل"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(sanction.id, sanction.studentName)}
                          disabled={loading}
                          className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition disabled:opacity-50"
                          title="حذف العقوبة"
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

      {/* Details Modal */}
      {showDetailsModal && selectedSanction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={22} className="text-orange-600" />
                تفاصيل العقوبة
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">التلميذ</label>
                  <p className="font-medium">{selectedSanction.studentName}</p>
                  <p className="text-xs text-gray-500">رقم: {selectedSanction.studentNum}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">القسم</label>
                  <p className="font-medium">{selectedSanction.className}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">سبب العقوبة</label>
                  <p className="font-medium">{selectedSanction.motif}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">تاريخ البدء</label>
                  <p className="font-medium">{formatDate(selectedSanction.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">تاريخ الانتهاء</label>
                  <p className="font-medium">{selectedSanction.endDate ? formatDate(selectedSanction.endDate) : 'غير محدد'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">تاريخ الإضافة</label>
                  <p className="font-medium">{formatDate(selectedSanction.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">أضيف بواسطة</label>
                  <p className="font-medium">{selectedSanction.createdByName || '-'}</p>
                </div>
              </div>
              
              {selectedSanction.rapport && (
                <div>
                  <label className="text-sm text-gray-500">تفاصيل إضافية</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{selectedSanction.rapport}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}