export default function FeatureCard({ number, icon, title, children }) {
  return (
    <article className="feature-card">
      <div className="feature-topline"><span>{number}</span><span className="feature-icon" aria-hidden="true">{icon}</span></div>
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  )
}
