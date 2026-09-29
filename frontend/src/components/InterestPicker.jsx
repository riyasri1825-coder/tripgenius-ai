const INTERESTS = ['Food & drink', 'Nature', 'Culture', 'Beach time', 'Adventure', 'Local life']

export default function InterestPicker({ value, onChange, error }) {
  return (
    <fieldset className={`interest-field${error ? ' has-error' : ''}`}>
      <legend>What are you into?</legend>
      <p className="field-hint">Pick at least one. We’ll use these to shape your days.</p>
      <div className="interest-options">
        {INTERESTS.map((interest) => {
          const selected = value.includes(interest)
          return <label className={`interest-option${selected ? ' selected' : ''}`} key={interest}><input type="checkbox" checked={selected} onChange={() => onChange(interest)} /><span>{interest}</span></label>
        })}
      </div>
      {error && <p className="field-error" id="interests-error">{error}</p>}
    </fieldset>
  )
}