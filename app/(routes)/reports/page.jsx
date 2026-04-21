'use client'

import { useState, useEffect } from 'react'
import { getStudentsWithPresentFalse, getAbsentStudentsByDateRange } from '../../actions/absence'
import { toast } from 'sonner'
import { Calendar, Download, Search, Users, UserX, Clock, Filter, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ✅ Arabic font (MUST be here)
import "../../../public/fonts/Amiri-Regular"

// ✅ Arabic reshaper
import reshape from 'arabic-persian-reshaper'

const ar = (text) => reshape(text || '')

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [absences, setAbsences] = useState([])
  const [filteredAbsences, setFilteredAbsences] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [uniqueClasses, setUniqueClasses] = useState([])

  useEffect(() => {
    fetchAbsences()
  }, [selectedDate])

  useEffect(() => {
    filterData()
  }, [searchTerm, selectedClass, absences])

  const fetchAbsences = async () => {
    setLoading(true)
    try {
      const currentlyAbsentResult = await getStudentsWithPresentFalse()
      const dateAbsencesResult = await getAbsentStudentsByDateRange(selectedDate)

      let allAbsences = []

      if (currentlyAbsentResult.success) {
        allAbsences.push(...currentlyAbsentResult.data.map(a => ({
          id: a.absence_id,
          student_id: a.id_eleve,
          student_name: a.nom,
          class_libelle: a.class_libelle,
          absence_start_date: a.absence_start_date,
          absence_start_time: a.absence_start_time,
          absence_end_date: a.absence_end_date || '—',
          absence_end_time: a.absence_end_time || '—',
          justified: a.justified,
          is_still_absent: true
        })))
      }

      if (dateAbsencesResult.success) {
        dateAbsencesResult.data.forEach(a => {
          const exists = allAbsences.some(x =>
            x.student_id === a.student_id &&
            x.absence_start_date === a.absence_start_date
          )
          if (!exists) {
            allAbsences.push({
              id: a.id,
              student_id: a.student_id,
              student_name: a.student_name,
              class_libelle: a.class_libelle,
              absence_start_date: a.absence_start_date,
              absence_start_time: a.absence_start_time,
              absence_end_date: a.absence_end_date || '—',
              absence_end_time: a.absence_end_time || '—',
              justified: a.justified,
              is_still_absent: !a.absence_end_date
            })
          }
        })
      }

      const unique = allAbsences.filter((a, i, self) =>
        i === self.findIndex(x =>
          x.student_id === a.student_id &&
          x.absence_start_date === a.absence_start_date
        )
      )

      unique.sort((a, b) => a.student_name.localeCompare(b.student_name))

      setAbsences(unique)
      setFilteredAbsences(unique)
      setUniqueClasses([...new Set(unique.map(a => a.class_libelle))])

    } catch (e) {
      toast.error('خطأ في تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const filterData = () => {
    let filtered = [...absences]

    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.student_id.toString().includes(searchTerm)
      )
    }

    if (selectedClass) {
      filtered = filtered.filter(a => a.class_libelle === selectedClass)
    }

    setFilteredAbsences(filtered)
  }

  // ================== ✅ FIXED PDF ==================
  const exportToPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' })

      // ✅ Use Arabic font
      doc.setFont('Amiri-Regular')
      doc.setR2L(true)

      doc.setFontSize(20)
      doc.text(ar('تقرير الغيابات'), 148, 15, { align: 'center' })

      doc.setFontSize(12)
      doc.text(ar(`التاريخ: ${selectedDate}`), 148, 25, { align: 'center' })

      const tableData = filteredAbsences.map((a, i) => [
        i + 1,
        a.student_id,
        ar(a.student_name),
        ar(a.class_libelle),
        a.absence_start_date,
        a.absence_start_time,
        a.absence_end_date,
        a.absence_end_time,
        ar(a.justified ? 'مبرر' : 'غير مبرر'),
        ar(a.is_still_absent ? 'لا يزال غائب' : 'عاد')
      ])

      autoTable(doc, {
        startY: 35,
        head: [[
          '#',
          ar('رقم الطالب'),
          ar('اسم الطالب'),
          ar('القسم'),
          ar('تاريخ الغياب'),
          ar('وقت الغياب'),
          ar('تاريخ النهاية'),
          ar('وقت النهاية'),
          ar('الحالة'),
          ar('الوضع')
        ]],
        body: tableData,
        styles: {
          font: 'Amiri-Regular',
          halign: 'center'
        }
      })

      doc.save('report.pdf')
      toast.success('تم إنشاء PDF')

    } catch (err) {
      console.error(err)
      toast.error('فشل إنشاء PDF')
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="p-6" dir="rtl">
      <button
        onClick={exportToPDF}
        className="bg-red-600 text-white px-4 py-2 rounded mb-4"
      >
        تصدير PDF
      </button>

      <table className="w-full border">
        <thead>
          <tr>
            <th>#</th>
            <th>رقم الطالب</th>
            <th>الاسم</th>
            <th>القسم</th>
          </tr>
        </thead>
        <tbody>
          {filteredAbsences.map((a, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{a.student_id}</td>
              <td>{a.student_name}</td>
              <td>{a.class_libelle}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}