<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  // when toggle === null the section has no enable switch (always shown)
  toggle: { type: Object, default: null } // { get, set } not used; see modelValue
})
const model = defineModel({ type: Boolean, default: null })
</script>

<template>
  <div class="card mb-3 shadow-sm">
    <div class="card-header d-flex justify-content-between align-items-center">
      <div>
        <span class="fw-semibold">{{ title }}</span>
        <small v-if="subtitle" class="text-muted ms-2">{{ subtitle }}</small>
      </div>
      <div v-if="model !== null" class="form-check form-switch m-0">
        <input
          class="form-check-input"
          type="checkbox"
          role="switch"
          :checked="model"
          @change="model = $event.target.checked"
        />
      </div>
    </div>
    <div v-if="model === null || model" class="card-body">
      <slot />
    </div>
  </div>
</template>
