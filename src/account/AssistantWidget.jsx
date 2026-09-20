import { lazy, Suspense, useRef, useState } from 'react'
import { PiChatCircleDotsBold, PiXBold } from 'react-icons/pi'
import { useAccount } from './context.js'
import { initialLanguage, accountCopy } from './copy.js'
import './account.css'
const AssistantPanel = lazy(() => import('./AssistantPanel.jsx'))

export default function AssistantWidget() {
  const { assistant } = useAccount()
  const dialog = useRef(null)
  const [opened, setOpened] = useState(false)
  const language = initialLanguage()
  const t = accountCopy[language]
  if (!assistant || window.location.pathname.startsWith('/account')) return null
  return <>
    <button type="button" className="assistant-launcher" data-companion-obstacle title={t.ask} aria-label={t.ask} onClick={() => { setOpened(true); dialog.current.showModal() }}><PiChatCircleDotsBold aria-hidden="true" /></button>
    <dialog className="assistant-dialog" ref={dialog} aria-label={t.assistant} onClick={(e) => { if (e.target === dialog.current) dialog.current.close() }}>
      <header><h2>DaniVex Assistant</h2><button className="account-icon" title={t.close} aria-label={t.close} onClick={() => dialog.current.close()}><PiXBold /></button></header>
      {opened && <Suspense fallback={<p>{t.loading}</p>}><AssistantPanel language={language} /></Suspense>}
    </dialog>
  </>
}
