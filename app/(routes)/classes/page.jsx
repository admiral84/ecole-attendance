// app/classes/page.js
import { Suspense } from 'react'
import ClassesListClient from './ClassClient'
import { getAllClasses } from '../../actions/classes'

export const dynamic = 'force-dynamic'

export default async function page() {
  const result = await getAllClasses()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <Suspense fallback={<div className="text-center py-12">جاري التحميل...</div>}>
          <ClassesListClient initialClasses={result.data || []} />
        </Suspense>
      </div>
    </div>
  )
}