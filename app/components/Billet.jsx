// components/Billet.jsx
'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export default function Billet({ student, classLibelle, onClose, onConfirm }) {
  const [isJustified, setIsJustified] = useState(false)
  const [currentDateTime, setCurrentDateTime] = useState({
    date: '',
    time: ''
  })

  // Function to convert English/Persian numbers to Arabic numbers
  const toArabicNumbers = (str) => {
    const arabicNumbers = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9'
    }
    return str.replace(/[٠-٩]/g, (digit) => arabicNumbers[digit])
  }

  useEffect(() => {
    // Get current date and time
    const now = new Date()
    
    // Format date with Arabic numbers
    const formattedDate = now.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    // Format time and convert to Arabic numbers
    let formattedTime = now.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    // Convert time numbers to Arabic
    formattedTime = toArabicNumbers(formattedTime)
    
    // Convert date numbers to Arabic
    const dateWithArabicNumbers = toArabicNumbers(formattedDate)
    
    setCurrentDateTime({
      date: dateWithArabicNumbers,
      time: formattedTime
    })
  }, [])

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(student.id_eleve || student.student_id, isJustified)
    }
    if (onClose) {
      onClose()
    }
  }

  const handleDecline = () => {
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-3 px-4 text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            <h2 className="text-lg font-bold">بطاقة دخول</h2>
          </div>
          <p className="text-green-100 text-xs mt-1">تصريح بدخول قاعة الدرس</p>
        </div>

        {/* Billet Content */}
        <div id="billet-content" className="p-4">
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-sm">
              يسمح للتلميذ
            </p>
            
            <p className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 py-2 px-3 rounded-lg inline-block">
              {student.nom || student.student_name}
            </p>
            
            <p className="text-gray-500 text-sm">
              المرسم بالقسم
            </p>
            
            <p className="text-lg font-semibold text-indigo-600 bg-indigo-50 py-1 px-3 rounded-lg inline-block">
              {classLibelle}
            </p>
            
            <p className="text-gray-500 text-sm">
              بدخول قاعة الدرس يوم
            </p>
            
            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
              <p className="text-sm font-medium text-gray-800">
                {currentDateTime.date}
              </p>
              <p className="text-sm text-gray-600">
                على الساعة {currentDateTime.time}
              </p>
            </div>

            {/* Justified Absence Checkbox */}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <label className="flex items-center justify-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isJustified}
                  onChange={(e) => setIsJustified(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 text-sm font-medium">غياب مبرر</span>
              </label>
              {isJustified && (
                <div className="mt-1 text-xs text-green-600 flex items-center justify-center gap-1">
                  <CheckCircle size={12} />
                  سيتم تسجيل الغياب كغياب مبرر
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Confirm and Decline buttons */}
        <div className="bg-gray-50 px-4 py-3 flex gap-2 border-t border-gray-200">
          <button
            onClick={handleConfirm}
            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <CheckCircle size={16} />
            تأكيد
          </button>
          <button
            onClick={handleDecline}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <XCircle size={16} />
            رفض
          </button>
        </div>
      </div>
    </div>
  )
}