import StudentsClient from './StudentsClient'
import { getStudents, getClasses } from '../../actions/students'

export default async function page() {
  // Load data on the server
  const studentsData = await getStudents()
  const classesData = await getClasses()
  
  // Merge data on the server
  const studentsWithClasses = studentsData.map(student => ({
    ...student,
    classInfo: classesData.find(c => c.id_class === student.id_class)
  }))

  return (
    <StudentsClient 
      initialStudents={studentsWithClasses}
      initialClasses={classesData}
    />
  )
}