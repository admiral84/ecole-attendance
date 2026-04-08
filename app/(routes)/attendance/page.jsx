// app/page.js
import AttendanceClient from './AttendanceClient'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Attendance Management
      </h1>
      
      <AttendanceClient />
    </div>
  )
}