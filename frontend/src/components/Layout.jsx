import React, { useMemo } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  { to: '/products', label: 'Products' },
  { to: '/availability', label: 'Availability' },
  { to: '/chat', label: 'Chat' },
  { to: '/trending', label: 'Trending' },
  { to: '/profile', label: 'Profile' },
  { to: '/surge', label: 'Surge' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const email = useMemo(() => {
    if (!token) return ''
    try {
      const payload = token.split('.')[1]
      if (!payload) return ''
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
      const json = JSON.parse(atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')))
      return json.email || json.user?.email || json.sub || ''
    } catch {
      return ''
    }
  }, [token])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="text-lg font-semibold tracking-wide text-white">
              RentPi
            </Link>
            <div className="lg:hidden">
              <NavLink className={({ isActive }) => `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-white text-slate-950' : 'bg-white/5 hover:bg-white/10'}`} to="/products">
                Dashboard
              </NavLink>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
            <NavLink className={({ isActive }) => `rounded-full px-3 py-1 ${isActive ? 'bg-white text-slate-950' : 'bg-white/5 hover:bg-white/10'}`} to="/">
              Home
            </NavLink>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `rounded-full px-3 py-1 ${isActive ? 'bg-white text-slate-950' : 'bg-white/5 hover:bg-white/10'}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {token ? (
              <>
                <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 md:block">
                  {email ? <span className="font-medium text-white">{email}</span> : 'Signed in'}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="hidden items-center gap-2 md:flex">
                <NavLink className={({ isActive }) => `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-white text-slate-950' : 'bg-white/5 hover:bg-white/10'}`} to="/login">
                  Login
                </NavLink>
                <NavLink className={({ isActive }) => `rounded-full px-3 py-1 text-sm ${isActive ? 'bg-white text-slate-950' : 'bg-white/5 hover:bg-white/10'}`} to="/register">
                  Register
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-10">{children}</main>
    </div>
  )
}
