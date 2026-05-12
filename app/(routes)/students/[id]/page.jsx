import SingleEleve from './SingleEleve'
import { getStudentById } from '../../../actions/students'
import { getSanctionsByStudent } from '../../../actions/sanctions'
import { getClassById } from '../../../actions/classes'
import { getAttendanceByStudent } from "../../../actions/absence"
import { getCurrentUser } from '../../../actions/users'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StudentPage({ params }) {
  const { id } = await params
  
  // ✅ Get current user with role
  const { user: currentUser, error: authError } = await getCurrentUser()
  
  if (authError || !currentUser) {
    redirect('/login')
  }
  
  // Fetch student data using server action
  const studentResult = await getStudentById(id)
  
  if (!studentResult.success || !studentResult.data) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">❌</div>
        <h2 className="text-xl font-bold mb-2">التلميذ غير موجود</h2>
      </div>
    )
  }
  
  const student = studentResult.data
  const userRole = currentUser.role || 'teacher'
  
  // ✅ Check if teacher has permission to view this student
  if (userRole === 'teacher') {
    // Teacher can only view students in their classes
    const supabase = await createClient()
    const { data: seance } = await supabase
      .from('seance')
      .select('id')
      .eq('user_id', currentUser.user_id)
      .eq('id_classe', student.id_class)
      .maybeSingle()
    
    if (!seance) {
      return (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">غير مصرح به</h2>
          <p className="text-gray-600">أنت غير مسؤول عن هذا التلميذ</p>
          <Link href="/students" className="text-blue-600 hover:underline mt-4 inline-block">
            العودة إلى التلاميذ
          </Link>
        </div>
      )
    }
  }
  
  // Fetch class info
  let classInfo = null
  if (student.id_class) {
    const classResult = await getClassById(student.id_class)
    if (classResult.success) {
      classInfo = classResult.data
    }
  }
  
  // Fetch attendance history
  const attendanceResult = await getAttendanceByStudent(id)
  const attendance = attendanceResult.success ? attendanceResult.data : []
  
  // Fetch sanctions using server action
  const sanctionsResult = await getSanctionsByStudent(id)
  const sanctions = sanctionsResult.success ? sanctionsResult.data : []
  
  // Calculate statistics
  const totalAbsences = attendance?.length || 0
  const justifiedAbsences = attendance?.filter(a => a.justified === true).length || 0
  const unJustifiedAbsences = totalAbsences - justifiedAbsences
  const totalSanctions = sanctions?.length || 0

  return (
    <SingleEleve 
      student={student}
      classInfo={classInfo}
      attendance={attendance || []}
      sanctions={sanctions || []}
      stats={{
        totalAbsences,
        justifiedAbsences,
        unJustifiedAbsences,
        totalSanctions
      }}
      userRole={userRole}
    />
  )
}