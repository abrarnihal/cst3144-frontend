<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import CatalogControls from './components/CatalogControls.vue'
import CartView from './components/CartView.vue'
import LessonCard from './components/LessonCard.vue'
import SiteHeader from './components/SiteHeader.vue'
import { createOrder, fetchLessons, fetchTeacherLessons, fetchTeachers, isApiConfigured, resolveApiImage, searchLessons, updateLessonSpaces } from './services/api.js'

const searchTerm = ref('')
const sortOption = ref('subject-asc')
const availableOnly = ref(false)
const minPrice = ref('')
const maxPrice = ref('')
const cart = ref([])
const showCart = ref(false)
const customerName = ref('')
const customerPhone = ref('')
const checkoutError = ref('')
const checkoutSuccess = ref('')
const catalogNotice = ref('')
const isLoadingLessons = ref(false)
const isSearchingLessons = ref(false)
const isLoadingTeachers = ref(false)
const isSubmitting = ref(false)
const selectedTeacher = ref(null)
const selectedTeacherLessons = ref([])
const teacherNotice = ref('')
const remoteSearchIds = ref(null)
let searchTimer
let searchRequestVersion = 0

// Preview records keep the catalogue useful while the coursework API is being built.
const lessons = ref([
  { id: 1, title: 'Creative Clay Club', subject: 'Art & Making', location: 'The Little Studio', price: 14, spaces: 5, icon: '🎨', tone: 'coral', label: 'MAKE & PLAY', time: 'Tue · 3:30 pm', image: import.meta.env.BASE_URL + 'lesson-images/clay.svg', teacherId: 'olivia-bennett' },
  { id: 2, title: 'Junior Gardeners', subject: 'Nature & Science', location: 'Community Garden', price: 11, spaces: 5, icon: '🌱', tone: 'mint', label: 'GET GROWING', time: 'Mon · 3:45 pm', image: import.meta.env.BASE_URL + 'lesson-images/garden.svg', teacherId: 'noah-clarke' },
  { id: 3, title: 'Code & Create', subject: 'Technology', location: 'Makers Lab', price: 16, spaces: 5, icon: '💻', tone: 'blue', label: 'THINK & BUILD', time: 'Wed · 4:00 pm', image: import.meta.env.BASE_URL + 'lesson-images/code.svg', teacherId: 'aisha-rahman' },
  { id: 4, title: 'Mini Chefs', subject: 'Food & Life Skills', location: 'The Kitchen Table', price: 13, spaces: 5, icon: '🥣', tone: 'peach', label: 'MIX IT UP', time: 'Thu · 3:30 pm', image: import.meta.env.BASE_URL + 'lesson-images/cooking.svg', teacherId: 'daniel-morgan' },
  { id: 5, title: 'Drama Sparks', subject: 'Drama & Movement', location: 'The Stage Room', price: 12, spaces: 5, icon: '🎭', tone: 'lilac', label: 'TAKE THE STAGE', time: 'Fri · 3:45 pm', image: import.meta.env.BASE_URL + 'lesson-images/drama.svg', teacherId: 'mia-patel' },
  { id: 6, title: 'Junior Inventors', subject: 'Science & Building', location: 'Makers Lab', price: 15, spaces: 5, icon: '🧪', tone: 'yellow', label: 'WHAT IF?', time: 'Tue · 4:00 pm', image: import.meta.env.BASE_URL + 'lesson-images/science.svg', teacherId: 'aisha-rahman' },
  { id: 7, title: 'Dance Lab', subject: 'Dance & Movement', location: 'Studio Two', price: 10, spaces: 5, icon: '🩰', tone: 'pink', label: 'MOVE YOUR WAY', time: 'Mon · 3:30 pm', image: import.meta.env.BASE_URL + 'lesson-images/dance.svg', teacherId: 'mia-patel' },
  { id: 8, title: 'Comic Book Crew', subject: 'Art & Making', location: 'The Little Studio', price: 11, spaces: 5, icon: '💬', tone: 'blue', label: 'DRAW A STORY', time: 'Wed · 3:30 pm', image: import.meta.env.BASE_URL + 'lesson-images/comic.svg', teacherId: 'olivia-bennett' },
  { id: 9, title: 'Chess & Strategy', subject: 'Games & Thinking', location: 'Library Room', price: 9, spaces: 5, icon: '♟️', tone: 'mint', label: 'MAKE YOUR MOVE', time: 'Thu · 4:00 pm', image: import.meta.env.BASE_URL + 'lesson-images/chess.svg', teacherId: 'daniel-morgan' },
  { id: 10, title: 'Little Explorers', subject: 'Nature & Science', location: 'Riverside Park', price: 12, spaces: 5, icon: '🦋', tone: 'peach', label: 'OUT & ABOUT', time: 'Fri · 3:30 pm', image: import.meta.env.BASE_URL + 'lesson-images/explorers.svg', teacherId: 'noah-clarke' },
])

const teachers = ref([
  { id: 'olivia-bennett', firstName: 'Olivia', lastName: 'Bennett', speciality: 'Art & Making', lessonCount: 2 },
  { id: 'noah-clarke', firstName: 'Noah', lastName: 'Clarke', speciality: 'Nature & Science', lessonCount: 2 },
  { id: 'aisha-rahman', firstName: 'Aisha', lastName: 'Rahman', speciality: 'Technology & Science', lessonCount: 2 },
  { id: 'daniel-morgan', firstName: 'Daniel', lastName: 'Morgan', speciality: 'Food & Games', lessonCount: 2 },
  { id: 'mia-patel', firstName: 'Mia', lastName: 'Patel', speciality: 'Drama & Movement', lessonCount: 2 },
])

const visibleLessons = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  const [field, direction] = sortOption.value.split('-')
  const lowestPrice = minPrice.value === '' ? null : Number(minPrice.value)
  const highestPrice = maxPrice.value === '' ? null : Number(maxPrice.value)
  const catalogueRecords = remoteSearchIds.value === null
    ? lessons.value
    : lessons.value.filter((lesson) => remoteSearchIds.value.includes(String(lesson.id)))
  const matches = catalogueRecords.filter((lesson) => {
    const searchableText = [lesson.title, lesson.subject, lesson.location].join(' ').toLowerCase()
    const matchesAvailability = !availableOnly.value || lesson.spaces > 0
    const matchesMinimum = lowestPrice === null || !Number.isFinite(lowestPrice) || lesson.price >= lowestPrice
    const matchesMaximum = highestPrice === null || !Number.isFinite(highestPrice) || lesson.price <= highestPrice
    return matchesAvailability && matchesMinimum && matchesMaximum && searchableText.includes(query)
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
const resultsSummary = computed(() => {
  if (isSearchingLessons.value) return 'Searching the live class list…'
  const count = visibleLessons.value.length
  const noun = availableOnly.value
    ? (count === 1 ? 'bookable class' : 'bookable classes')
    : (count === 1 ? 'class' : 'classes')
  const query = searchTerm.value.trim()

  if (query) return `${count} ${noun} found for “${query}”.`
  return availableOnly.value ? `${count} ${noun} found.` : `${count} ${noun} in the catalogue.`
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

const teacherInitials = (teacher) => `${teacher.firstName[0]}${teacher.lastName[0]}`

function normalizeLessonRecords(records) {
  return records.map((record, index) => ({
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
}

async function loadLessons() {
  if (!isApiConfigured) return

  isLoadingLessons.value = true
  searchRequestVersion += 1
  try {
    const result = await fetchLessons()
    const records = Array.isArray(result) ? result : result.lessons

    if (!Array.isArray(records) || records.length === 0) {
      throw new Error('The lesson list is empty.')
    }

    lessons.value = normalizeLessonRecords(records)
    remoteSearchIds.value = null
    catalogNotice.value = ''
  } catch {
    catalogNotice.value = 'We could not reach the live class list, so the preview classes are shown.'
  } finally {
    isLoadingLessons.value = false
    if (searchTerm.value || availableOnly.value || minPrice.value !== '' || maxPrice.value !== '') {
      scheduleCatalogSearch()
    }
  }
}

async function searchCatalog() {
  if (!isApiConfigured || isLoadingLessons.value) return

  const requestVersion = ++searchRequestVersion
  isSearchingLessons.value = true

  try {
    const records = await searchLessons({
      q: searchTerm.value.trim(),
      minPrice: minPrice.value,
      maxPrice: maxPrice.value,
      availableOnly: availableOnly.value,
    })

    if (requestVersion === searchRequestVersion) {
      remoteSearchIds.value = normalizeLessonRecords(records).map((lesson) => String(lesson.id))
      catalogNotice.value = ''
    }
  } catch {
    if (requestVersion === searchRequestVersion) {
      catalogNotice.value = 'Live search is unavailable, so the preview search is shown.'
    }
  } finally {
    if (requestVersion === searchRequestVersion) isSearchingLessons.value = false
  }
}

function scheduleCatalogSearch() {
  if (!isApiConfigured) return

  clearTimeout(searchTimer)
  searchTimer = setTimeout(searchCatalog, 250)
}

async function loadTeachers() {
  if (!isApiConfigured) return

  isLoadingTeachers.value = true
  try {
    teachers.value = await fetchTeachers()
    teacherNotice.value = ''
  } catch {
    teacherNotice.value = 'The teacher directory is showing preview information.'
  } finally {
    isLoadingTeachers.value = false
  }
}

async function viewTeacherClasses(teacher) {
  selectedTeacher.value = teacher
  teacherNotice.value = ''

  try {
    if (isApiConfigured) {
      const result = await fetchTeacherLessons(teacher.id)
      selectedTeacher.value = result.teacher
      selectedTeacherLessons.value = normalizeLessonRecords(result.lessons)
    } else {
      selectedTeacherLessons.value = lessons.value.filter((lesson) => lesson.teacherId === teacher.id)
    }

    await nextTick()
    document.getElementById('teacher-lessons')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch {
    selectedTeacher.value = null
    selectedTeacherLessons.value = []
    teacherNotice.value = 'We could not load this teacher’s classes. Please try again.'
  }
}

function closeTeacherClasses() {
  selectedTeacher.value = null
  selectedTeacherLessons.value = []
}

function updateSearchTerm(value) {
  searchTerm.value = value
  scheduleCatalogSearch()
}

function updateAvailability(value) {
  availableOnly.value = value
  scheduleCatalogSearch()
}

function updatePriceFilter(field, value) {
  if (field === 'minPrice') minPrice.value = value
  if (field === 'maxPrice') maxPrice.value = value
  scheduleCatalogSearch()
}

function clearCheckoutMessages() {
  checkoutError.value = ''
  checkoutSuccess.value = ''
}

function clearCatalogFilters() {
  searchTerm.value = ''
  availableOnly.value = false
  minPrice.value = ''
  maxPrice.value = ''
  scheduleCatalogSearch()
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
    await createOrder({ name, phone, lessonIDs: orderLessonIds })

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

onMounted(() => {
  loadLessons()
  loadTeachers()
})
</script>

<template>
  <div id="top" class="site-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>
    <SiteHeader :cart-count="cartCount" :show-cart="showCart" @toggle-cart="toggleCart" />

    <main id="main-content">
      <section class="hero" v-if="!showCart">
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
          :available-only="availableOnly"
          :min-price="minPrice"
          :max-price="maxPrice"
          @search-change="updateSearchTerm"
          @sort-change="sortOption = $event"
          @availability-change="updateAvailability"
          @price-change="updatePriceFilter"
        />
        <p class="results-summary" role="status" aria-live="polite">{{ resultsSummary }}</p>
        <div v-if="catalogNotice" class="catalog-notice">
          <span role="status" aria-live="polite">{{ isLoadingLessons ? 'Trying to reconnect to the live class list…' : catalogNotice }}</span>
          <button class="retry-button" type="button" :disabled="isLoadingLessons" @click="loadLessons">
            {{ isLoadingLessons ? 'Trying again…' : 'Try again' }}
          </button>
        </div>

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
          <button class="text-button" type="button" @click="clearCatalogFilters">Clear filters</button>
        </div>
      </section>

      <section id="teachers" class="teacher-section" v-if="!showCart">
        <div class="section-heading">
          <div>
            <p class="eyebrow">THE PEOPLE BEHIND THE GOOD TIMES</p>
            <h2>Meet the teachers</h2>
          </div>
          <p class="section-intro">Get to know the friendly faces who make every class feel welcoming.</p>
        </div>
        <p v-if="isLoadingTeachers" class="teacher-status" role="status">Loading the teacher directory…</p>
        <p v-if="teacherNotice" class="teacher-status" role="status">{{ teacherNotice }}</p>
        <div class="teacher-grid">
          <article v-for="teacher in teachers" :key="teacher.id" class="teacher-card">
            <div class="teacher-avatar" aria-hidden="true">{{ teacherInitials(teacher) }}</div>
            <p class="teacher-speciality">{{ teacher.speciality }}</p>
            <h3>{{ teacher.firstName }} {{ teacher.lastName }}</h3>
            <p class="teacher-class-count">{{ teacher.lessonCount }} classes to explore</p>
            <button class="teacher-button" type="button" @click="viewTeacherClasses(teacher)">
              View their classes <span aria-hidden="true">↗</span>
            </button>
          </article>
        </div>

        <div v-if="selectedTeacher" id="teacher-lessons" class="teacher-lessons">
          <div class="teacher-lessons-heading">
            <div>
              <p class="eyebrow">CLASSES WITH</p>
              <h3>{{ selectedTeacher.firstName }} {{ selectedTeacher.lastName }}</h3>
            </div>
            <button class="text-button" type="button" @click="closeTeacherClasses">Close classes</button>
          </div>
          <div v-if="selectedTeacherLessons.length" class="lesson-grid">
            <LessonCard
              v-for="lesson in selectedTeacherLessons"
              :key="lesson.id"
              :lesson="lesson"
              :format-price="formatPrice"
              @add="addToCart"
            />
          </div>
          <p v-else class="teacher-status" role="status">This teacher has no classes listed yet.</p>
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

      <CartView
        v-if="showCart"
        :cart-items="cartItems"
        :cart-count="cartCount"
        :cart-total="cartTotal"
        :format-price="formatPrice"
        :checkout-success="checkoutSuccess"
        :checkout-error="checkoutError"
        :customer-name="customerName"
        :customer-phone="customerPhone"
        :is-name-valid="isNameValid"
        :is-phone-valid="isPhoneValid"
        :can-submit-order="canSubmitOrder"
        :is-submitting="isSubmitting"
        :checkout-hint="checkoutHint"
        @remove="removeFromCart"
        @update-name="customerName = $event"
        @update-phone="customerPhone = $event"
        @field-input="clearCheckoutMessages"
        @submit="submitOrder"
      />
    </main>

    <footer class="site-footer">
      <a class="brand brand-footer" href="#top"><span class="brand-mark" aria-hidden="true">✳</span><span>brightsteps<span class="brand-period">.</span></span></a>
      <p>More curious afternoons, please.</p>
      <a href="#top">Back to top ↑</a>
    </footer>
  </div>
</template>

