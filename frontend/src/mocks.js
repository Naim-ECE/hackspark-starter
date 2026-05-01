// Simple in-memory mock handlers for frontend development
// Toggle with VITE_MOCK_API=true

function wait(ms = 200) {
  return new Promise((res) => setTimeout(res, ms))
}

function makeToken(email = 'test@example.com') {
  // naive mock JWT-like string (not a real JWT)
  return `mock.${btoa(email)}.token`
}

export async function mockRequest(method, url, config = {}) {
  await wait(150)
  const path = url.split('?')[0]

  // Auth
  if (method === 'post' && path.includes('/users/login')) {
    const body = config.data || {}
    const email = body.email || 'user@example.com'
    return Promise.resolve({ data: { token: makeToken(email), user: { id: '1', email } } })
  }
  if (method === 'post' && path.includes('/users/register')) {
    const body = config.data || {}
    const email = body.email || 'new@example.com'
    return Promise.resolve({ data: { token: makeToken(email), user: { id: '2', email } } })
  }

  // Products
  if (method === 'get' && path.includes('/rentals/products')) {
    const sample = Array.from({ length: 6 }).map((_, i) => ({
      id: `${i + 1}`,
      title: `Sample Product ${i + 1}`,
      price: (10 + i) * 5,
      category: ['Tools', 'Electronics', 'Outdoor'][i % 3],
      image: null,
      description: `Description for product ${i + 1}`,
    }))
    return Promise.resolve({ data: { items: sample, total: sample.length } })
  }

  // Availability
  if (method === 'get' && path.match(/\/rentals\/products\/\d+\/availability/)) {
    return Promise.resolve({ data: { available: true, busyPeriods: [], freeWindows: [] } })
  }

  // Trending / recommendations
  if (method === 'get' && path.includes('/analytics/recommendations')) {
    const recs = Array.from({ length: 6 }).map((_, i) => ({ id: `r${i + 1}`, title: `Recommended ${i + 1}` }))
    return Promise.resolve({ data: { items: recs } })
  }

  // Profile / discount
  if (method === 'get' && path.match(/\/users\/\d+\/discount/)) {
    return Promise.resolve({ data: { discountPercent: 10, securityScore: 85 } })
  }

  // Top categories
  if (method === 'get' && path.includes('/rentals/users/') && path.includes('/top-categories')) {
    return Promise.resolve({ data: { categories: ['Tools', 'Cameras', 'Drones'] } })
  }

  // Surge days
  if (method === 'get' && path.includes('/analytics/surge-days')) {
    return Promise.resolve({ data: { surgeDays: [5, 12, 19] } })
  }

  // Chat
  if (method === 'get' && path.includes('/chat/sessions')) {
    return Promise.resolve({ data: { sessions: [{ id: 's1', title: 'Demo chat' }] } })
  }
  if (method === 'get' && path.match(/\/chat\/[^/]+\/history/)) {
    return Promise.resolve({ data: { messages: [{ role: 'assistant', text: 'Hello — this is a mock reply.' }] } })
  }
  if (method === 'post' && path.includes('/chat')) {
    const body = config.data || {}
    return Promise.resolve({ data: { reply: { role: 'assistant', text: `Echo: ${body.message || 'hi'}` } } })
  }

  // Default fallback: return 501-like structure but as resolved response
  return Promise.resolve({ data: { error: 'not_implemented', message: 'This mock route is not implemented yet' }, status: 501 })
}

export default null
