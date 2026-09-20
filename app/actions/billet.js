// actions/billet.js
"use server";

import { sendPushNotificationToTeacher } from "./notifications";

export async function submitEntryRequest(formData) {
  try {
    // Extract data from formData
    const studentId = formData.get("studentId");
    const studentName = formData.get("studentName");
    const classId = formData.get("classId");
    const className = formData.get("className");
    const absenceStartDate = formData.get("absenceStartDate");
    const absenceStartTime = formData.get("absenceStartTime");
    const isJustified = formData.get("isJustified") === "true";
    const requestedBy = formData.get("requestedBy");
    const requestedByName = formData.get("requestedByName");
    const requestDate = formData.get("requestDate");
    const requestTime = formData.get("requestTime");
    const teacherId = formData.get("teacherId");

    // Send push notification with accept/reject buttons
    const notificationResult = await sendPushNotificationToTeacher(teacherId, {
      title: "📚 طلب دخول قاعة",
      body: `${studentName} - قسم ${className}`,
      data: {
        type: "entry_request",
        studentId,
        studentName,
        classId,
        className,
        absenceStartDate,
        absenceStartTime,
        isJustified,
        requestTime,
        requestDate,
        requestedBy: requestedByName,
      },
      // Mobile app will render these two buttons on the notification
      actions: [
        { action: "accept", title: "✅ قبول" },
        { action: "reject", title: "❌ رفض" },
      ],
    });

    if (!notificationResult.success) {
      return {
        success: false,
        error: "فشل إرسال الإشعار للأستاذ",
      };
    }

    return {
      success: true,
      message: "تم إرسال الإشعار للأستاذ بنجاح",
    };
  } catch {
    return {
      success: false,
      error: "حدث خطأ غير متوقع",
    };
  }
}