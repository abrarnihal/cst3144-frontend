<script setup>
import { ref } from 'vue'

defineProps({
  lesson: { type: Object, required: true },
  formatPrice: { type: Function, required: true },
})

const emit = defineEmits(['add'])
const imageUnavailable = ref(false)
</script>

<template>
  <article class="lesson-card">
    <div class="lesson-art" :class="'tone-' + lesson.tone">
      <span class="lesson-label">{{ lesson.label }}</span>
      <img
        v-if="lesson.image && !imageUnavailable"
        class="lesson-image"
        :src="lesson.image"
        :alt="lesson.title"
        loading="lazy"
        @error="imageUnavailable = true"
      />
      <span v-else class="lesson-icon" aria-hidden="true">{{ lesson.icon }}</span>
      <span class="lesson-number">{{ String(lesson.id).padStart(2, '0') }}</span>
    </div>
    <div class="lesson-details">
      <p class="lesson-subject">[ {{ lesson.subject }} ]</p>
      <h3>{{ lesson.title }}</h3>
      <div class="lesson-meta">
        <span>{{ lesson.location }}</span>
        <span>{{ lesson.time }}</span>
      </div>
      <div class="lesson-card-bottom">
        <div class="lesson-price">{{ formatPrice(lesson.price) }}<small> / class</small></div>
        <button
          class="add-button"
          type="button"
          :disabled="lesson.spaces < 1"
          :aria-label="lesson.spaces < 1 ? lesson.title + ' is fully booked' : 'Add ' + lesson.title + ' to your bag'"
          @click="emit('add', lesson)"
        >
          {{ lesson.spaces < 1 ? 'Fully booked' : 'Add to bag +' }}
        </button>
      </div>
      <p class="spaces-note">
        {{ lesson.spaces }} {{ lesson.spaces === 1 ? 'space' : 'spaces' }} left
      </p>
    </div>
  </article>
</template>
