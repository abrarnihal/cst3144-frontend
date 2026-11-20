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
