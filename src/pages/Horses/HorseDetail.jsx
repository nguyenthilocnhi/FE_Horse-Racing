import React from 'react'
import { useParams } from 'react-router-dom'

export default function HorseDetail() {
  const { id } = useParams()

  return (
    <div className="card">
      <h2 className="page-title">Horse Detail</h2>
      <p>ID: {id}</p>
      <p>This page shows the details of the selected horse.</p>
    </div>
  )
}
