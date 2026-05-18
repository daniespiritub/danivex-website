import { FaSearch } from 'react-icons/fa'
import { normalizeUid } from '../../data/primeScanner'

function UIDSearchForm({
  uid,
  isLoading,
  onSubmit,
  onUidChange,
}) {
  return (
    <form className="scanner-form" onSubmit={onSubmit}>
      <label className="scanner-field">
        <span>UID / Player ID</span>
        <input
          inputMode="numeric"
          minLength="5"
          placeholder="Ej: 123456789"
          required
          type="text"
          value={uid}
          onChange={(event) => onUidChange(normalizeUid(event.target.value))}
        />
      </label>

      <button className="scanner-submit" disabled={isLoading} type="submit">
        <FaSearch aria-hidden="true" />
        <span>{isLoading ? 'Analizando...' : 'Analizar Cuenta'}</span>
      </button>
    </form>
  )
}

export default UIDSearchForm
