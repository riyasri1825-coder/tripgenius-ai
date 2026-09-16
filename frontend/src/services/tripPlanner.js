const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function generateTrip(preferences) {
  if (!API_BASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 900))
    return { demo: true, preferences }
  }

  const response = await fetch(`${API_BASE_URL}/api/trips/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  })
  if (!response.ok) throw new Error('We could not create your itinerary right now.')
  return response.json()
}