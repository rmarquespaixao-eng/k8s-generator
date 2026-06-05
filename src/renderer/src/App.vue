<script setup>
import { reactive, ref, computed } from 'vue'
import { defaultSpec } from './core/defaultSpec.js'
import MetaForm from './components/forms/MetaForm.vue'
import DeploymentForm from './components/forms/DeploymentForm.vue'
import ServiceForm from './components/forms/ServiceForm.vue'
import IngressForm from './components/forms/IngressForm.vue'
import ConfigSecretForm from './components/forms/ConfigSecretForm.vue'
import ScalingForm from './components/forms/ScalingForm.vue'
import CronForm from './components/forms/CronForm.vue'
import StorageForm from './components/forms/StorageForm.vue'
import PreviewPane from './components/PreviewPane.vue'
import ImportModal from './components/ImportModal.vue'
import PresetsMenu from './components/PresetsMenu.vue'

const spec = reactive(defaultSpec())
const importOpen = ref(false)
const toast = ref('')
let toastTimer = null

const sections = [
  { id: 'meta', label: 'Aplicação', comp: MetaForm, flag: null },
  { id: 'deployment', label: 'Deployment', comp: DeploymentForm, flag: 'deployment' },
  { id: 'service', label: 'Service', comp: ServiceForm, flag: 'service' },
  { id: 'ingress', label: 'Ingress', comp: IngressForm, flag: 'ingress' },
  { id: 'config', label: 'Config & Secrets', comp: ConfigSecretForm, flag: 'configMap' },
  { id: 'scaling', label: 'Autoscaling', comp: ScalingForm, flag: 'hpa' },
  { id: 'cron', label: 'CronJob', comp: CronForm, flag: 'cronjob' },
  { id: 'storage', label: 'Storage', comp: StorageForm, flag: 'pvc' }
]

const active = ref('meta')
const current = computed(() => sections.find((s) => s.id === active.value))

function isOn(flag) {
  if (flag === 'configMap') return spec.configMap.enabled || spec.externalSecret.enabled
  return flag ? spec[flag]?.enabled : false
}

function applySpec(next) {
  Object.assign(spec, next)
}

function reset() {
  applySpec(defaultSpec())
  notify('Formulário reiniciado')
}

function onImported(next) {
  applySpec(next)
  active.value = 'meta'
  notify('YAML importado')
}

function notify(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2500)
}
</script>

<template>
  <header class="d-flex align-items-center gap-2 px-3 py-2 border-bottom bg-body-tertiary">
    <strong>k8s-generator</strong>
    <span class="text-muted small">gerador de manifestos Kubernetes</span>
    <div class="ms-auto d-flex align-items-center gap-2">
      <button class="btn btn-sm btn-outline-secondary" @click="importOpen = true">Importar YAML</button>
      <PresetsMenu :spec="spec" @load="applySpec" @notify="notify" />
      <button class="btn btn-sm btn-outline-secondary" @click="reset">Reset</button>
    </div>
  </header>

  <div class="app-body">
    <nav class="app-nav">
      <div class="nav flex-column nav-pills py-2">
        <button
          v-for="s in sections"
          :key="s.id"
          class="nav-link text-start px-3"
          :class="{ active: active === s.id }"
          @click="active = s.id"
        >
          <span>{{ s.label }}</span>
          <span v-if="s.flag && isOn(s.flag)" class="section-dot" title="habilitado"></span>
        </button>
      </div>
    </nav>

    <main class="app-form">
      <component :is="current.comp" :spec="spec" />
    </main>

    <PreviewPane :spec="spec" @notify="notify" />
  </div>

  <ImportModal v-model="importOpen" @imported="onImported" />

  <div v-if="toast" class="app-toast">{{ toast }}</div>
</template>

<style scoped>
.app-toast {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(33, 37, 41, 0.95);
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  z-index: 1100;
  box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.35);
}
</style>
