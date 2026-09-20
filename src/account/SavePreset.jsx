import { useState } from 'react'
import { PiBookmarkSimpleBold } from 'react-icons/pi'
import { useAccount } from './context.js'
import { request } from './api.js'

export default function SavePreset({ language, device, profile, values }) {
  const { account, user } = useAccount()
  const [status, setStatus] = useState('')
  if (!account) return null
  const labels = { es: ['Guardar configuración', 'Guardado', 'No se pudo guardar'], en: ['Save setup', 'Saved', 'Could not save'], pt: ['Salvar configuração', 'Salvo', 'Não foi possível salvar'] }[language]
  async function save() {
    if (!user?.handle) { window.location.assign(user ? '/account' : '/signin'); return }
    setStatus('busy')
    try {
      await request('account', 'save', { kind: 'sensitivity', title: `${device.brand} ${device.name}`.slice(0, 100), payload: { device: { brand: device.brand, model: device.name, os: device.os }, profile, values } })
      setStatus('done')
    } catch { setStatus('error') }
  }
  return <div className="preset-save"><button className="copy-btn" type="button" disabled={status === 'busy'} onClick={save}><PiBookmarkSimpleBold aria-hidden="true" />{labels[0]}</button><span role="status">{status === 'done' ? labels[1] : status === 'error' ? labels[2] : ''}</span></div>
}
