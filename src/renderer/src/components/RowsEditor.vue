<script setup>
const props = defineProps({
  rows: { type: Array, required: true },
  // [{ field, label, placeholder }]
  columns: { type: Array, required: true },
  addLabel: { type: String, default: '+ Adicionar' }
})

function addRow() {
  const blank = {}
  for (const c of props.columns) blank[c.field] = ''
  props.rows.push(blank)
}

function removeRow(i) {
  props.rows.splice(i, 1)
}
</script>

<template>
  <div>
    <div v-if="rows.length" class="mb-2">
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="row-grid mb-1"
        :style="{ gridTemplateColumns: `repeat(${columns.length}, 1fr) auto` }"
      >
        <input
          v-for="c in columns"
          :key="c.field"
          v-model="row[c.field]"
          class="form-control form-control-sm"
          :placeholder="c.placeholder || c.label"
        />
        <button
          class="btn btn-sm btn-outline-danger"
          type="button"
          title="Remover"
          @click="removeRow(i)"
        >
          ×
        </button>
      </div>
    </div>
    <p v-else class="text-muted small mb-2">Nenhum item.</p>
    <button class="btn btn-sm btn-outline-secondary" type="button" @click="addRow">
      {{ addLabel }}
    </button>
  </div>
</template>
