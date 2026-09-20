import { PiUserCircleBold } from 'react-icons/pi'
import { useAccount } from './context.js'

export default function AccountLink({ language = 'es' }) {
  const { account, user } = useAccount()
  if (!account) return null
  const label = user?.handle ? `@${user.handle}` : ({ es: 'Acceder', en: 'Sign in', pt: 'Entrar', it: 'Accedi' }[language] || 'Acceder')
  return <a className="account-nav-link" href={user ? '/account' : '/signin'} aria-label={label} title={label}><PiUserCircleBold aria-hidden="true" /><span>{label}</span></a>
}
