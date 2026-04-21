import SingleEleve from './SingleEleve'
import { getStudentById } from '../../../actions/students'
import { getSanctionsByStudent } from '../../../actions/sanctions'
import { getClassById } from '../../../actions/classes'
import {getAttendanceByStudent} from "../../../actions/absence"



export default async function StudentPage({ params }) {
  const { id } = await params
  
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
  
  // Fetch class info
  let classInfo = null
  if (student.id_class) {
    const classResult = await getClassById(student.id_class)
    if (classResult.success) {
      classInfo = classResult.data
    }
  }
  
  // Fetch attendance history
  // You need to add this function to absence.js
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
    />
  )
}