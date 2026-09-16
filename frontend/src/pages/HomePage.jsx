import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import FeatureCard from '../components/FeatureCard'

export default function HomePage() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <section className="hero section-wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> Your next story starts here</p>
            <h1>Travel plans with a little <span>more you.</span></h1>
            <p className="hero-intro">TripGenius AI turns your wish list, pace, and curiosities into an itinerary that feels like it was made by a friend who knows you well.</p>
            <div className="hero-actions">
              <Link className="button button-primary" to="/planner">Plan a trip <span aria-hidden="true">→</span></Link>
              <a className="text-link" href="#features">See how it works <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span></div><span><strong>4.9/5</strong> from curious travelers</span></div>
          </div>
          <div className="hero-visual" aria-label="A sunny coastal travel destination">
            <div className="sun" />
            <div className="visual-label"><span className="pulse" /> Inspired by you<br /><strong>Amalfi Coast, Italy</strong></div>
            <div className="coastline" />
            <div className="travel-stamp">TRAVEL<br /><strong>LIGHTLY</strong><br />✦</div>
          </div>
        </section>

        <section className="marquee" aria-label="TripGenius highlights"><span>CURIOUS MINDS</span><i>✦</i><span>OPEN ROADS</span><i>✦</i><span>GOOD STORIES</span><i>✦</i><span>CURIOUS MINDS</span></section>

        <section className="features section-wrap" id="features">
          <div className="section-heading"><div><p className="eyebrow">The TripGenius approach</p><h2>Less searching.<br /><em>More wandering.</em></h2></div><p>All the spark of a spontaneous adventure, with just enough structure to make it happen.</p></div>
          <div className="feature-grid">
            <FeatureCard number="01" icon="⌁" title="Start with a feeling">Tell us the mood, not just the destination. Slow mornings, hidden food spots, a little outside your comfort zone.</FeatureCard>
            <FeatureCard number="02" icon="✧" title="Meet your match">Our AI connects the dots between what you love and the places that will make you feel most alive.</FeatureCard>
            <FeatureCard number="03" icon="↗" title="Make it yours">Shape the rhythm, swap the stops, and take your plan from a beautiful idea to a trip you can book.</FeatureCard>
          </div>
        </section>

        <section className="cta section-wrap"><div><p className="eyebrow">No more blank itinerary pages</p><h2>Your best trip<br /><em>is still unwritten.</em></h2></div><Link className="button button-light" to="/planner">Start planning <span aria-hidden="true">↗</span></Link></section>
      </main>
      <footer className="site-footer section-wrap"><span>© 2026 TripGenius AI</span><span>Made for the wonderfully curious.</span></footer>
    </div>
  )
}
