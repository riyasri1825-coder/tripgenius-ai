import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { FormField, SelectField } from '../components/FormField'
import InterestPicker from '../components/InterestPicker'
import { generateTrip } from '../services/tripPlanner'

const initialPreferences = { destination: '', days: '', budget: '', interests: [], travelType: '' }
const budgetOptions = [{ value: 'budget', label: 'Budget friendly' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'luxury', label: 'A little luxe' }]
const travelTypeOptions = [{ value: 'solo', label: 'Solo reset' }, { value: 'couple', label: 'A trip for two' }, { value: 'family', label: 'Family adventure' }, { value: 'friends', label: 'Friends getaway' }]

function validate(preferences) {
  const errors = {}
  if (!preferences.destination.trim()) errors.destination = 'Tell us where you want to go.'
  if (!preferences.days) errors.days = 'Add the number of days.'
  else if (Number(preferences.days) < 1 || Number(preferences.days) > 60) errors.days = 'Choose between 1 and 60 days.'
  if (!preferences.budget) errors.budget = 'Choose a budget style.'
  if (!preferences.interests.length) errors.interests = 'Choose at least one interest.'
  if (!preferences.travelType) errors.travelType = 'Choose who you are travelling with.'
  return errors
}

export default function PlannerPage() {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')
  const updatePreference = (event) => { const { name, value } = event.target; setPreferences((current) => ({ ...current, [name]: value })); setErrors((current) => ({ ...current, [name]: undefined })); setStatus('idle') }
  const toggleInterest = (interest) => { setPreferences((current) => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter((item) => item !== interest) : [...current.interests, interest] })); setErrors((current) => ({ ...current, interests: undefined })) }
  const handleSubmit = async (event) => { event.preventDefault(); const nextErrors = validate(preferences); setErrors(nextErrors); if (Object.keys(nextErrors).length) return; setStatus('loading'); try { await generateTrip({ ...preferences, days: Number(preferences.days) }); setStatus('success') } catch { setStatus('error') } }

  return (
    <div className="app-shell planner-shell">
      <Navbar />
      <main className="planner-page section-wrap">
        <Link className="back-link" to="/">← Back home</Link>
        <div className="planner-intro"><p className="eyebrow"><span className="eyebrow-dot" /> Your trip, your way</p><h1>Where will you go<br /><span>next?</span></h1><p>Give us a starting point and we’ll help turn it into a trip worth remembering.</p></div>
        <form className="planner-form" onSubmit={handleSubmit} noValidate>
          <FormField label="Where do you want to explore?" name="destination" error={errors.destination} hint="A city, country, or a feeling.">{(props) => <input {...props} type="text" value={preferences.destination} onChange={updatePreference} placeholder="Lisbon, Japan, somewhere sunny..." />}</FormField>
          <div className="form-row"><FormField label="How many days?" name="days" error={errors.days}>{(props) => <input {...props} type="number" min="1" max="60" value={preferences.days} onChange={updatePreference} placeholder="7" />}</FormField><SelectField label="What’s your budget?" name="budget" value={preferences.budget} options={budgetOptions} onChange={updatePreference} error={errors.budget} /></div>
          <InterestPicker value={preferences.interests} onChange={toggleInterest} error={errors.interests} />
          <SelectField label="Who’s coming along?" name="travelType" value={preferences.travelType} options={travelTypeOptions} onChange={updatePreference} error={errors.travelType} />
          <button className="button button-primary planner-submit" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Finding your route...' : 'Build my itinerary'} <span aria-hidden="true">{status === 'loading' ? '◌' : '→'}</span></button>
          {status === 'success' && <p className="form-status success" role="status">Your trip brief is ready. We’re shaping something good.</p>}
          {status === 'error' && <p className="form-status error" role="alert">We couldn’t reach the trip service. Check your connection and try again.</p>}
        </form>
      </main>
    </div>
  )
}
