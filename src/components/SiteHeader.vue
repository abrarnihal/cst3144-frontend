<script setup>
import { ref } from 'vue'

defineProps({
  cartCount: { type: Number, required: true },
  showCart: { type: Boolean, required: true },
})

const emit = defineEmits(['toggle-cart'])
const menuOpen = ref(false)
const menuToggle = ref(null)

function closeMenu() {
  menuOpen.value = false
  menuToggle.value?.focus()
}

function toggleCart() {
  menuOpen.value = false
  emit('toggle-cart')
}
</script>

<template>
  <header class="site-header">
    <a class="brand" href="#top" aria-label="BrightSteps home">
      <span class="brand-mark" aria-hidden="true">✳</span>
      <span>brightsteps<span class="brand-period">.</span></span>
    </a>
    <button
      ref="menuToggle"
      class="mobile-menu-toggle"
      type="button"
      aria-controls="primary-navigation"
      :aria-expanded="menuOpen"
      :aria-label="menuOpen ? 'Close navigation menu' : 'Open navigation menu'"
      @click="menuOpen = !menuOpen"
      @keydown.esc.prevent="closeMenu"
    >
      <span>{{ menuOpen ? 'Close' : 'Menu' }}</span>
      <span aria-hidden="true">{{ menuOpen ? '×' : '☰' }}</span>
    </button>
    <nav id="primary-navigation" class="main-nav" :class="{ 'main-nav-open': menuOpen }" aria-label="Main navigation" @keydown.esc.prevent="closeMenu">
      <template v-if="!showCart">
        <a href="#classes" @click="menuOpen = false">Explore classes</a>
        <a href="#teachers" @click="menuOpen = false">Meet the teachers</a>
        <a href="#why-brightsteps" @click="menuOpen = false">Our approach</a>
      </template>
      <button
        class="cart-link"
        type="button"
        :disabled="cartCount === 0 && !showCart"
        :aria-label="showCart ? 'Back to classes' : 'Open your bag, ' + cartCount + (cartCount === 1 ? ' class' : ' classes')"
        @click="toggleCart"
      >
        {{ showCart ? 'Back to classes' : 'Your bag' }}
        <span class="cart-count" aria-live="polite" aria-atomic="true">{{ cartCount }}</span>
      </button>
    </nav>
  </header>
</template>

