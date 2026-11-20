<script setup>
defineProps({
  searchTerm: { type: String, required: true },
  sortOption: { type: String, required: true },
  availableOnly: { type: Boolean, required: true },
})

const emit = defineEmits(['search-change', 'sort-change', 'availability-change'])
</script>

<template>
  <div class="class-toolbar">
    <label class="search-control">
      <span aria-hidden="true">⌕</span>
      <input
        :value="searchTerm"
        type="search"
        placeholder="Try art, gardening, or a location"
        aria-label="Search classes"
        @input="emit('search-change', $event.target.value)"
      />
    </label>
    <label class="sort-control">
      <span>Sort by</span>
      <select
        :value="sortOption"
        aria-label="Sort classes"
        @change="emit('sort-change', $event.target.value)"
      >
        <option value="subject-asc">Subject A to Z</option>
        <option value="subject-desc">Subject Z to A</option>
        <option value="location-asc">Location A to Z</option>
        <option value="location-desc">Location Z to A</option>
        <option value="price-asc">Price low to high</option>
        <option value="price-desc">Price high to low</option>
        <option value="spaces-asc">Spaces low to high</option>
        <option value="spaces-desc">Spaces high to low</option>
      </select>
    </label>
    <label class="availability-filter">
      <input
        type="checkbox"
        :checked="availableOnly"
        @change="emit('availability-change', $event.target.checked)"
      />
      <span>Only show available</span>
    </label>
  </div>
</template>
