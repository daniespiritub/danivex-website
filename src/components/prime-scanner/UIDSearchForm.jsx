import { FaSearch } from 'react-icons/fa'
import { normalizeUid, scannerRegions } from '../../data/primeScanner'

function UIDSearchForm({
  accountName,
  uid,
  region,
  isLoading,
  onAccountNameChange,
  onRegionChange,
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

      <label className="scanner-field">
        <span>Nombre exacto de la cuenta</span>
        <input
          autoComplete="off"
          maxLength="32"
          placeholder="Ej: DaniVex Prime"
          type="text"
          value={accountName}
          onChange={(event) => onAccountNameChange(event.target.value)}
        />
      </label>

      <label className="scanner-field">
        <span>Region</span>
        <select value={region} onChange={(event) => onRegionChange(event.target.value)}>
          {scannerRegions.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </label>

      <button className="scanner-submit" disabled={isLoading} type="submit">
        <FaSearch aria-hidden="true" />
        <span>{isLoading ? 'Analizando...' : 'Analizar Cuenta'}</span>
      </button>
    </form>
  )
}

export default UIDSearchForm
