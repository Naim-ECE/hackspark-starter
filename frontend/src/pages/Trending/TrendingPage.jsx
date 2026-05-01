import React, { useCallback, useEffect, useState } from 'react'
import api from '../../api'

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
      <div className="mt-6 h-8 w-20 animate-pulse rounded-full bg-white/10" />
    </div>
  )
}

export default function TrendingPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRecommendations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await api.get('/analytics/recommendations', {
        params: { date: today, limit: 6 },
      })
      setItems(response.data?.recommendations || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load trending recommendations right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">What's Trending Today</h1>
          <p className="mt-1 text-sm text-slate-300">Daily recommendations pulled from the analytics service.</p>
        </div>
        <button className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" onClick={fetchRecommendations}>
          Refresh
        </button>
      </section>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : items.map((item) => (
              <article key={item.productId} className="rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-black/20 transition hover:border-cyan-400/40">
                <div className="text-lg font-semibold text-white">{item.name}</div>
                <div className="mt-2 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  {item.category}
                </div>
                <div className="mt-6 text-sm text-slate-400">Score</div>
                <div className="text-3xl font-semibold text-white">{item.score}</div>
              </article>
            ))}
      </div>
    </div>
  )
}
