import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function PlannerPage() {
  return (
    <div className="app-shell planner-shell">
      <Navbar />
      <main className="planner-page section-wrap">
        <Link className="back-link" to="/">← Back home</Link>
        <div className="planner-intro"><p className="eyebrow"><span className="eyebrow-dot" /> Your trip, your way</p><h1>Where will you go<br /><span>next?</span></h1><p>Give us a starting point and we’ll help turn it into a trip worth remembering.</p></div>
        <form className="planner-form" onSubmit={(event) => event.preventDefault()}>
          <label>Where do you want to explore?<input type="text" placeholder="A city, country, or feeling" /></label>
          <div className="form-row"><label>When?<input type="text" placeholder="Anytime" /></label><label>Who’s coming?<input type="text" placeholder="Just me, two of us..." /></label></div>
          <button className="button button-primary" type="submit">Build my itinerary <span aria-hidden="true">→</span></button>
        </form>
      </main>
    </div>
  )
}
