import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'

function getFriendlyAuthError(err) {
  if (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK') {
    return 'Cannot reach the RentPi gateway at http://localhost:8000. Make sure docker-compose is running.'
  }
  return err?.response?.data?.message || err?.message || 'Login failed. Please try again.'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await api.post('/users/login', { email, password })
      const token = res.data?.token || res.data
      localStorage.setItem('token', token)
      navigate('/products')
    } catch (err) {
      setError(getFriendlyAuthError(err))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,#020617_0%,#111827_100%)] px-4 py-10 text-slate-100">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className="hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              RentPi
            </div>
            <h1 className="mt-6 max-w-lg text-5xl font-semibold leading-tight text-white">
              Sign in to your rental operations dashboard.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              Track products, chat with the assistant, and inspect market demand from one clean workspace.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {['Live inventory', 'Availability checks', 'Grounded chat'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          <h2 className="mb-2 text-3xl font-semibold text-white">Welcome back</h2>
          <p className="mb-6 text-sm text-slate-300">Sign in to RentPi using your team account.</p>
          {error && <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">
          Email
              <input className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            </label>
            <label className="block text-sm font-medium text-slate-200">
          Password
              <input type="password" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500 focus:border-cyan-400" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            </label>
            <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Login</button>
          </form>
        </div>
      </div>
    </div>
  )
}
