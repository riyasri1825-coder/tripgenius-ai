import { Link, NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="Main navigation">
        <Link className="brand" to="/" aria-label="TripGenius AI home">
          <span className="brand-mark">✦</span>
          <span>TripGenius <em>AI</em></span>
        </Link>
        <div className="nav-links">
          <NavLink to="/#features">How it works</NavLink>
          <NavLink to="/planner" className="nav-cta">Open planner <span aria-hidden="true">↗</span></NavLink>
        </div>
      </nav>
    </header>
  )
}
