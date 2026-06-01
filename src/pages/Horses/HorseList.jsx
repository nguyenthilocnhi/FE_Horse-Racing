import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Table from '../../components/Table/Table'
import { getHorses } from '../../services/horseService'

export default function HorseList() {
  const [horses, setHorses] = useState([])

  useEffect(() => {
    async function loadHorses() {
      try {
        const data = await getHorses()
        setHorses(data || [])
      } catch (error) {
        console.error(error)
      }
    }

    loadHorses()
  }, [])

  const columns = ['Name', 'Age', 'Breed']
  const data = horses.map((horse) => ({
    Name: horse.name || '-',
    Age: horse.age || '-',
    Breed: horse.breed || '-'
  }))

  return (
    <div className="card">
      <div className="flex space-between" style={{ marginBottom: '20px' }}>
        <h2 className="page-title">Horses</h2>
        <Link to="/horses/new" className="btn btn-primary">Add Horse</Link>
      </div>
      <Table columns={columns} data={data} />
    </div>
  )
}
