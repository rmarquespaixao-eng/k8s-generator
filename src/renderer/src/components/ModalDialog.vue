<script setup>
defineProps({ title: { type: String, default: '' }, wide: { type: Boolean, default: false } })
const show = defineModel({ type: Boolean, default: false })
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="show = false">
      <div class="modal-card" :class="{ wide }">
        <div class="modal-card-header">
          <span class="fw-semibold">{{ title }}</span>
          <button class="btn-close" type="button" aria-label="Fechar" @click="show = false"></button>
        </div>
        <div class="modal-card-body">
          <slot />
        </div>
        <div v-if="$slots.footer" class="modal-card-footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.modal-card {
  background: var(--bs-body-bg);
  border-radius: 0.5rem;
  width: 520px;
  max-width: 92vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.4);
}
.modal-card.wide {
  width: 760px;
}
.modal-card-header,
.modal-card-footer {
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
}
.modal-card-header {
  justify-content: space-between;
  border-bottom: 1px solid var(--bs-border-color);
}
.modal-card-footer {
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid var(--bs-border-color);
}
.modal-card-body {
  padding: 1rem;
  overflow-y: auto;
}
</style>
