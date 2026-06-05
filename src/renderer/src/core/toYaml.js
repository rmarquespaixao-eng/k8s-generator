import yaml from 'js-yaml'
import { prune } from './util.js'

const DUMP_OPTS = {
  indent: 2,
  lineWidth: -1, // never wrap
  noRefs: true,
  sortKeys: false
}

/** Serialize a single resource object to a YAML document (pruned of empties). */
export function resourceToYaml(resource) {
  return yaml.dump(prune(resource), DUMP_OPTS)
}

/** Serialize an arbitrary plain object to YAML (used for kustomization, values, Chart). */
export function objectToYaml(obj) {
  return yaml.dump(prune(obj), DUMP_OPTS)
}
