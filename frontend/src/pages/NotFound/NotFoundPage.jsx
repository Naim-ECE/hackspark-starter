import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
        <div className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200">404</div>
        <h1 className="mt-4 text-4xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The page you tried to open does not exist. Use the navigation to return to the dashboard.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
            Go home
          </Link>
          <Link to="/products" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white">
            Products
          </Link>
        </div>
      </div>
    </div>
  )
}
