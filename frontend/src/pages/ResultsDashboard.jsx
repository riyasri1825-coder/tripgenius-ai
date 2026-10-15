import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './results-dashboard.css'

const budgetCategories = [
  { label: 'Stay', share: 40 },
  { label: 'Food', share: 25 },
  { label: 'Experiences', share: 20 },
  { label: 'Getting around', share: 10 },
  { label: 'Flex fund', share: 5 },
]

const packingBasics = [
  { id: 'documents', label: 'Travel documents and bookings' },
  { id: 'medication', label: 'Personal medication and a small first-aid kit' },
  { id: 'charger', label: 'Phone charger and travel adapter' },
  { id: 'shoes', label: 'Comfortable shoes for exploring' },
  { id: 'bottle', label: 'Reusable water bottle and day bag' },
]

const weatherDescriptions = {
  0: ['Clear skies', '☀'],
  1: ['Mostly clear', '🌤'],
  2: ['Partly cloudy', '⛅'],
  3: ['Overcast', '☁'],
  45: ['Foggy', '🌫'],
  48: ['Foggy', '🌫'],
  51: ['Light drizzle', '🌦'],
  53: ['Drizzle', '🌦'],
  55: ['Heavy drizzle', '🌧'],
  56: ['Freezing drizzle', '🌧'],
  57: ['Heavy freezing drizzle', '🌧'],
  61: ['Light rain', '🌦'],
  63: ['Rain', '🌧'],
  65: ['Heavy rain', '🌧'],
  66: ['Freezing rain', '🌧'],
  67: ['Heavy freezing rain', '🌧'],
  77: ['Snow grains', '🌨'],
  71: ['Light snow', '🌨'],
  73: ['Snow', '🌨'],
  75: ['Heavy snow', '❄'],
  85: ['Snow showers', '🌨'],
  86: ['Heavy snow showers', '❄'],
  80: ['Rain showers', '🌦'],
  81: ['Rain showers', '🌧'],
  82: ['Heavy showers', '🌧'],
  95: ['Thunderstorms', '⛈'],
  96: ['Thunderstorms', '⛈'],
  99: ['Thunderstorms', '⛈'],
}

function getWeatherDescription(code) {
  return weatherDescriptions[code] || ['Conditions unavailable', '◌']
}

function WeatherCard({ destination, onWeatherCode }) {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()
    const loadWeather = async () => {
      setStatus('loading')
      try {
        const geocodeUrl = new URL('https://geocoding-api.open-meteo.com/v1/search')
        geocodeUrl.search = new URLSearchParams({
          name: destination,
          count: '1',
          language: 'en',
          format: 'json',
        })
        const geocodeResponse = await fetch(geocodeUrl, { signal: controller.signal })
        if (!geocodeResponse.ok) throw new Error('Could not look up the destination.')
        const geocode = await geocodeResponse.json()
        const place = geocode.results?.[0]
        if (!place) throw new Error('No weather location matched this destination.')

        const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast')
        forecastUrl.search = new URLSearchParams({
          latitude: String(place.latitude),
          longitude: String(place.longitude),
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
          timezone: 'auto',
        })
        const forecastResponse = await fetch(forecastUrl, { signal: controller.signal })
        if (!forecastResponse.ok) throw new Error('Could not load current weather.')
        const forecast = await forecastResponse.json()
        if (!forecast.current || !forecast.current_units) {
          throw new Error('Current weather data was incomplete.')
        }
        setWeather({ ...forecast.current, unit: forecast.current_units, place })
        onWeatherCode(forecast.current.weather_code)
        setStatus('ready')
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('error')
      }
    }

    loadWeather()
    return () => controller.abort()
  }, [destination, onWeatherCode])

  const current = weather?.weather_code !== undefined
    ? getWeatherDescription(weather.weather_code)
    : null

  return (
    <section className="dashboard-card weather-card" aria-labelledby="weather-heading">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Outside right now</p>
          <h2 id="weather-heading">Weather snapshot</h2>
        </div>
        <span className="card-icon" aria-hidden="true">{current?.[1] || '☼'}</span>
      </div>
      {status === 'loading' && (
        <p className="dashboard-state" role="status">Checking current conditions…</p>
      )}
      {status === 'error' && (
        <p className="dashboard-state" role="status">Weather is unavailable right now. Your itinerary is still ready.</p>
      )}
      {status === 'ready' && weather && (
        <>
          <p className="weather-place">{weather.place.name}{weather.place.country ? `, ${weather.place.country}` : ''}</p>
          <div className="weather-reading">
            <strong>{Math.round(weather.temperature_2m)}{weather.unit.temperature_2m}</strong>
            <span>{current[0]}<small>Feels like {Math.round(weather.apparent_temperature)}{weather.unit.apparent_temperature}</small></span>
          </div>
          <div className="weather-details">
            <span>Humidity <strong>{weather.relative_humidity_2m}%</strong></span>
            <span>Wind <strong>{Math.round(weather.wind_speed_10m)} {weather.unit.wind_speed_10m}</strong></span>
          </div>
        </>
      )}
      <p className="weather-note">Current local conditions, not a forecast for your travel dates.</p>
    </section>
  )
}

function ItineraryCard({ day }) {
  const periods = [
    ['Morning', day.morning],
    ['Afternoon', day.afternoon],
    ['Evening', day.evening],
  ]

  return (
    <article className="itinerary-card">
      <div className="day-marker"><span>DAY</span><strong>{String(day.day).padStart(2, '0')}</strong></div>
      <div className="day-content">
        <div className="day-heading">
          <h3>{day.theme}</h3>
          <span>{day.activities.length} moments</span>
        </div>
        <div className="activity-list">
          {periods.map(([period, activity]) => activity && (
            <div className="activity-row" key={period}>
              <span className="activity-period">{period}</span>
              <div>
                <h4>{activity.name}</h4>
                <p>{activity.description}</p>
                <span className="activity-place">{activity.suggested_place}</span>
              </div>
              <span className={`cost-tag cost-${activity.cost_level}`}>{activity.cost_level}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

function AttractionsCard({ activities }) {
  const places = useMemo(() => {
    const seen = new Set()
    return activities.filter(({ activity }) => {
      const place = activity.suggested_place.trim().toLowerCase()
      if (!place || seen.has(place)) return false
      seen.add(place)
      return true
    })
  }, [activities])

  return (
    <section className="dashboard-card attractions-section" aria-labelledby="attractions-heading">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">Places to explore</p>
          <h2 id="attractions-heading">Your trip highlights</h2>
        </div>
        <span className="section-count">{String(places.length).padStart(2, '0')} STOPS</span>
      </div>
      {places.length ? (
        <div className="attractions-grid">
          {places.map(({ activity, day }, index) => (
            <article className="attraction-card" key={`${activity.suggested_place}-${index}`}>
              <span className="attraction-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{activity.suggested_place}</h3>
                <p>{activity.name} · Day {day}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      ) : (
        <p className="dashboard-state">No suggested places were included in this itinerary.</p>
      )}
    </section>
  )
}

function BudgetCard({ budget }) {
  const numericBudget = Number.isFinite(Number(budget)) && Number(budget) > 0
    ? Number(budget)
    : null

  return (
    <section className="dashboard-card budget-card" aria-labelledby="budget-heading">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">A little room to roam</p>
          <h2 id="budget-heading">Budget guide</h2>
        </div>
        <span className="budget-total">{numericBudget ? numericBudget.toLocaleString() : budget}</span>
      </div>
      <p className="budget-caption">
        {numericBudget ? 'Estimated allocation in your budget units' : 'Suggested share of your selected budget tier'}
      </p>
      <div className="budget-breakdown">
        {budgetCategories.map(({ label, share }) => (
          <div className="budget-row" key={label}>
            <div className="budget-label"><span>{label}</span><strong>{share}%</strong></div>
            <div className="budget-track" aria-label={`${label}: ${share}%`}>
              <span style={{ width: `${share}%` }} />
            </div>
            {numericBudget && <small>{Math.round(numericBudget * share / 100).toLocaleString()} units</small>}
          </div>
        ))}
      </div>
      <p className="budget-note">Planning estimate only. Local prices can vary; keep a little flexibility for the unexpected.</p>
    </section>
  )
}

function PackingCard({ days, weatherCode }) {
  const [checked, setChecked] = useState([])
  const rainy = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(weatherCode)
  const cold = [71, 73, 75].includes(weatherCode)
  const warm = [0, 1, 2, 3].includes(weatherCode)
  const weatherItem = rainy
    ? { id: 'weather', label: 'Light rain jacket or compact umbrella' }
    : cold
      ? { id: 'weather', label: 'Warm layers and weather-ready outerwear' }
      : warm
        ? { id: 'weather', label: 'Sun protection and breathable layers' }
        : { id: 'weather', label: 'A light layer for changing conditions' }
  const items = [
    ...packingBasics,
    weatherItem,
    { id: 'clothes', label: `Clothing for ${Math.min(days, 7)} ${Math.min(days, 7) === 1 ? 'day' : 'days'}${days > 7 ? ' (plus laundry plan)' : ''}` },
  ]

  const toggleItem = (id) => {
    setChecked((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id])
  }

  return (
    <section className="dashboard-card packing-card" aria-labelledby="packing-heading">
      <div className="dashboard-card-heading">
        <div>
          <p className="eyebrow">The little things</p>
          <h2 id="packing-heading">Packing checklist</h2>
        </div>
        <span className="section-count">{checked.length}/{items.length} READY</span>
      </div>
      <ul className="packing-list">
        {items.map((item) => (
          <li key={item.id}>
            <label className={checked.includes(item.id) ? 'packing-checked' : ''}>
              <input
                type="checkbox"
                checked={checked.includes(item.id)}
                onChange={() => toggleItem(item.id)}
              />
              <span className="packing-checkbox" aria-hidden="true">✓</span>
              {item.label}
            </label>
          </li>
        ))}
      </ul>
      <p className="packing-note">Weather-based suggestion uses current conditions and may change before your trip.</p>
    </section>
  )
}

export default function ResultsDashboard() {
  const { state } = useLocation()
  const trip = state?.trip
  const [weatherCode, setWeatherCode] = useState(null)

  const activities = useMemo(() => (trip?.itinerary?.days || []).flatMap((day) => (
    ['morning', 'afternoon', 'evening']
      .filter((period) => day[period])
      .map((period) => ({ activity: day[period], day: day.day, period }))
  )), [trip])

  if (!trip?.itinerary?.days?.length) {
    return (
      <div className="app-shell planner-shell">
        <Navbar />
        <main className="dashboard-empty section-wrap">
          <section className="dashboard-card empty-state">
            <p className="eyebrow">Your travel plan</p>
            <h1>We couldn’t find<br /><span>your itinerary.</span></h1>
            <p>Start a new plan to generate your trip dashboard. Your itinerary is shared with this page while you’re in this session.</p>
            <Link className="button button-primary" to="/planner">Build my itinerary <span aria-hidden="true">→</span></Link>
          </section>
        </main>
      </div>
    )
  }

  const dayCount = trip.itinerary.days.length

  return (
    <div className="app-shell dashboard-shell">
      <Navbar />
      <main className="dashboard-page section-wrap">
        <div className="dashboard-topline">
          <Link className="back-link" to="/planner">← Plan another trip</Link>
          <span className="generated-label"><span className="eyebrow-dot" /> YOUR AI-CRAFTED TRIP</span>
        </div>
        <header className="dashboard-hero">
          <div>
            <p className="eyebrow">The good part starts here</p>
            <h1>{trip.destination}<span className="destination-period">.</span></h1>
            <p className="dashboard-subtitle">{dayCount} {dayCount === 1 ? 'day' : 'days'} · {trip.travel_type} travel · {trip.interests?.join(' / ')}</p>
          </div>
          <div className="trip-stamp"><span>MADE FOR</span><strong>{trip.travel_type}</strong><span>✦ YOUR WAY</span></div>
        </header>

        <section className="dashboard-summary" aria-label="Trip overview">
          <div><span>DESTINATION</span><strong>{trip.destination}</strong></div>
          <div><span>TRIP LENGTH</span><strong>{dayCount} days</strong></div>
          <div><span>TRAVEL STYLE</span><strong>{trip.travel_type}</strong></div>
          <div><span>BUDGET STYLE</span><strong>{trip.budget}</strong></div>
        </section>

        <div className="dashboard-layout">
          <section className="itinerary-section" aria-labelledby="itinerary-heading">
            <div className="dashboard-section-heading">
              <div><p className="eyebrow">A day at a time</p><h2 id="itinerary-heading">Your itinerary</h2></div>
              <span>{dayCount} DAYS</span>
            </div>
            <div className="itinerary-list">
              {trip.itinerary.days.map((day) => {
                const dayActivities = ['morning', 'afternoon', 'evening'].filter((period) => day[period])
                return <ItineraryCard key={day.day} day={{ ...day, activities: dayActivities }} />
              })}
            </div>
            <p className="itinerary-budget-note">{trip.itinerary.budget_note}</p>
          </section>
          <aside className="dashboard-sidebar" aria-label="Trip details">
            <WeatherCard destination={trip.destination} onWeatherCode={setWeatherCode} />
            <BudgetCard budget={trip.budget} />
          </aside>
        </div>

        <div className="dashboard-lower-grid">
          <AttractionsCard activities={activities} />
          <PackingCard days={dayCount} weatherCode={weatherCode} />
        </div>
        <p className="dashboard-disclaimer">Your itinerary is AI-generated. Confirm opening hours, transport and local guidance before you go.</p>
      </main>
    </div>
  )
}
