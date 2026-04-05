'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { toast } from 'sonner'

export default function UploadStudentsPage() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState([])
  const [uploaded, setUploaded] = useState(0)
  const [errors, setErrors] = useState([])
  const [jsonKeys, setJsonKeys] = useState([])
  const [selectedTable, setSelectedTable] = useState('classes') // Changed default to classes
  const [columnMapping, setColumnMapping] = useState({})

  const tables = [
    { name: 'eleve', label: 'التلاميذ', columns: ['id_eleve', 'nom', 'pere', 'parentphone', 'date_naissance', 'num', 'present', 'id_class'] },
    { name: 'users', label: 'المستخدمين', columns: ['matricule', 'nom', 'prenom', 'role', 'email', 'phone'] },
    { name: 'classes', label: 'الفصول', columns: ['id_class', 'libelle', 'nbstudent'] },
    { name: 'absence', label: 'الغيابات', columns: ['id_eleve', 'id_classe', 'date_deb', 'heure_deb', 'date_fin', 'heure_fin', 'justified'] },
    { name: 'sanctions', label: 'العقوبات', columns: ['id_eleve', 'id_classe', 'motif', 'rapport', 'debut', 'fin'] },
    { name: 'seance', label: 'الحصص', columns: ['id_classe', 'matricule', 'jour', 'debut_heure', 'fin_heure'] }
  ]

  const currentTable = tables.find(t => t.name === selectedTable)

  // Initialize column mapping when table changes
  useEffect(() => {
    const newMapping = {}
    currentTable.columns.forEach(col => {
      newMapping[col] = ''
    })
    setColumnMapping(newMapping)
  }, [selectedTable])

  function handleTableChange(tableName) {
    setSelectedTable(tableName)
    // Don't reset jsonKeys and preview when changing table
    // Only reset if no file is loaded
    if (!file) {
      setJsonKeys([])
      setPreview([])
    }
    setErrors([])
    setUploaded(0)
  }

  function handleFileChange(e) {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return
    
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
        
        setPreview(jsonData.slice(0, 5))
        
        // Extract unique keys from JSON
        const keys = [...new Set(jsonData.flatMap(obj => Object.keys(obj)))]
        setJsonKeys(keys)
        
        // Auto-map columns after loading file
        const newMapping = {}
        currentTable.columns.forEach(dbCol => {
          const match = keys.find(key => 
            key.toLowerCase() === dbCol.toLowerCase() ||
            key.toLowerCase() === 'libelle' && dbCol.toLowerCase() === 'libelle' ||
            key.toLowerCase().replace('_', '') === dbCol.toLowerCase().replace('_', '')
          )
          newMapping[dbCol] = match || ''
        })
        setColumnMapping(newMapping)
        
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

  function handleMappingChange(dbColumn, jsonKey) {
    setColumnMapping({
      ...columnMapping,
      [dbColumn]: jsonKey
    })
  }

  function autoMapColumns() {
    const newMapping = {}
    currentTable.columns.forEach(dbCol => {
      const match = jsonKeys.find(key => 
        key.toLowerCase() === dbCol.toLowerCase() ||
        key.toLowerCase() === 'libelle' && dbCol.toLowerCase() === 'libelle' ||
        key.toLowerCase().replace('_', '') === dbCol.toLowerCase().replace('_', '') ||
        dbCol.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(dbCol.toLowerCase())
      )
      newMapping[dbCol] = match || ''
    })
    setColumnMapping(newMapping)
    toast.success('تم تعيين الحقول تلقائياً')
  }

  async function handleUpload() {
    if (!file) {
      toast.error('الرجاء اختيار ملف أولاً')
      return
    }

    // Check required fields based on table
    let requiredColumns = []
    if (selectedTable === 'eleve') requiredColumns = ['id_eleve', 'nom']
    else if (selectedTable === 'users') requiredColumns = ['matricule', 'nom']
    else if (selectedTable === 'classes') requiredColumns = ['id_class']
    else if (selectedTable === 'absence') requiredColumns = ['id_eleve', 'date_deb']
    else if (selectedTable === 'sanctions') requiredColumns = ['id_eleve', 'motif']
    else if (selectedTable === 'seance') requiredColumns = ['id_classe', 'jour']
    
    const missingMappings = requiredColumns.filter(col => !columnMapping[col])
    if (missingMappings.length > 0) {
      toast.error(`الرجاء تعيين الحقول المطلوبة: ${missingMappings.join(', ')}`)
      return
    }

    setLoading(true)
    setErrors([])
    let successCount = 0
    let errorList = []

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const records = JSON.parse(event.target.result)
        
        for (let i = 0; i < records.length; i++) {
          const record = records[i]
          
          const data = {}
          for (const [dbCol, jsonKey] of Object.entries(columnMapping)) {
            if (jsonKey && record[jsonKey] !== undefined) {
              data[dbCol] = record[jsonKey]
            }
          }

          let primaryKey = 'id'
          if (selectedTable === 'eleve') primaryKey = 'id_eleve'
          if (selectedTable === 'users') primaryKey = 'matricule'
          if (selectedTable === 'classes') primaryKey = 'id_class'
          if (selectedTable === 'absence') primaryKey = 'id'
          if (selectedTable === 'sanctions') primaryKey = 'id'
          if (selectedTable === 'seance') primaryKey = 'id'

          let result
          if (data[primaryKey] && primaryKey !== 'id') {
            const { data: existing } = await supabase
              .from(selectedTable)
              .select(primaryKey)
              .eq(primaryKey, data[primaryKey])
              .single()

            if (existing) {
              result = await supabase
                .from(selectedTable)
                .update(data)
                .eq(primaryKey, data[primaryKey])
            } else {
              result = await supabase
                .from(selectedTable)
                .insert(data)
            }
          } else {
            result = await supabase
              .from(selectedTable)
              .insert(data)
          }

          if (result.error) {
            errorList.push({ row: i + 1, error: result.error.message })
          } else {
            successCount++
          }
        }

        setUploaded(successCount)
        setErrors(errorList)
        
        if (errorList.length === 0) {
          toast.success(`تم رفع ${successCount} سجل بنجاح`)
        } else {
          toast.warning(`تم رفع ${successCount} سجل، ${errorList.length} أخطاء`)
        }
        
      } catch (error) {
        toast.error('خطأ في معالجة الملف')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    
    reader.readAsText(file, 'UTF-8')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">رفع البيانات</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          قم برفع ملف JSON واختيار الجدول وتطابق الحقول
        </p>
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
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 text-center">
            <div className="text-4xl sm:text-5xl mb-3">📤</div>
            <p className="text-gray-600 mb-2 text-sm sm:text-base">
              اختر ملف JSON
            </p>
            <p className="text-xs text-gray-400 mb-4">
              الحد الأقصى: 10MB
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
          {jsonKeys.length > 0 ? (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900">تطابق الحقول</h3>
                <button
                  onClick={autoMapColumns}
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
            </div>
          ) : file ? (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-center">
              <p className="text-yellow-700">⚠️ جاري تحميل الملف...</p>
            </div>
          ) : (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-gray-500">📁 اختر ملف JSON لبدء الرفع</p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading || jsonKeys.length === 0}
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
                          {String(value).substring(0, 30)}
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
          <li>اختر الجدول الذي تريد رفع البيانات إليه</li>
          <li>اختر ملف JSON من جهازك</li>
          <li>قم بتطابق حقول JSON مع أعمدة الجدول</li>
          <li>اضغط على "بدء الرفع"</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          * المعرف (id) يجب أن يكون فريداً لتجنب التكرار<br />
          * التاريخ بصيغة YYYY-MM-DD<br />
          * يمكنك استخدام "تعيين تلقائي" لتطابق الحقول المشابهة
        </p>
      </div>
    </div>
  )
}