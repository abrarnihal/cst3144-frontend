const apiBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const isApiConfigured = Boolean(apiBaseUrl)

async function requestJson(path, options = {}) {
  if (!apiBaseUrl) {
    throw new Error('The lesson service is not connected. Set VITE_API_URL when the Express API is ready.')
  }

  const response = await fetch(apiBaseUrl + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const responseBody = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(responseBody.message || 'The server could not complete that request.')
  }

  return responseBody
}

export function fetchLessons() {
  return requestJson('/lessons')
}

export function searchLessons(filters = {}) {
  const params = new URLSearchParams()

  if (filters.q) params.set('q', filters.q)
  if (filters.minPrice !== undefined && filters.minPrice !== '') params.set('minPrice', filters.minPrice)
  if (filters.maxPrice !== undefined && filters.maxPrice !== '') params.set('maxPrice', filters.maxPrice)
  if (filters.availableOnly) params.set('available', 'true')

  return requestJson('/lessons/search?' + params.toString())
}

export function fetchTeachers() {
  return requestJson('/teachers')
}

export function fetchTeacherLessons(teacherId) {
  return requestJson('/teachers/' + encodeURIComponent(teacherId) + '/lessons')
}

export function createOrder(order) {
  return requestJson('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

export function updateLessonSpaces(lessonId, spaces) {
  return requestJson('/lessons/' + encodeURIComponent(lessonId), {
    method: 'PUT',
    body: JSON.stringify({ spaces }),
  })
}

export function resolveApiImage(imagePath) {
  if (!imagePath) return ''
  if (/^(https?:|data:)/i.test(imagePath)) return imagePath

  return apiBaseUrl + (imagePath.startsWith('/') ? imagePath : '/' + imagePath)
}

