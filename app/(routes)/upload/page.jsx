// app/admin/upload/page.jsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getCurrentUser } from '../../actions/users'
import { getAllClasses } from '../../actions/classes'
import { bulkImportStudents } from '../../actions/students'
import { getRoleLabel } from '../../../lib/roles'

export default function UploadStudentsPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState([])
  const [uploaded, setUploaded] = useState(0)
  const [errors, setErrors] = useState([])
  const [jsonKeys, setJsonKeys] = useState([])
  const [selectedTable, setSelectedTable] = useState('eleve')
  const [columnMapping, setColumnMapping] = useState({})
  const [classes, setClasses] = useState([])
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [authorized, setAuthorized] = useState(false)

  // Only students and classes for upload
  const tables = [
    { 
      name: 'eleve', 
      label: 'التلاميذ', 
      requiredRole: ['admin', 'manager'],
      columns: ['id_eleve', 'nom', 'pere', 'parentphone', 'date_naissance', 'num', 'id_class'],
      description: 'رفع قائمة التلاميذ من ملف JSON'
    },
    { 
      name: 'classes', 
      label: 'الأقسام', 
      requiredRole: ['admin', 'manager'],
      columns: ['id_class', 'libelle'],
      description: 'رفع قائمة الأقسام الدراسية'
    }
  ]

  const currentTable = tables.find(t => t.name === selectedTable)

  // Define checkAuthorization with useCallback to avoid dependency issues
  const checkAuthorization = useCallback(async () => {
    try {
      const result = await getCurrentUser()
      
      if (result.user) {
        setUser(result.user)
        setUserRole(result.user.role)
        
        // Check if user has permission for the selected table
        if (currentTable) {
          const hasPermission = currentTable.requiredRole.includes(result.user.role)
          setAuthorized(hasPermission)
          
          if (!hasPermission) {
            toast.error(`غير مصرح لك برفع البيانات إلى جدول ${currentTable.label}.`)
          }
        }
      } else {
        toast.error('الرجاء تسجيل الدخول أولاً')
        setAuthorized(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setAuthorized(false)
    }
  }, [currentTable])

  // Define checkTableAuthorization with useCallback
  const checkTableAuthorization = useCallback(() => {
    if (userRole && currentTable) {
      const hasPermission = currentTable.requiredRole.includes(userRole)
      setAuthorized(hasPermission)
      
      if (!hasPermission) {
        toast.error(`غير مصرح لك برفع البيانات إلى جدول ${currentTable.label}.`)
      }
    }
  }, [userRole, currentTable])

  // Check user authorization on mount
  useEffect(() => {
    checkAuthorization()
    loadClasses()
  }, [checkAuthorization])

  // Check authorization when table changes
  useEffect(() => {
    if (userRole) {
      checkTableAuthorization()
    }
  }, [selectedTable, userRole, checkTableAuthorization])

  async function loadClasses() {
    try {
      const result = await getAllClasses()
      if (result.success && result.data) {
        setClasses(result.data)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    }
  }

  function handleTableChange(tableName) {
    setSelectedTable(tableName)
    setJsonKeys([])
    setPreview([])
    setFile(null)
    setErrors([])
    setUploaded(0)
    
    // Reset column mapping
    const table = tables.find(t => t.name === tableName)
    if (table) {
      const newMapping = {}
      table.columns.forEach(col => {
        newMapping[col] = ''
      })
      setColumnMapping(newMapping)
    }
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
    // Client-side validation
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('الملف كبير جداً. الحد الأقصى 5MB')
      return
    }
    
    setFile(selectedFile)
    
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const content = event.target.result
        const jsonData = JSON.parse(content)
        
        if (!Array.isArray(jsonData)) {
          toast.error('الملف يجب أن يكون مصفوفة JSON []')
          return
        }
        
        if (jsonData.length === 0) {
          toast.error('الملف فارغ')
          return
        }
        
        if (jsonData.length > 1000) {
          toast.warning(`الملف يحتوي على ${jsonData.length} سجل. سيتم رفع أول 1000 سجل فقط`)
        }
        
        setPreview(jsonData.slice(0, 10))
        
        // Extract unique keys from JSON
        const keys = [...new Set(jsonData.flatMap(obj => Object.keys(obj)))]
        setJsonKeys(keys)
        
        // Auto-map columns
        autoMapColumns(keys)
        
        toast.success(`تم تحميل ${jsonData.length} سجل للمعاينة`)
      } catch (error) {
        console.error('JSON Parse Error:', error)
        toast.error('خطأ في قراءة الملف: تأكد من صيغة JSON')
        setPreview([])
        setJsonKeys([])
      }
    }
    
    reader.onerror = () => {
      toast.error('خطأ في قراءة الملف')
    }
    
    reader.readAsText(selectedFile, 'UTF-8')
  }

  function autoMapColumns(keys) {
    const tableColumns = currentTable?.columns || []
    const newMapping = {}
    
    tableColumns.forEach(dbCol => {
      // Try to find matching key
      const match = keys.find(key => 
        key.toLowerCase() === dbCol.toLowerCase() ||
        key.toLowerCase().replace(/[^a-z]/g, '') === dbCol.toLowerCase().replace(/[^a-z]/g, '') ||
        dbCol.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(dbCol.toLowerCase())
      )
      newMapping[dbCol] = match || ''
    })
    
    setColumnMapping(newMapping)
  }

  function handleMappingChange(dbColumn, jsonKey) {
    setColumnMapping({
      ...columnMapping,
      [dbColumn]: jsonKey
    })
  }

  function validateRequiredFields(record) {
    let requiredColumns = []
    
    switch(selectedTable) {
      case 'eleve':
        requiredColumns = ['id_eleve', 'nom']
        break
      case 'classes':
        requiredColumns = ['id_class']
        break
      default:
        requiredColumns = []
    }
    
    const missingMappings = requiredColumns.filter(col => !columnMapping[col])
    if (missingMappings.length > 0) {
      toast.error(`الرجاء تعيين الحقول المطلوبة: ${missingMappings.join(', ')}`)
      return false
    }
    
    // Check if record has required fields
    for (const col of requiredColumns) {
      const jsonKey = columnMapping[col]
      if (!record[jsonKey]) {
        toast.error(`السجل ناقص الحقل المطلوب: ${col}`)
        return false
      }
    }
    
    return true
  }

  async function handleUpload() {
    if (!authorized) {
      toast.error('غير مصرح لك برفع البيانات')
      return
    }

    if (!file) {
      toast.error('الرجاء اختيار ملف أولاً')
      return
    }

    setLoading(true)
    setErrors([])
    setUploaded(0)

    const reader = new FileReader()
    
    reader.onload = async (event) => {
      try {
        const records = JSON.parse(event.target.result)
        const limitedRecords = records.slice(0, 1000) // Limit to 1000 records
        
        let successCount = 0
        let errorList = []
        
        // Process based on table type
        if (selectedTable === 'eleve') {
          // Prepare students data
          const studentsToImport = []
          
          for (let i = 0; i < limitedRecords.length; i++) {
            const record = limitedRecords[i]
            
            if (!validateRequiredFields(record)) {
              errorList.push({ row: i + 1, error: 'حقول مطلوبة ناقصة' })
              continue
            }
            
            const studentData = {}
            for (const [dbCol, jsonKey] of Object.entries(columnMapping)) {
              if (jsonKey && record[jsonKey] !== undefined && record[jsonKey] !== '') {
                // Handle id_class - find class ID by libelle if needed
                if (dbCol === 'id_class' && typeof record[jsonKey] === 'string') {
                  const foundClass = classes.find(c => c.libelle === record[jsonKey])
                  if (foundClass) {
                    studentData[dbCol] = foundClass.id_class
                  } else {
                    studentData[dbCol] = record[jsonKey]
                  }
                } else {
                  studentData[dbCol] = record[jsonKey]
                }
              }
            }
            
            studentsToImport.push(studentData)
          }
          
          // Use bulk import Server Action
          if (studentsToImport.length > 0) {
            const result = await bulkImportStudents(studentsToImport)
            
            if (result.success) {
              successCount = result.count || studentsToImport.length
              toast.success(`تم رفع ${successCount} تلميذ بنجاح`)
            } else {
              errorList.push({ row: 0, error: result.error })
              toast.error(result.error)
            }
          }
          
        } else if (selectedTable === 'classes') {
          // Handle classes upload
          for (let i = 0; i < limitedRecords.length; i++) {
            const record = limitedRecords[i]
            
            if (!record.id_class || !record.libelle) {
              errorList.push({ row: i + 1, error: 'معرف القسم أو الاسم ناقص' })
              continue
            }
            
            // Check if class already exists
            const existingClass = classes.find(c => c.id_class === record.id_class)
            if (existingClass) {
              errorList.push({ row: i + 1, error: `القسم ${record.id_class} موجود بالفعل` })
              continue
            }
            
            // Call createClass Server Action (would need to be implemented)
            errorList.push({ row: i + 1, error: 'رفع الأقسام يحتاج إلى تنفيذ إضافي. يرجى إضافة الأقسام يدوياً.' })
          }
          
        } else {
          toast.warning(`رفع البيانات إلى جدول ${currentTable?.label} غير مدعوم`)
          errorList.push({ row: 0, error: 'هذا الجدول غير مدعوم للرفع' })
        }
        
        setUploaded(successCount)
        setErrors(errorList)
        
        if (errorList.length === 0 && successCount > 0) {
          toast.success(`تم رفع ${successCount} سجل بنجاح`)
        } else if (errorList.length > 0) {
          toast.warning(`تم رفع ${successCount} سجل، ${errorList.length} أخطاء`)
        }
        
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('حدث خطأ في معالجة الملف')
      } finally {
        setLoading(false)
      }
    }
    
    reader.onerror = () => {
      toast.error('خطأ في قراءة الملف')
      setLoading(false)
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  // If not authorized, show access denied
  if (!authorized && userRole) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="bg-red-50 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-red-700 mb-2">غير مصرح به</h2>
          <p className="text-gray-600">
            ليس لديك صلاحية لرفع البيانات إلى جدول {currentTable?.label}.
            <br />
            الدور المطلوب: {currentTable?.requiredRole.join(' أو ')}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            دورك الحالي: {getRoleLabel(userRole)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">رفع البيانات</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          قم برفع ملف JSON لرفع التلاميذ أو الأقسام
        </p>
        {user && (
          <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
            الدور: {getRoleLabel(userRole)} | المستخدم: {user.nom} {user.prenom}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">رفع الملف</h2>
          
          {/* Table Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اختيار الجدول *
            </label>
            <select
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tables.map(table => (
                <option key={table.name} value={table.name}>
                  {table.label} ({table.name})
                </option>
              ))}
            </select>
            {currentTable && (
              <p className="text-xs text-gray-500 mt-1">{currentTable.description}</p>
            )}
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
            <div className="text-4xl sm:text-5xl mb-3">📤</div>
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              اختر ملف JSON
            </p>
            <p className="text-xs text-gray-400 mb-4">
              الحد الأقصى: 5MB
            </p>
            
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                📄 {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            </div>
          )}

          {/* Column Mapping */}
          {jsonKeys.length > 0 && currentTable && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">تطابق الحقول</h3>
                <button
                  onClick={() => autoMapColumns(jsonKeys)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  تعيين تلقائي 🔄
                </button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {currentTable.columns.map(dbCol => (
                  <div key={dbCol} className="flex items-center gap-2 text-sm">
                    <span className="w-32 font-mono text-blue-600">{dbCol}</span>
                    <span className="text-gray-400">→</span>
                    <select
                      value={columnMapping[dbCol] || ''}
                      onChange={(e) => handleMappingChange(dbCol, e.target.value)}
                      className="flex-1 p-2 border rounded-lg text-sm"
                    >
                      <option value="">-- اختر الحقل --</option>
                      {jsonKeys.map(key => (
                        <option key={key} value={key}>{key}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {selectedTable === 'eleve' && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                  💡 ملاحظة: حقل id_class يمكن أن يكون معرف القسم أو اسم القسم (سيتم تحويله تلقائياً)
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading || jsonKeys.length === 0 || !authorized}
            className="w-full mt-6 bg-green-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'جاري الرفع...' : 'بدء الرفع'}
          </button>

          {uploaded > 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
              <p className="text-green-700">
                ✅ تم رفع {uploaded} سجل بنجاح
              </p>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">معاينة البيانات</h2>
          
          {preview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(preview[0]).map(key => (
                      <th key={key} className="text-right p-2 font-mono text-xs">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((record, index) => (
                    <tr key={index} className="border-b">
                      {Object.values(record).map((value, i) => (
                        <td key={i} className="p-2 text-xs truncate max-w-[150px]">
                          {value !== null && value !== undefined ? String(value).substring(0, 30) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mt-2 text-center">
                * عرض أول {preview.length} سجلات فقط
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>لا توجد بيانات للمعاينة</p>
              <p className="text-xs mt-1">اختر ملف JSON لعرض البيانات</p>
            </div>
          )}
        </div>
      </div>

      {/* Errors Section */}
      {errors.length > 0 && (
        <div className="mt-6 bg-red-50 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-red-700 mb-3">⚠️ أخطاء الرفع</h3>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="text-right p-2">الصف</th>
                  <th className="text-right p-2">الخطأ</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, index) => (
                  <tr key={index} className="border-b border-red-200">
                    <td className="p-2 font-mono">{err.row}</td>
                    <td className="p-2 text-red-600">{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 rounded-xl p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3">📋 طريقة الاستخدام</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
          <li>اختر الجدول (تلاميذ أو أقسام)</li>
          <li>اختر ملف JSON من جهازك (بحد أقصى 5MB)</li>
          <li>قم بتطابق حقول JSON مع أعمدة الجدول</li>
          <li>اضغط على بدء الرفع</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 font-semibold mb-2">📝 مثال ملف JSON للتلاميذ:</p>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`[
  {
    "id_eleve": "2024001",
    "nom": "أحمد محمد",
    "pere": "محمد أحمد",
    "parentphone": "0555123456",
    "num": "1",
    "id_class": "3AS1"
  },
  {
    "id_eleve": "2024002", 
    "nom": "سارة علي",
    "pere": "علي أحمد",
    "parentphone": "0555123457",
    "num": "2",
    "id_class": "3AS1"
  }
]`}
          </pre>
        </div>

        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-800 font-semibold mb-2">📝 مثال ملف JSON للأقسام:</p>
          <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`[
  {
    "id_class": "3AS1",
    "libelle": "الثالثة ثانوي علوم تجريبية 1"
  },
  {
    "id_class": "3AS2",
    "libelle": "الثالثة ثانوي علوم تجريبية 2"
  }
]`}
          </pre>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800 font-semibold mb-2">📝 ملاحظات مهمة:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
            <li>رفع التلاميذ: الحقول المطلوبة هي id_eleve و nom</li>
            <li>id_class يمكن أن يكون معرف القسم أو اسم القسم (سيتم تحويله تلقائياً)</li>
            <li>الحد الأقصى للرفع هو 1000 سجل في المرة الواحدة</li>
            <li>التاريخ بصيغة YYYY-MM-DD</li>
            <li>جميع العمليات تتم عبر Server Actions لضمان الأمان</li>
            <li>رفع الأقسام: الحقول المطلوبة هي id_class و libelle</li>
          </ul>
        </div>
      </div>
    </div>
  )
}