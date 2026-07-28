// components/DebugTeachers.jsx
'use client'

import { useState } from 'react'
import { getTeachersForClass, debugSeanceTable, getAllTeachers } from '../actions/seance'

export default function DebugTeachers({ classId }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testGetTeachers = async () => {
    setLoading(true)
    const teachers = await getTeachersForClass(classId)
    setResult({ type: 'getTeachersForClass', data: teachers })
    setLoading(false)
  }

  const testDebugSeance = async () => {
    setLoading(true)
    const data = await debugSeanceTable()
    setResult({ type: 'debugSeanceTable', data })
    setLoading(false)
  }

  const testGetAllTeachers = async () => {
    setLoading(true)
    const teachers = await getAllTeachers()
    setResult({ type: 'getAllTeachers', data: teachers })
    setLoading(false)
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg" dir="rtl">
      <h3 className="font-bold mb-2">Debug: Find Teachers for Class {classId}</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testGetTeachers}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          Test Get Teachers
        </button>
        <button
          onClick={testDebugSeance}
          disabled={loading}
          className="px-3 py-1 bg-green-500 text-white rounded"
        >
          Debug Seance Table
        </button>
        <button
          onClick={testGetAllTeachers}
          disabled={loading}
          className="px-3 py-1 bg-purple-500 text-white rounded"
        >
          Get All Teachers
        </button>
      </div>
      
      {loading && <div>Loading...</div>}
      
      {result && (
        <div className="mt-2">
          <p className="font-semibold">{result.type}:</p>
          <pre className="bg-white p-2 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Checklist:</p>
        <ul className="list-disc list-inside">
          <li>Does the class ID {classId} exist in classes table?</li>
          <li>Are there any records in seance table with id_classe = {classId}?</li>
          <li>Do the user_id values in seance exist in users table?</li>
          <li>Are the users with those user_id have role = 'teacher'?</li>
        </ul>
      </div>
    </div>
  )
}