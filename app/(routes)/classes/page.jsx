import ClassClient from './ClassClient'
import { getClasses } from '../../actions/students'

export default async function ClassesPage() {
  const classes = await getClasses()
  
  return <ClassClient initialClasses={classes} />
}