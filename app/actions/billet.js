// actions/billet.js
'use server'

import { sendPushNotificationToTeacher } from './notifications'
import { sendAbsenceNotification } from './absence'

export async function submitEntryRequest(formData) {
  try {
    // Extract data from formData
    const studentId = formData.get('studentId')
    const studentName = formData.get('studentName')
    const classId = formData.get('classId')
    const className = formData.get('className')
    const absenceStartDate = formData.get('absenceStartDate')
    const absenceStartTime = formData.get('absenceStartTime')
    const isJustified = formData.get('isJustified') === 'true'
    const requestedBy = formData.get('requestedBy')
    const requestedByName = formData.get('requestedByName')
    const requestDate = formData.get('requestDate')
    const requestTime = formData.get('requestTime')
    const teacherId = formData.get('teacherId')
    
    console.log('📱 Sending push notification to teacher:', teacherId)
    
    // Send push notification with accept/reject buttons
    const notificationResult = await sendPushNotificationToTeacher(teacherId, {
      title: '📚 طلب دخول قاعة',
      body: `${studentName} - قسم ${className}`,
      data: {
        type: 'entry_request',
        studentId: studentId,
        studentName: studentName,
        classId: classId,
        className: className,
        absenceStartDate: absenceStartDate,
        absenceStartTime: absenceStartTime,
        isJustified: isJustified,
        requestTime: requestTime,
        requestDate: requestDate,
        requestedBy: requestedByName
      },
      // Just add these 2 buttons - mobile app will handle them
      actions: [
        { action: 'accept', title: '✅ قبول' },
        { action: 'reject', title: '❌ رفض' }
      ]
    })
    
    if (!notificationResult.success) {
      console.log('⚠️ Push notification failed:', notificationResult.error)
      return { 
        success: false, 
        error: 'فشل إرسال الإشعار للأستاذ' 
      }
    }
    
    return { 
      success: true, 
      message: 'تم إرسال الإشعار للأستاذ بنجاح' 
    }
    
  } catch (error) {
    console.error('Error in submitEntryRequest:', error)
    return { 
      success: false, 
      error: error.message 
    }
  }
}