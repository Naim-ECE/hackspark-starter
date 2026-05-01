import React, { useState } from 'react'
import api from '../../api'

function getMonthDays(month) {
  const [year, monthIndex] = month.split('-').map(Number)
  const first = new Date(year, monthIndex - 1, 1)
  const days = []
  while (first.getMonth() === monthIndex - 1) {
    days.push(new Date(first))
    first.setDate(first.getDate() + 1)
  }
  return days
}

export default function SurgePage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/analytics/surge-days', { params: { month } })
      setData(response.data?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load surge calendar.')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const lookup = new Map(data.map((item) => [item.date, item]))
  const days = getMonthDays(month)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Surge Calendar</h1>
        <p className="mt-1 text-sm text-slate-300">Pick a month to inspect daily rental activity.</p>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="text-sm text-slate-300">
            Month
            <input type="month" className="mt-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          <button className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Load month</button>
        </form>
      </section>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}
      {loading && <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">Loading surge data...</div>}

      {!loading && data.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map((day) => {
            const iso = day.toISOString().slice(0, 10)
            const item = lookup.get(iso)
            const highlighted = Boolean(item?.nextSurgeDate)
            return (
              <article
                key={iso}
                className={`rounded-2xl border p-4 ${highlighted ? 'border-cyan-400/40 bg-cyan-400/10' : 'border-white/10 bg-white/5'}`}
              >
                <div className="text-sm font-semibold text-white">{iso}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{item?.count ?? 0}</div>
                <div className="mt-2 text-xs text-slate-400">{highlighted ? `Next surge: ${item.nextSurgeDate}` : 'No next surge day'}</div>
              </article>
            )
          })}
        </section>
      )}
    </div>
  )
}
