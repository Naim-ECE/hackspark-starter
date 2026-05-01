import React, { useEffect, useMemo, useState } from 'react'
import api from '../../api'

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/10">
      <div className="h-40 rounded-2xl bg-white/5" />
      <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
      <div className="mt-4 h-8 w-1/3 animate-pulse rounded-full bg-white/10" />
    </div>
  )
}

function ProductModal({ product, onClose }) {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{product.name}</h3>
            <p className="mt-1 text-sm text-slate-300">{product.category}</p>
          </div>
          <button className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="mt-6 rounded-2xl bg-white/5 p-4 text-slate-100">
          <div className="text-sm text-slate-400">Price per day</div>
          <div className="mt-1 text-3xl font-semibold">${product.pricePerDay}</div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)

  const fetchProducts = async (nextPage = page, nextCategory = category) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/rentals/products', {
        params: {
          category: nextCategory || '',
          page: nextPage,
          limit: 20,
        },
      })
      const data = response.data || {}
      const items = data.data || []
      setProducts(items)
      setPage(data.page || nextPage)
      setTotalPages(data.totalPages || 1)
      const derivedCategories = Array.from(new Set(items.map((item) => item.category).filter(Boolean)))
      setCategories((current) => Array.from(new Set([...current, ...derivedCategories])).sort())
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load products right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(1, '')
  }, [])

  const categoryOptions = useMemo(() => categories, [categories])

  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value
    setCategory(nextCategory)
    setPage(1)
    fetchProducts(1, nextCategory)
  }

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    fetchProducts(nextPage, category)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Products</h1>
            <p className="mt-1 text-base text-slate-300">Browse RentPi's catalog and open any card for details.</p>
          </div>
          <label className="text-sm text-slate-300">
            Category
            <select
              className="mt-2 block min-w-48 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="">All categories</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : products.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="text-lg font-semibold text-white">{product.name}</div>
                <div className="mt-1 text-sm text-slate-400">{product.category}</div>
                <div className="mt-4 inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-sm font-semibold text-cyan-200">
                  ${product.pricePerDay} / day
                </div>
              </button>
            ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
        <button
          className="rounded-lg bg-white/10 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1 || loading}
        >
          Previous
        </button>
        <div>
          Page <span className="font-semibold text-white">{page}</span> of <span className="font-semibold text-white">{totalPages}</span>
        </div>
        <button
          className="rounded-lg bg-white/10 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages || loading}
        >
          Next
        </button>
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}
