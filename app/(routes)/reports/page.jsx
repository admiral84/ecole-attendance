'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { getAllClasses } from '../../actions/classes'
import { getStudentsWithPresentFalse, getAbsentStudentsByDateRange } from '../../actions/absence'
import { getSanctions } from '../../actions/sanctions'
import { getCurrentUser } from '../../actions/users'
import { toast } from 'sonner'

export default function ReportsPage() {
  // États pour les absences
  const [absents, setAbsents] = useState([])
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [reportType, setReportType] = useState('active')
  const [stats, setStats] = useState({ total: 0, justified: 0, unJustified: 0 })
  const [generating, setGenerating] = useState(false)
  const [userRole, setUserRole] = useState(null)

  // États pour les sanctions
  const [sanctions, setSanctions] = useState([])
  const [sanctionsLoading, setSanctionsLoading] = useState(false)
  const [sanctionsReportType, setSanctionsReportType] = useState('all')
  const [sanctionsSelectedClass, setSanctionsSelectedClass] = useState('all')
  const [sanctionsStartDate, setSanctionsStartDate] = useState('')
  const [sanctionsEndDate, setSanctionsEndDate] = useState('')
  const [sanctionsStats, setSanctionsStats] = useState({ total: 0, byClass: {} })
  const [generatingSanctionsPDF, setGeneratingSanctionsPDF] = useState(false)
  const [activeReportTab, setActiveReportTab] = useState('absences')

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayDate = getTodayDate()

  // Charger le rôle utilisateur
  useEffect(() => {
    const loadUserRole = async () => {
      const { user } = await getCurrentUser()
      if (user) {
        setUserRole(user.role)
      }
    }
    loadUserRole()
  }, [])

  // Charger les classes une seule fois
  useEffect(() => {
    const loadClassesOnce = async () => {
      try {
        const result = await getAllClasses()
        if (result.success) {
          setClasses(result.data)
        } else {
          toast.error('خطأ في تحميل الأقسام: ' + result.error)
        }
      } catch (error) {
        console.error('Error loading classes:', error)
        toast.error('حدث خطأ في تحميل الأقسام')
      }
    }
    loadClassesOnce()
  }, [])

  // Fonction pour charger les données d'absence
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch current active absences (students with present = false)
      const activeResult = await getStudentsWithPresentFalse()
      
      // Fetch absences from today's date range
      const todayResult = await getAbsentStudentsByDateRange(todayDate)
      
      let allAbsences = []
      
      // Process active absences
      if (activeResult.success && activeResult.data) {
        const activeAbsences = activeResult.data.map(item => ({
          id: item.absence_id || item.id,
          nom: item.nom || 'غير معروف',
          num: item.num || '-',
          class_libelle: item.class_libelle || 'بدون قسم',
          id_classe: item.id_class,
          debut: item.absence_start_date,
          heure_deb: item.absence_start_time,
          fin: item.absence_end_date,
          heure_fin: item.absence_end_time,
          justified: item.justified || false,
          present: item.present,
          type: 'active'
        }))
        allAbsences.push(...activeAbsences)
      }
      
      // Process today's absences (those that started today or ended today)
      if (todayResult.success && todayResult.data) {
        const todayAbsences = todayResult.data
          .filter(item => {
            // Include if absence starts today OR ends today
            const startsToday = item.absence_start_date === todayDate
            const endsToday = item.absence_end_date === todayDate
            return startsToday || endsToday
          })
          .map(item => ({
            id: item.id,
            nom: item.student_name || 'غير معروف',
            num: item.student_num || '-',
            class_libelle: item.class_libelle || 'بدون قسم',
            id_classe: null,
            debut: item.absence_start_date,
            heure_deb: item.absence_start_time,
            fin: item.absence_end_date,
            heure_fin: item.absence_end_time,
            justified: item.justified || false,
            present: item.present,
            type: 'today'
          }))
        allAbsences.push(...todayAbsences)
      }
      
      // Remove duplicates based on student name + date
      const uniqueMap = new Map()
      for (const item of allAbsences) {
        const key = `${item.nom}-${item.num}-${item.debut}`
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item)
        }
      }
      
      let formattedData = Array.from(uniqueMap.values())
      
      // Filter by selected class
      if (selectedClass !== 'all') {
        const selectedClassObj = classes.find(c => c.id_class === selectedClass)
        if (selectedClassObj) {
          formattedData = formattedData.filter(item => 
            item.class_libelle === selectedClassObj.libelle
          )
        }
      }
      
      setAbsents(formattedData)
      const total = formattedData.length
      const justified = formattedData.filter(item => item.justified).length
      const unJustified = total - justified
      setStats({ total, justified, unJustified })
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('حدث خطأ في جلب البيانات')
      setAbsents([])
      setStats({ total: 0, justified: 0, unJustified: 0 })
    } finally {
      setLoading(false)
    }
  }, [selectedClass, classes, todayDate])

  // Fonction pour charger les sanctions du jour
  const loadSanctionsData = useCallback(async () => {
    try {
      setSanctionsLoading(true)
      
      // Fetch all sanctions first
      const filters = {}
      
      if (sanctionsSelectedClass !== 'all') {
        filters.classId = sanctionsSelectedClass
      }
      
      const result = await getSanctions(filters)
      
      if (result.success) {
        let filteredData = result.data || []
        
        // Filter sanctions that started today OR end today
        filteredData = filteredData.filter(sanction => {
          const startsToday = sanction.startDate === todayDate
          const endsToday = sanction.endDate === todayDate
          return startsToday || endsToday
        })
        
        // Apply additional date filters if provided
        if (sanctionsStartDate) {
          filteredData = filteredData.filter(s => s.startDate >= sanctionsStartDate)
        }
        
        if (sanctionsEndDate) {
          filteredData = filteredData.filter(s => s.startDate <= sanctionsEndDate)
        }
        
        setSanctions(filteredData)
        
        const byClass = {}
        filteredData.forEach(sanction => {
          const className = sanction.className || 'بدون قسم'
          byClass[className] = (byClass[className] || 0) + 1
        })
        
        setSanctionsStats({
          total: filteredData.length,
          byClass
        })
      } else {
        toast.error('خطأ في جلب بيانات العقوبات: ' + (result.error || 'خطأ غير معروف'))
        setSanctions([])
        setSanctionsStats({ total: 0, byClass: {} })
      }
    } catch (error) {
      console.error('Error loading sanctions:', error)
      toast.error('حدث خطأ في جلب بيانات العقوبات')
      setSanctions([])
      setSanctionsStats({ total: 0, byClass: {} })
    } finally {
      setSanctionsLoading(false)
    }
  }, [sanctionsSelectedClass, sanctionsStartDate, sanctionsEndDate, todayDate])

  // Effet pour les absences
  useEffect(() => {
    if (activeReportTab === 'absences') {
      loadData()
    }
  }, [activeReportTab, loadData])

  // Effet pour les sanctions
  useEffect(() => {
    if (activeReportTab === 'sanctions') {
      loadSanctionsData()
    }
  }, [activeReportTab, loadSanctionsData])

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '-'
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const time = timeStr || `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      return `${day}/${month}/${year} ${time}`
    } catch {
      return '-'
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return '-'
      const day = String(d.getDate()).padStart(2, '0')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const year = d.getFullYear()
      return `${day}/${month}/${year}`
    } catch {
      return '-'
    }
  }

  const generatePDF = async () => {
    if (absents.length === 0) {
      toast.warning('لا توجد بيانات لإنشاء التقرير')
      return
    }

    setGenerating(true)
    toast.loading('جاري إنشاء التقرير...', { id: 'pdf' })
    
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const jsPDF = (await import('jspdf')).default
      
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.padding = '20px'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.direction = 'rtl'
      
      const selectedClassName = selectedClass === 'all' 
        ? 'جميع الأقسام' 
        : (classes.find(c => c.id_class === selectedClass)?.libelle || 'الكل')
      
      const currentDate = new Date()
      const reportTitle = `تقرير غيابات اليوم - ${currentDate.toLocaleDateString('ar-EG')}`
      
      let tableRows = ''
      for (let i = 0; i < absents.length; i++) {
        const item = absents[i]
        const bgColor = i % 2 === 0 ? '#f5f5f5' : '#ffffff'
        tableRows += `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${i + 1}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: right;">${(item.nom || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${(item.num || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: right;">${(item.class_libelle || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${formatDateTime(item.debut, item.heure_deb)}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${item.fin ? formatDateTime(item.fin, item.heure_fin) : 'مستمر'}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${item.justified ? 'مبررة' : 'غير مبررة'}</td>
          </tr>
        `
      }
      
      tempDiv.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2980b9; padding-bottom: 10px;">
            <h1 style="font-size: 20pt; margin: 0; color: #2c3e50;">معهد عبدالحميد غزواني</h1>
            <h2 style="font-size: 16pt; margin: 10px 0; color: #34495e;">تقرير الغياب اليومي</h2>
            <p style="font-size: 11pt; color: #7f8c8d;">${reportTitle}</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>تاريخ التقرير:</strong> ${currentDate.toLocaleDateString('ar-EG')}</span>
              <span><strong>القسم:</strong> ${selectedClassName}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>إجمالي الغيابات:</strong> ${stats.total}</span>
              <span><strong>غيابات مبررة:</strong> ${stats.justified}</span>
              <span><strong>غيابات غير مبررة:</strong> ${stats.unJustified}</span>
            </div>
          </div>
          
          <div style="margin-bottom: 20px; display: flex; gap: 10px;">
            <div style="flex: 1; background-color: #3498db; color: white; padding: 10px; border-radius: 5px; text-align: center;">
              <div style="font-size: 20pt; font-weight: bold;">${stats.total}</div>
              <div style="font-size: 10pt;">إجمالي الغيابات</div>
            </div>
            <div style="flex: 1; background-color: #27ae60; color: white; padding: 10px; border-radius: 5px; text-align: center;">
              <div style="font-size: 20pt; font-weight: bold;">${stats.justified}</div>
              <div style="font-size: 10pt;">غيابات مبررة</div>
            </div>
            <div style="flex: 1; background-color: #e67e22; color: white; padding: 10px; border-radius: 5px; text-align: center;">
              <div style="font-size: 20pt; font-weight: bold;">${stats.unJustified}</div>
              <div style="font-size: 10pt;">غيابات غير مبررة</div>
            </div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #2980b9; color: white;">
                <th style="padding: 10px; border: 1px solid #cccccc;">#</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">الاسم</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">الرقم</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">القسم</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">تاريخ البدء</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">تاريخ الانتهاء</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #cccccc; text-align: center; font-size: 9pt; color: #7f8c8d;">
            <p>تم إنشاء هذا التقرير بواسطة نظام معهد عبدالحميد غزواني</p>
            <p>* يشمل التقرير الغيابات التي بدأت أو انتهت اليوم</p>
          </div>
        </div>
      `
      
      document.body.appendChild(tempDiv)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const fileName = `rapport-absence-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      document.body.removeChild(tempDiv)
      toast.success('تم إنشاء التقرير بنجاح', { id: 'pdf' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('حدث خطأ في إنشاء التقرير: ' + error.message, { id: 'pdf' })
    } finally {
      setGenerating(false)
    }
  }

  const generateSanctionsPDF = async () => {
    if (sanctions.length === 0) {
      toast.warning('لا توجد بيانات لإنشاء التقرير')
      return
    }

    setGeneratingSanctionsPDF(true)
    toast.loading('جاري إنشاء تقرير العقوبات...', { id: 'sanctions-pdf' })
    
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const jsPDF = (await import('jspdf')).default
      
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.padding = '20px'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.direction = 'rtl'
      
      const selectedClassName = sanctionsSelectedClass === 'all' 
        ? 'جميع الأقسام' 
        : (classes.find(c => c.id_class === sanctionsSelectedClass)?.libelle || 'الكل')
      
      const currentDate = new Date()
      const reportTitle = `تقرير عقوبات اليوم - ${currentDate.toLocaleDateString('ar-EG')}`
      
      let tableRows = ''
      for (let i = 0; i < sanctions.length; i++) {
        const item = sanctions[i]
        const bgColor = i % 2 === 0 ? '#f5f5f5' : '#ffffff'
        tableRows += `
          <tr style="background-color: ${bgColor};">
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${i + 1}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: right;">${(item.studentName || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${(item.studentNum || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: right;">${(item.className || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: right;">${(item.motif || '-').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${formatDate(item.startDate)}</td>
            <td style="padding: 10px; border: 1px solid #cccccc; text-align: center;">${item.endDate ? formatDate(item.endDate) : 'مستمرة'}</td>
          </tr>
        `
      }
      
      tempDiv.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e67e22; padding-bottom: 10px;">
            <h1 style="font-size: 20pt; margin: 0; color: #2c3e50;">معهد عبدالحميد غزواني</h1>
            <h2 style="font-size: 16pt; margin: 10px 0; color: #e67e22;">تقرير العقوبات اليومي</h2>
            <p style="font-size: 11pt; color: #7f8c8d;">${reportTitle}</p>
          </div>
          
          <div style="margin-bottom: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span><strong>تاريخ التقرير:</strong> ${currentDate.toLocaleDateString('ar-EG')}</span>
              <span><strong>القسم:</strong> ${selectedClassName}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span><strong>إجمالي العقوبات:</strong> ${sanctionsStats.total}</span>
            </div>
          </div>
          
          <div style="margin-bottom: 20px; background-color: #e67e22; color: white; padding: 10px; border-radius: 5px; text-align: center;">
            <div style="font-size: 20pt; font-weight: bold;">${sanctionsStats.total}</div>
            <div style="font-size: 10pt;">إجمالي العقوبات</div>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #e67e22; color: white;">
                <th style="padding: 10px; border: 1px solid #cccccc;">#</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">التلميذ</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">الرقم</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">القسم</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">سبب العقوبة</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">تاريخ البدء</th>
                <th style="padding: 10px; border: 1px solid #cccccc;">تاريخ الانتهاء</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #cccccc; text-align: center; font-size: 9pt; color: #7f8c8d;">
            <p>تم إنشاء هذا التقرير بواسطة نظام معهد عبدالحميد غزواني</p>
            <p>* يشمل التقرير العقوبات التي بدأت أو انتهت اليوم</p>
          </div>
        </div>
      `
      
      document.body.appendChild(tempDiv)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        doc.addPage()
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const fileName = `rapport-sanctions-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      document.body.removeChild(tempDiv)
      toast.success('تم إنشاء تقرير العقوبات بنجاح', { id: 'sanctions-pdf' })
    } catch (error) {
      console.error('Error generating sanctions PDF:', error)
      toast.error('حدث خطأ في إنشاء التقرير: ' + error.message, { id: 'sanctions-pdf' })
    } finally {
      setGeneratingSanctionsPDF(false)
    }
  }

  if (loading && activeReportTab === 'absences' && absents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 التقارير اليومية</h1>
          <p className="text-gray-600">عرض وتصدير تقارير الغياب والعقوبات الخاصة باليوم الحالي</p>
          {userRole && (
            <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              الدور: {userRole === 'admin' ? 'مدير' : userRole === 'manager' ? 'مدير عام' : 'أستاذ'}
            </div>
          )}
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveReportTab('absences')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${
                activeReportTab === 'absences'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📖 تقارير الغياب
            </button>
            <button
              onClick={() => setActiveReportTab('sanctions')}
              className={`flex-1 py-4 px-6 text-center font-medium transition ${
                activeReportTab === 'sanctions'
                  ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              ⚠️ تقارير العقوبات
            </button>
          </div>
        </div>

        {/* Rapport des Absences */}
        {activeReportTab === 'absences' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">جميع الأقسام</option>
                    {classes.map(cls => (
                      <option key={cls.id_class} value={cls.id_class}>
                        {cls.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 items-end">
                  <button
                    onClick={() => loadData()}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    🔄 تحديث
                  </button>
                  <button
                    onClick={generatePDF}
                    disabled={generating || absents.length === 0}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>جاري...</span>
                      </>
                    ) : (
                      <>
                        📄 <span>PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 bg-blue-50 p-2 rounded-lg">
                📌 يشمل التقرير الغيابات التي بدأت أو انتهت اليوم ({formatDate(todayDate)})
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-500 rounded-2xl shadow-lg p-6 text-white">
                <p className="text-blue-100 text-sm">إجمالي الغيابات</p>
                <p className="text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="bg-green-500 rounded-2xl shadow-lg p-6 text-white">
                <p className="text-green-100 text-sm">غيابات مبررة</p>
                <p className="text-3xl font-bold mt-2">{stats.justified}</p>
              </div>
              <div className="bg-orange-500 rounded-2xl shadow-lg p-6 text-white">
                <p className="text-orange-100 text-sm">غيابات غير مبررة</p>
                <p className="text-3xl font-bold mt-2">{stats.unJustified}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">#</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">الاسم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">الرقم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">القسم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">تاريخ البدء</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">تاريخ الانتهاء</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {absents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          لا توجد غيابات اليوم
                        </td>
                      </tr>
                    ) : (
                      absents.map((item, index) => (
                        <tr key={`${item.id}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nom}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.num}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.class_libelle}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {formatDateTime(item.debut, item.heure_deb)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.fin ? formatDateTime(item.fin, item.heure_fin) : 'مستمر'}
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            {item.justified ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">مبررة</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">غير مبررة</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Rapport des Sanctions */}
        {activeReportTab === 'sanctions' && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                  <select
                    value={sanctionsSelectedClass}
                    onChange={(e) => setSanctionsSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">جميع الأقسام</option>
                    {classes.map(cls => (
                      <option key={cls.id_class} value={cls.id_class}>
                        {cls.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 items-end">
                  <button
                    onClick={() => loadSanctionsData()}
                    disabled={sanctionsLoading}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    🔄 تحديث
                  </button>
                  <button
                    onClick={generateSanctionsPDF}
                    disabled={generatingSanctionsPDF || sanctions.length === 0}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {generatingSanctionsPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>جاري...</span>
                      </>
                    ) : (
                      <>
                        📄 <span>PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500 bg-orange-50 p-2 rounded-lg">
                📌 يشمل التقرير العقوبات التي بدأت أو انتهت اليوم ({formatDate(todayDate)})
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-orange-500 rounded-2xl shadow-lg p-6 text-white">
                <p className="text-orange-100 text-sm">إجمالي العقوبات</p>
                <p className="text-3xl font-bold mt-2">{sanctionsStats.total}</p>
              </div>
              <div className="bg-purple-500 rounded-2xl shadow-lg p-6 text-white">
                <p className="text-purple-100 text-sm">عدد الأقسام</p>
                <p className="text-3xl font-bold mt-2">{Object.keys(sanctionsStats.byClass).length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">#</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">التلميذ</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">الرقم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">القسم</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">سبب العقوبة</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">تاريخ البدء</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 text-center">تاريخ الانتهاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctionsLoading ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                          <p className="mt-2">جاري تحميل البيانات...</p>
                        </td>
                      </tr>
                    ) : sanctions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                          لا توجد عقوبات اليوم
                        </td>
                      </tr>
                    ) : (
                      sanctions.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{index + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.studentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.studentNum}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.className}</td>
                          <td className="px-4 py-3 text-sm text-gray-800">{item.motif}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{formatDate(item.startDate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">
                            {item.endDate ? formatDate(item.endDate) : 
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">مستمرة</span>
                            }
                            </td>
                          </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}