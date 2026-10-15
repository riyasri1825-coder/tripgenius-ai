const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function generateTrip(preferences) {
  if (!API_BASE_URL) {
    throw new Error('The trip service is not configured. Set VITE_API_BASE_URL and try again.')
  }

  const response = await fetch(`${API_BASE_URL}/api/trips/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  })
  const result = await response.json()
  if (!response.ok) {
    throw new Error(result?.error?.message || 'We could not create your itinerary right now.')
  }
  return result
}