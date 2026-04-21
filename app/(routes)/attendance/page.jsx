
import AttendanceClient from './AttendanceClient'

export const metadata = {
  title: 'نظام إدارة الحضور والغياب',
  description: 'تسجيل ومتابعة حضور وغياب التلاميذ'
}

export default function HomePage() {
  return <AttendanceClient />
}