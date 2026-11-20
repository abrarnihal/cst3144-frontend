<script setup>
defineProps({
  cartItems: { type: Array, required: true },
  cartCount: { type: Number, required: true },
  cartTotal: { type: Number, required: true },
  formatPrice: { type: Function, required: true },
  checkoutSuccess: { type: String, default: '' },
  checkoutError: { type: String, default: '' },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  isNameValid: { type: Boolean, required: true },
  isPhoneValid: { type: Boolean, required: true },
  canSubmitOrder: { type: Boolean, required: true },
  isSubmitting: { type: Boolean, required: true },
  checkoutHint: { type: String, required: true },
})

const emit = defineEmits(['remove', 'update-name', 'update-phone', 'field-input', 'submit'])

function updateName(event) {
  emit('update-name', event.target.value)
  emit('field-input')
}

function updatePhone(event) {
  emit('update-phone', event.target.value)
  emit('field-input')
}
</script>

<template>
  <section id="cart" class="cart-section">
    <div class="cart-heading">
      <p class="eyebrow">THE START OF SOMETHING</p>
      <h1>Your little adventure<span class="brand-period">.</span></h1>
    </div>
    <div class="cart-panel">
      <div class="cart-panel-heading">
        <h3>Your bag</h3>
        <span>{{ cartCount }} {{ cartCount === 1 ? 'class' : 'classes' }}</span>
      </div>

      <p v-if="checkoutSuccess" class="checkout-message checkout-message-success" role="status">{{ checkoutSuccess }}</p>
      <div v-if="cartItems.length" class="cart-list">
        <div v-for="item in cartItems" :key="item.lessonId" class="cart-item">
          <div><strong>{{ item.title }}</strong><span>{{ item.quantity }} × {{ formatPrice(item.price) }}</span></div>
          <button class="remove-button" type="button" :aria-label="'Remove one ' + item.title + ' class'" @click="emit('remove', item.lessonId)">Remove</button>
        </div>

        <div class="cart-total"><span>Subtotal</span><strong>{{ formatPrice(cartTotal) }}</strong></div>
      </div>
      <p v-else class="cart-empty">Your bag is ready for a little inspiration. Add a class to get started.</p>

      <form class="checkout-form" novalidate @submit.prevent="emit('submit')">
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
              :value="customerName"
              type="text"
              autocomplete="name"
              pattern="[A-Za-z ]+"
              placeholder="e.g. Alex Morgan"
              :aria-invalid="customerName.trim().length > 0 && !isNameValid"
              :aria-describedby="customerName.trim().length > 0 && !isNameValid ? 'name-help name-error' : 'name-help'"
              @input="updateName"
            />
            <small id="name-help">Letters and spaces only.</small>
            <small v-if="customerName.trim().length > 0 && !isNameValid" id="name-error" class="field-error" role="alert">Use letters and spaces only.</small>
          </label>

          <label class="checkout-field" for="customer-phone">
            <span>Phone number</span>
            <input
              id="customer-phone"
              :value="customerPhone"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              pattern="[0-9]+"
              placeholder="e.g. 07123456789"
              :aria-invalid="customerPhone.trim().length > 0 && !isPhoneValid"
              :aria-describedby="customerPhone.trim().length > 0 && !isPhoneValid ? 'phone-help phone-error' : 'phone-help'"
              @input="updatePhone"
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
</template>
