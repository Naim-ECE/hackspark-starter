import React, { useState } from 'react'
import api from '../../api'

export default function ProfilePage() {
  const [userId, setUserId] = useState('')
  const [discount, setDiscount] = useState(null)
  const [topCategories, setTopCategories] = useState([])
  const [loadingDiscount, setLoadingDiscount] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [discountError, setDiscountError] = useState(null)
  const [categoriesError, setCategoriesError] = useState(null)

  const loadProfile = async (event) => {
    event.preventDefault()
    setLoadingDiscount(true)
    setLoadingCategories(true)
    setDiscountError(null)
    setCategoriesError(null)

    try {
      const [discountResponse, categoriesResponse] = await Promise.all([
        api.get(`/users/${userId}/discount`),
        api.get(`/rentals/users/${userId}/top-categories`, { params: { k: 5 } }),
      ])
      setDiscount(discountResponse.data)
      setTopCategories(categoriesResponse.data?.topCategories || [])
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to load profile data.'
      setDiscountError(message)
      setCategoriesError(message)
    } finally {
      setLoadingDiscount(false)
      setLoadingCategories(false)
    }
  }

  const securityScore = discount?.securityScore ?? 0
  const discountPercent = discount?.discountPercent ?? 0

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h1 className="text-3xl font-semibold text-white">Profile Insights</h1>
        <p className="mt-1 text-sm text-slate-300">Load a user ID to see their discount tier and favorite categories.</p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={loadProfile}>
          <input className="flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white" placeholder="Enter user ID" value={userId} onChange={(event) => setUserId(event.target.value)} />
          <button className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950">Load profile</button>
        </form>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Discount tier</h2>
          {loadingDiscount && <div className="mt-4 text-sm text-slate-400">Loading discount...</div>}
          {discountError && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{discountError}</div>}
          {discount && !loadingDiscount && !discountError && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Security score</span>
                <span className="font-semibold text-white">{securityScore}</span>
              </div>
              <div className="h-3 rounded-full bg-white/10">
                <div className="h-3 rounded-full bg-cyan-400" style={{ width: `${Math.min(securityScore, 100)}%` }} />
              </div>
              <div className="rounded-2xl bg-slate-900 p-4">
                <div className="text-sm text-slate-400">Discount percentage</div>
                <div className="text-4xl font-semibold text-white">{discountPercent}%</div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Top categories</h2>
          {loadingCategories && <div className="mt-4 text-sm text-slate-400">Loading categories...</div>}
          {categoriesError && <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{categoriesError}</div>}
          {!loadingCategories && !categoriesError && (
            <ol className="mt-4 space-y-3">
              {topCategories.map((item, index) => (
                <li key={item.category} className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-200">
                  <span className="font-semibold text-white">
                    {index + 1}. {item.category}
                  </span>
                  <span>{item.rentalCount} rentals</span>
                </li>
              ))}
              {topCategories.length === 0 && <li className="text-sm text-slate-400">No category data yet.</li>}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}
