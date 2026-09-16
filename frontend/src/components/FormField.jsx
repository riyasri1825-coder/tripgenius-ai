export function FormField({ label, name, error, hint, children }) {
  const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined

  return (
    <div className={`form-field${error ? ' has-error' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children({ 'aria-describedby': describedBy, 'aria-invalid': Boolean(error), id: name, name })}
      {error && <p className="field-error" id={`${name}-error`}>{error}</p>}
      {!error && hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}
    </div>
  )
}

export function SelectField({ label, name, value, options, onChange, error }) {
  return (
    <FormField label={label} name={name} error={error}>
      {(props) => (
        <select {...props} value={value} onChange={onChange}>
          <option value="">Choose an option</option>
          {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </FormField>
  )
}