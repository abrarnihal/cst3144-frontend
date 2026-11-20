<script setup>
import { computed, onMounted, ref } from 'vue'
import CatalogControls from './components/CatalogControls.vue'
import LessonCard from './components/LessonCard.vue'
import { createOrder, fetchLessons, isApiConfigured, resolveApiImage, updateLessonSpaces } from './services/api.js'

const searchTerm = ref('')
const sortOption = ref('subject-asc')
const cart = ref([])
const showCart = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const checkoutError = ref('')
const checkoutSuccess = ref('')
const catalogNotice = ref('')
const isSubmitting = ref(false)

// Preview records keep the catalogue useful while the coursework API is being built.
const lessons = ref([
  { id: 1, title: 'Creative Clay Club', subject: 'Art & Making', location: 'The Little Studio', price: 14, spaces: 5, icon: '🎨', tone: 'coral', label: 'MAKE & PLAY', time: 'Tue · 3:30 pm' },
  { id: 2, title: 'Junior Gardeners', subject: 'Nature & Science', location: 'Community Garden', price: 11, spaces: 5, icon: '🌱', tone: 'mint', label: 'GET GROWING', time: 'Mon · 3:45 pm' },
  { id: 3, title: 'Code & Create', subject: 'Technology', location: 'Makers Lab', price: 16, spaces: 5, icon: '💻', tone: 'blue', label: 'THINK & BUILD', time: 'Wed · 4:00 pm' },
  { id: 4, title: 'Mini Chefs', subject: 'Food & Life Skills', location: 'The Kitchen Table', price: 13, spaces: 5, icon: '🥣', tone: 'peach', label: 'MIX IT UP', time: 'Thu · 3:30 pm' },
  { id: 5, title: 'Drama Sparks', subject: 'Drama & Movement', location: 'The Stage Room', price: 12, spaces: 5, icon: '🎭', tone: 'lilac', label: 'TAKE THE STAGE', time: 'Fri · 3:45 pm' },
  { id: 6, title: 'Junior Inventors', subject: 'Science & Building', location: 'Makers Lab', price: 15, spaces: 5, icon: '🧪', tone: 'yellow', label: 'WHAT IF?', time: 'Tue · 4:00 pm' },
  { id: 7, title: 'Dance Lab', subject: 'Dance & Movement', location: 'Studio Two', price: 10, spaces: 5, icon: '🩰', tone: 'pink', label: 'MOVE YOUR WAY', time: 'Mon · 3:30 pm' },
  { id: 8, title: 'Comic Book Crew', subject: 'Art & Making', location: 'The Little Studio', price: 11, spaces: 5, icon: '💬', tone: 'blue', label: 'DRAW A STORY', time: 'Wed · 3:30 pm' },
  { id: 9, title: 'Chess & Strategy', subject: 'Games & Thinking', location: 'Library Room', price: 9, spaces: 5, icon: '♟️', tone: 'mint', label: 'MAKE YOUR MOVE', time: 'Thu · 4:00 pm' },
  { id: 10, title: 'Little Explorers', subject: 'Nature & Science', location: 'Riverside Park', price: 12, spaces: 5, icon: '🦋', tone: 'peach', label: 'OUT & ABOUT', time: 'Fri · 3:30 pm' },
])

const visibleLessons = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  const [field, direction] = sortOption.value.split('-')
  const matches = lessons.value.filter((lesson) => {
    const searchableText = [lesson.title, lesson.subject, lesson.location].join(' ').toLowerCase()
    return searchableText.includes(query)
  })

  return [...matches].sort((first, second) => {
    const firstValue = first[field]
    const secondValue = second[field]
    const order = typeof firstValue === 'number'
      ? firstValue - secondValue
      : String(firstValue).localeCompare(String(secondValue))
    return direction === 'asc' ? order : -order
  })
})

const cartCount = computed(() => cart.value.length)
const cartItems = computed(() => {
  const groupedItems = new Map()

  for (const lessonId of cart.value) {
    const lesson = lessons.value.find((item) => String(item.id) === String(lessonId))
    if (!lesson) continue

    const key = String(lessonId)
    const existingItem = groupedItems.get(key)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      groupedItems.set(key, {
        lessonId,
        title: lesson.title,
        price: lesson.price,
        quantity: 1,
      })
    }
  }

  return [...groupedItems.values()]
})
const cartTotal = computed(() => cartItems.value.reduce((total, item) => total + item.price * item.quantity, 0))
const isNameValid = computed(() => /^[A-Za-z ]+$/.test(customerName.value.trim()))
const isPhoneValid = computed(() => /^\d+$/.test(customerPhone.value.trim()))
const canSubmitOrder = computed(() => isNameValid.value && isPhoneValid.value && cartCount.value > 0 && !isSubmitting.value)
const checkoutHint = computed(() => {
  if (isSubmitting.value) return 'Sending your booking request…'
  if (cartCount.value === 0) return 'Add at least one class before continuing.'
  if (!isNameValid.value || !isPhoneValid.value) return 'Enter a valid name and phone number to continue.'
  return 'Your places are confirmed when the booking is submitted.'
})

async function loadLessons() {
  if (!isApiConfigured) return

  try {
    const result = await fetchLessons()
    const records = Array.isArray(result) ? result : result.lessons

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('The lesson list is empty.')
    }

    lessons.value = records.map((record, index) => ({
      ...record,
      id: record._id ?? record.id ?? index + 1,
      title: record.title ?? record.topic ?? record.subject ?? 'After-school class',
      subject: record.subject ?? record.topic ?? 'Activities',
      location: record.location ?? 'Location to be confirmed',
      price: Number(record.price ?? 0),
      spaces: Number(record.spaces ?? record.space ?? 0),
      icon: record.icon ?? '✳',
      tone: record.tone ?? 'blue',
      label: record.label ?? String(record.subject ?? 'AFTER SCHOOL').toUpperCase(),
      time: record.time ?? 'Weekly class',
      image: resolveApiImage(record.image),
    }))
    catalogNotice.value = ''
  } catch {
    catalogNotice.value = 'We could not reach the live class list, so the preview classes are shown.'
  }
}

function clearCheckoutMessages() {
  checkoutError.value = ''
  checkoutSuccess.value = ''
}

function addToCart(lesson) {
  if (lesson.spaces < 1) return

  clearCheckoutMessages()
  lesson.spaces -= 1
  cart.value.push(lesson.id)
}

function removeFromCart(lessonId) {
  const cartIndex = cart.value.findIndex((id) => String(id) === String(lessonId))
  const lesson = lessons.value.find((item) => String(item.id) === String(lessonId))
  if (cartIndex === -1 || !lesson) return

  clearCheckoutMessages()
  lesson.spaces += 1
  cart.value.splice(cartIndex, 1)
}

async function submitOrder() {
  const name = customerName.value.trim()
  const phone = customerPhone.value.trim()
  checkoutError.value = ''
  checkoutSuccess.value = ''

  if (!isNameValid.value || !isPhoneValid.value || cart.value.length === 0) return

  isSubmitting.value = true
  const orderLessonIds = [...cart.value]
  const uniqueLessonIds = [...new Set(orderLessonIds.map((lessonId) => String(lessonId)))]

  try {
    await createOrder({ name, phone, lessons: orderLessonIds })

    for (const lessonId of uniqueLessonIds) {
      const lesson = lessons.value.find((record) => String(record.id) === lessonId)
      if (!lesson) continue

      await updateLessonSpaces(lessonId, lesson.spaces)
    }

    const bookedCount = orderLessonIds.length
    checkoutSuccess.value = 'Booking request sent for ' + bookedCount + (bookedCount === 1 ? ' class.' : ' classes.')
    cart.value = []
    customerName.value = ''
    customerPhone.value = ''
  } catch (error) {
    checkoutError.value = error instanceof Error
      ? error.message
      : 'We could not complete the booking. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(price)
}

function toggleCart() {
  if (showCart.value) {
    showCart.value = false
    return
  }

  if (cartCount.value > 0) showCart.value = true
}

onMounted(loadLessons)
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="BrightSteps home">
        <span class="brand-mark" aria-hidden="true">✳</span>
        <span>brightsteps<span class="brand-period">.</span></span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="#classes">Explore classes</a>
        <a href="#why-brightsteps">Our approach</a>
        <button class="cart-link" type="button" :disabled="cartCount === 0 && !showCart" @click="toggleCart">
          {{ showCart ? 'Back to classes' : 'Your bag' }} <span class="cart-count">{{ cartCount }}</span>
        </button>
      </nav>
    </header>

    <main>
      <section id="top" class="hero" v-if="!showCart">
        <div class="hero-copy">
          <p class="eyebrow hero-eyebrow"><span class="eyebrow-dot"></span> AFTER-SCHOOL, MADE MAGICAL</p>
          <h1>Room to play.<br /><em>Space to grow.</em></h1>
          <p class="hero-description">The best part of the school day might be what comes after. Find their next favourite thing.</p>
          <a class="button button-light" href="#classes">Find a class <span aria-hidden="true">↘</span></a>
          <div class="hero-note"><span class="hero-note-stars" aria-hidden="true">★★★★★</span><span>Loved by curious kids and their grown-ups</span></div>
        </div>
        <div class="hero-art" aria-label="Creative after-school activities">
          <div class="hero-spark hero-spark-one" aria-hidden="true">✳</div>
          <div class="hero-spark hero-spark-two" aria-hidden="true">✦</div>
          <div class="hero-art-card hero-art-main"><span class="hero-art-icon" aria-hidden="true">🎨</span><span class="hero-art-caption">Make something<br />wonderful.</span></div>
          <div class="hero-art-card hero-art-small"><span aria-hidden="true">🌱</span><small>little<br />gardeners</small></div>
          <div class="hero-sticker">A LITTLE<br />MORE YOU<br /><span>↗</span></div>
          <div class="hero-orbit" aria-hidden="true"></div>
        </div>
      </section>

      <section id="classes" class="classes-section" v-if="!showCart">
        <div class="section-heading">
          <div>
            <p class="eyebrow">GOOD THINGS HAPPEN AFTER THREE</p>
            <h2>What are they into?</h2>
          </div>
          <p class="section-intro">Small groups, lovely teachers, and plenty of room to try something new.</p>
        </div>

        <CatalogControls
          :search-term="searchTerm"
          :sort-option="sortOption"
          @search-change="searchTerm = $event"
          @sort-change="sortOption = $event"
        />
        <p v-if="catalogNotice" class="catalog-notice" role="status">{{ catalogNotice }}</p>

        <div v-if="visibleLessons.length" class="lesson-grid">
          <LessonCard
            v-for="lesson in visibleLessons"
            :key="lesson.id"
            :lesson="lesson"
            :format-price="formatPrice"
            @add="addToCart"
          />
        </div>
        <div v-else class="empty-state">
          <span aria-hidden="true">🔎</span>
          <h3>No classes found</h3>
          <p>Try a different subject or location.</p>
          <button class="text-button" type="button" @click="searchTerm = ''">Clear search</button>
        </div>
      </section>

      <section id="why-brightsteps" class="why-section" v-if="!showCart">
        <div class="why-mark" aria-hidden="true">✳</div>
        <div>
          <p class="eyebrow">A GOOD FIT FOR EVERY KIND OF CURIOUS</p>
          <h2>Not about being the best.<br /><em>About finding their thing.</em></h2>
        </div>
        <p class="why-copy">Friendly groups and welcoming spaces give every child a chance to make, move, explore, and feel proud of what they discover.</p>
      </section>

      <section id="cart" class="cart-section" v-if="showCart">
        <div class="cart-heading">
          <p class="eyebrow">THE START OF SOMETHING</p>
          <h2>Your little adventure<span class="brand-period">.</span></h2>
        </div>
        <div class="cart-panel">
          <div class="cart-panel-heading">
            <h3>Your bag</h3>
            <span>{{ cartCount }} {{ cartCount === 1 ? 'class' : 'classes' }}</span>
          </div>

          <p v-if="checkoutSuccess" class="checkout-message checkout-message-success" role="status">{{ checkoutSuccess }}</p>
          <div v-if="cart.length" class="cart-list">
            <div v-for="item in cartItems" :key="item.lessonId" class="cart-item">
              <div><strong>{{ item.title }}</strong><span>{{ item.quantity }} × {{ formatPrice(item.price) }}</span></div>
              <button class="remove-button" type="button" :aria-label="'Remove one ' + item.title + ' class'" @click="removeFromCart(item.lessonId)">Remove</button>
            </div>

            <div class="cart-total"><span>Subtotal</span><strong>{{ formatPrice(cartTotal) }}</strong></div>
          </div>
          <p v-else class="cart-empty">Your bag is ready for a little inspiration. Add a class to get started.</p>

          <form class="checkout-form" novalidate @submit.prevent="submitOrder">
              <div class="checkout-intro">
                <span class="checkout-number" aria-hidden="true">01</span>
                <div>
                  <p class="eyebrow">A FEW DETAILS</p>
                  <h4>Save their spot</h4>
                  <p>Tell us who to contact about this booking.</p>
                </div>
              </div>

              <div class="checkout-fields">
                <label class="checkout-field" for="customer-name">
                  <span>Your name</span>
                  <input
                    id="customer-name"
                    v-model="customerName"
                    type="text"
                    autocomplete="name"
                    pattern="[A-Za-z ]+"
                    placeholder="e.g. Alex Morgan"
                    :aria-invalid="customerName.trim().length > 0 && !isNameValid"
                    :aria-describedby="customerName.trim().length > 0 && !isNameValid ? 'name-help name-error' : 'name-help'"
                    @input="clearCheckoutMessages()"
                  />
                  <small id="name-help">Letters and spaces only.</small>
                  <small v-if="customerName.trim().length > 0 && !isNameValid" id="name-error" class="field-error" role="alert">Use letters and spaces only.</small>
                </label>

                <label class="checkout-field" for="customer-phone">
                  <span>Phone number</span>
                  <input
                    id="customer-phone"
                    v-model="customerPhone"
                    type="tel"
                    inputmode="numeric"
                    autocomplete="tel"
                    pattern="[0-9]+"
                    placeholder="e.g. 07123456789"
                    :aria-invalid="customerPhone.trim().length > 0 && !isPhoneValid"
                    :aria-describedby="customerPhone.trim().length > 0 && !isPhoneValid ? 'phone-help phone-error' : 'phone-help'"
                    @input="clearCheckoutMessages()"
                  />
                  <small id="phone-help">Digits only.</small>
                  <small v-if="customerPhone.trim().length > 0 && !isPhoneValid" id="phone-error" class="field-error" role="alert">Use digits only.</small>
                </label>
              </div>

              <p v-if="checkoutError" class="checkout-message checkout-message-error" role="alert">{{ checkoutError }}</p>
              <button class="checkout-submit" type="submit" :disabled="!canSubmitOrder">
                <span>{{ isSubmitting ? 'Sending booking…' : 'Continue to checkout' }}</span>
                <span aria-hidden="true">{{ isSubmitting ? '◌' : '↗' }}</span>
              </button>
              <p class="checkout-footnote">{{ checkoutHint }}</p>
          </form>
        </div>
      </section>
    </main>

    <footer class="site-footer">
      <a class="brand brand-footer" href="#top"><span class="brand-mark" aria-hidden="true">✳</span><span>brightsteps<span class="brand-period">.</span></span></a>
      <p>More curious afternoons, please.</p>
      <a href="#top">Back to top ↑</a>
    </footer>
  </div>
</template>
