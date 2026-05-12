import { Suspense } from 'react'
import SanctionsClient from './SanctionsClient'
import { getSanctions, getSanctionsStats } from '../../actions/sanctions'
import { getAllClasses } from '../../actions/classes'

export const dynamic = 'force-dynamic'

export default async function SanctionsPage({ searchParams }) {
  const params = await searchParams
  
  // Build filters object from URL params
  const filters = {}
  if (params?.student) filters.studentId = params.student
  if (params?.class) filters.classId = params.class
  if (params?.startDate) filters.startDate = params.startDate
  if (params?.endDate) filters.endDate = params.endDate
  
  // Fetch data in parallel
  const [sanctionsResult, statsResult, classesResult] = await Promise.all([
    getSanctions(filters),
    getSanctionsStats(),
    getAllClasses()
  ])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <Suspense fallback={<div className="text-center py-12">جاري التحميل...</div>}>
          <SanctionsClient
            initialSanctions={sanctionsResult.data || []}
            stats={statsResult.data || { total: 0, byClass: {}, monthly: {} }}
            classes={classesResult.data || []}
          />
        </Suspense>
      </div>
    </div>
  )
}