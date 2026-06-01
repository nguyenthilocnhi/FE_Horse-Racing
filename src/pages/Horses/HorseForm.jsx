import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createHorse } from '../../services/horseService'

export default function HorseForm() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [breed, setBreed] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await createHorse({ name, age, breed })
      navigate('/horses')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="card">
      <h2 className="page-title">Add Horse</h2>
      <form className="form-layout" onSubmit={handleSubmit}>
        <div className="form-group">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="input-field" />
        </div>
        <div className="form-group">
          <input value={age} onChange={e => setAge(e.target.value)} placeholder="Age" className="input-field" />
        </div>
        <div className="form-group">
          <input value={breed} onChange={e => setBreed(e.target.value)} placeholder="Breed" className="input-field" />
        </div>
        <div className="form-group" style={{ textAlign: 'right' }}>
          <button className="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
  )
}
