<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { defaultSpec } from './core/defaultSpec.js'
import { DOCS } from './core/docs.js'
import MetaForm from './components/forms/MetaForm.vue'
import WorkloadForm from './components/forms/WorkloadForm.vue'
import CronForm from './components/forms/CronForm.vue'
import JobForm from './components/forms/JobForm.vue'
import ServiceForm from './components/forms/ServiceForm.vue'
import IngressForm from './components/forms/IngressForm.vue'
import NetworkPolicyForm from './components/forms/NetworkPolicyForm.vue'
import ConfigSecretForm from './components/forms/ConfigSecretForm.vue'
import SecretForm from './components/forms/SecretForm.vue'
import ServiceAccountForm from './components/forms/ServiceAccountForm.vue'
import RbacForm from './components/forms/RbacForm.vue'
import ScalingForm from './components/forms/ScalingForm.vue'
import PdbForm from './components/forms/PdbForm.vue'
import StorageForm from './components/forms/StorageForm.vue'
import QuotaForm from './components/forms/QuotaForm.vue'
import RolloutForm from './components/forms/RolloutForm.vue'
import ArgoAppForm from './components/forms/ArgoAppForm.vue'
import ArgoAppSetForm from './components/forms/ArgoAppSetForm.vue'
import ArgoWorkflowForm from './components/forms/ArgoWorkflowForm.vue'
import PreviewPane from './components/PreviewPane.vue'
import ImportModal from './components/ImportModal.vue'
import PresetsMenu from './components/PresetsMenu.vue'

const spec = reactive(defaultSpec())
const importOpen = ref(false)
const toast = ref('')
const theme = ref('dark')
let toastTimer = null

const sections = [
  { id: 'meta', label: 'Aplicação', icon: '📦', comp: MetaForm, cat: 'Geral', on: (s) => s.meta.emitNamespace },
  { id: 'workload', label: 'Workload', icon: '🚀', comp: WorkloadForm, cat: 'Workload', on: (s) => s.deployment.enabled },
  { id: 'cron', label: 'CronJob', icon: '⏰', comp: CronForm, cat: 'Workload', on: (s) => s.cronjob.enabled },
  { id: 'job', label: 'Job', icon: '🔂', comp: JobForm, cat: 'Workload', on: (s) => s.job.enabled },
  { id: 'service', label: 'Service', icon: '🔌', comp: ServiceForm, cat: 'Rede', on: (s) => s.service.enabled },
  { id: 'ingress', label: 'Ingress', icon: '🌐', comp: IngressForm, cat: 'Rede', on: (s) => s.ingress.enabled },
  { id: 'netpol', label: 'NetworkPolicy', icon: '🧱', comp: NetworkPolicyForm, cat: 'Rede', on: (s) => s.networkPolicy.enabled },
  { id: 'config', label: 'Config & Secrets', icon: '⚙️', comp: ConfigSecretForm, cat: 'Config', on: (s) => s.configMap.enabled || s.externalSecret.enabled },
  { id: 'secret', label: 'Secret', icon: '🔑', comp: SecretForm, cat: 'Config', on: (s) => s.secret.enabled },
  { id: 'sa', label: 'ServiceAccount', icon: '👤', comp: ServiceAccountForm, cat: 'Segurança', on: (s) => s.serviceAccount.enabled },
  { id: 'rbac', label: 'RBAC', icon: '🔐', comp: RbacForm, cat: 'Segurança', on: (s) => s.rbac.enabled },
  { id: 'scaling', label: 'Autoscaling', icon: '📈', comp: ScalingForm, cat: 'Escala & Confiabilidade', on: (s) => s.hpa.enabled },
  { id: 'pdb', label: 'PodDisruptionBudget', icon: '♻️', comp: PdbForm, cat: 'Escala & Confiabilidade', on: (s) => s.pdb.enabled },
  { id: 'storage', label: 'Storage', icon: '💾', comp: StorageForm, cat: 'Escala & Confiabilidade', on: (s) => s.pvc.enabled },
  { id: 'quota', label: 'Quotas & Limits', icon: '📊', comp: QuotaForm, cat: 'Limites', on: (s) => s.resourceQuota.enabled || s.limitRange.enabled },
  { id: 'argoapp', label: 'CD Application', icon: '🐙', comp: ArgoAppForm, cat: 'Argo / GitOps', on: (s) => s.argoApp.enabled },
  { id: 'argoappset', label: 'CD ApplicationSet', icon: '🗂️', comp: ArgoAppSetForm, cat: 'Argo / GitOps', on: (s) => s.argoAppSet.enabled },
  { id: 'rollout', label: 'Rollout', icon: '🎢', comp: RolloutForm, cat: 'Argo / GitOps', on: (s) => s.rollout.enabled },
  { id: 'workflow', label: 'Workflow', icon: '🔀', comp: ArgoWorkflowForm, cat: 'Argo / GitOps', on: (s) => s.argoWorkflow.enabled }
]

const categories = ['Geral', 'Workload', 'Rede', 'Config', 'Segurança', 'Escala & Confiabilidade', 'Limites', 'Argo / GitOps']
const grouped = computed(() => categories.map((cat) => ({ cat, items: sections.filter((s) => s.cat === cat) })))
const collapsed = reactive({})

const active = ref('meta')
const current = computed(() => sections.find((s) => s.id === active.value))

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
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-bs-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-bs-theme', theme.value)
})
</script>

<template>
  <header class="d-flex align-items-center gap-2 px-3 py-2 border-bottom bg-body-tertiary">
    <span class="brand">⎈ k8s-generator</span>
    <span class="text-muted small d-none d-lg-inline">gerador de manifestos Kubernetes</span>
    <div class="ms-auto d-flex align-items-center gap-2">
      <button class="btn btn-sm btn-outline-secondary" :title="theme === 'dark' ? 'Tema claro' : 'Tema escuro'" @click="toggleTheme">
        {{ theme === 'dark' ? '☀️' : '🌙' }}
      </button>
      <button class="btn btn-sm btn-outline-secondary" @click="importOpen = true">Importar YAML</button>
      <PresetsMenu :spec="spec" @load="applySpec" @notify="notify" />
      <button class="btn btn-sm btn-outline-secondary" @click="reset">Reset</button>
    </div>
  </header>

  <div class="app-body">
    <nav class="app-nav">
      <div v-for="g in grouped" :key="g.cat" class="nav-group">
        <button class="nav-group-header" @click="collapsed[g.cat] = !collapsed[g.cat]">
          <span>{{ g.cat }}</span>
          <span class="caret">{{ collapsed[g.cat] ? '▸' : '▾' }}</span>
        </button>
        <div v-show="!collapsed[g.cat]">
          <div
            v-for="s in g.items"
            :key="s.id"
            class="nav-link text-start"
            :class="{ active: active === s.id }"
            role="button"
            @click="active = s.id"
          >
            <span class="nav-ico">{{ s.icon }}</span>
            <span class="flex-grow-1">{{ s.label }}</span>
            <span v-if="s.on(spec)" class="section-dot" title="habilitado"></span>
            <a
              v-if="DOCS[s.id]"
              class="doc-link"
              :href="DOCS[s.id][0].url"
              target="_blank"
              rel="noopener"
              title="Documentação oficial"
              @click.stop
              >↗</a
            >
          </div>
        </div>
      </div>
    </nav>

    <main class="app-form">
      <div v-if="DOCS[active]" class="doc-banner">
        <span class="me-2">📖 Documentação:</span>
        <a
          v-for="d in DOCS[active]"
          :key="d.url"
          :href="d.url"
          target="_blank"
          rel="noopener"
          class="me-2"
          >{{ d.label }} ↗</a
        >
      </div>
      <component :is="current.comp" :spec="spec" />
    </main>

    <PreviewPane :spec="spec" @notify="notify" />
  </div>

  <ImportModal v-model="importOpen" @imported="onImported" />
  <div v-if="toast" class="app-toast">{{ toast }}</div>
</template>

<style scoped>
.brand {
  font-weight: 700;
}
.nav-group {
  border-bottom: 1px solid var(--bs-border-color);
}
.nav-group-header {
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--bs-secondary-color);
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  font-weight: 700;
  padding: 0.5rem 0.75rem 0.35rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-ico {
  width: 1.3rem;
  text-align: center;
}
.doc-link {
  opacity: 0;
  text-decoration: none;
  font-size: 0.85rem;
  color: inherit;
  padding: 0 0.2rem;
}
.nav-link:hover .doc-link {
  opacity: 0.75;
}
.doc-link:hover {
  opacity: 1 !important;
}
.doc-banner {
  font-size: 0.82rem;
  padding: 0.4rem 0.6rem;
  margin-bottom: 0.75rem;
  border-radius: 0.375rem;
  background: var(--bs-tertiary-bg);
  border: 1px solid var(--bs-border-color);
}
.doc-banner a {
  text-decoration: none;
}
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
