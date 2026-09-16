import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import PlannerPage from './pages/PlannerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
