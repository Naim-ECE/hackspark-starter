import React from 'react'
import TrendingPage from '../Trending/TrendingPage'

const highlights = [
  { label: 'Live inventory', value: '500k+ items' },
  { label: 'Rental intelligence', value: 'Daily trend signals' },
  { label: 'Trust scoring', value: 'Discounts by security score' },
]

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
              RentPi Control Center
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
                Welcome back. Your rental marketplace is live and ready.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                Monitor product demand, inspect availability, and chat with a grounded assistant from a single dashboard.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400">{item.label}</div>
                  <div className="mt-2 text-sm font-semibold text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/70 p-5 shadow-lg shadow-cyan-500/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
                <div className="mt-1 text-xl font-semibold text-white">Trending recommendations</div>
              </div>
              <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">Live</div>
            </div>
            <div className="mt-5">
              <TrendingPage />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Products', 'Browse the catalog with filters and pagination.'],
          ['Availability', 'Check date ranges and busy windows in seconds.'],
          ['Chat', 'Ask grounded questions with saved sessions.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold text-white">{title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
