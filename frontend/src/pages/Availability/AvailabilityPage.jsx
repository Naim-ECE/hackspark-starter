import React, { useState } from 'react'
import api from '../../api'

function RangeList({ title, items }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {items.length ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-xl bg-slate-900 px-3 py-2">
              {item.start} → {item.end}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-400">None</p>
      )}
    </div>
  )
}

export default function AvailabilityPage() {
  const [productId, setProductId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.get(`/rentals/products/${productId}/availability`, {
        params: { from, to },
      })
      setResult(response.data)
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to check availability for this product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Availability Checker</h1>
        <p className="mt-1 text-sm text-slate-300">Check whether a product is available between two dates.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="text-sm text-slate-300">
            Product ID
            <input className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={productId} onChange={(event) => setProductId(event.target.value)} />
          </label>
          <label className="text-sm text-slate-300">
            From
            <input type="date" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="text-sm text-slate-300">
            To
            <input type="date" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <div className="flex items-end">
            <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </form>
      </section>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}

      {loading && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Loading availability...</div>}

      {result && (
        <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-white">Product {result.productId}</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${result.available ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
              available: {String(result.available)}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RangeList title="Busy periods" items={result.busyPeriods || []} />
            <RangeList title="Free windows" items={result.freeWindows || []} />
          </div>
        </section>
      )}
    </div>
  )
}
