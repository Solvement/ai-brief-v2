import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = join(__dirname, 'schema');

function readYaml(name) {
  const file = join(SCHEMA_DIR, `${name}.yaml`);
  return YAML.parse(readFileSync(file, 'utf8')) ?? {};
}

const entitiesSchema = readYaml('entities');
const edgesSchema = readYaml('edges');
const xrefSchema = readYaml('xref');
const conventionsSchema = readYaml('conventions');

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function entriesFromCollection(value, reserved = []) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (!isObject(item)) return [String(item), {}];
      const key = item.kind ?? item.name ?? item.type ?? item.id;
      return [String(key), item];
    });
  }

  if (isObject(value)) {
    return Object.entries(value).filter(([key]) => !reserved.includes(key));
  }

  return [];
}

function entityEntries(schema) {
  const source = schema.entities ?? schema.kinds ?? schema.types ?? schema;
  return entriesFromCollection(source, [
    'entities',
    'kinds',
    'types',
    'lifecycle',
    'field_defaults',
    'required_fields',
    'valid_values',
  ]);
}

function normalizeFieldMap(spec) {
  if (isObject(spec.fields)) return spec.fields;
  if (isObject(spec.frontmatter)) return spec.frontmatter;
  if (isObject(spec.schema)) return spec.schema;
  return {};
}

function fieldIsRequired(fieldSpec) {
  return fieldSpec === true || (isObject(fieldSpec) && fieldSpec.required === true);
}

function fieldDefault(fieldSpec) {
  if (!isObject(fieldSpec)) return undefined;
  if (Object.hasOwn(fieldSpec, 'default')) return fieldSpec.default;
  if (Object.hasOwn(fieldSpec, 'default_value')) return fieldSpec.default_value;
  return undefined;
}

function fieldValidValues(fieldSpec) {
  if (!isObject(fieldSpec)) return [];
  return asArray(fieldSpec.valid_values ?? fieldSpec.valid ?? fieldSpec.values ?? fieldSpec.enum ?? fieldSpec.options);
}

function normalizeEntities(schema) {
  return Object.fromEntries(
    entityEntries(schema).map(([kind, spec]) => [kind, isObject(spec) ? spec : {}]),
  );
}

function normalizeEntityDirs(entities) {
  return Object.fromEntries(
    Object.entries(entities).map(([kind, spec]) => [
      kind,
      entitySubdir(spec.dir ?? spec.directory ?? spec.folder ?? spec.path ?? kind, kind),
    ]),
  );
}

// entities.yaml `dir` values are full repo-relative paths that include the
// wiki-root prefix (e.g. "brief-wiki/concepts/"). ENTITY_DIRS must be the
// subdir RELATIVE to the wiki root so callers can join wikiRoot + subdir
// without doubling the prefix ("brief-wiki/brief-wiki/concepts/"). Strip a
// leading "<root>/" segment and trailing slashes; fall back to kind.
function entitySubdir(dir, kind) {
  const trimmed = String(dir).replace(/^[/]+/, "").replace(/[/]+$/, "");
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length >= 2) return parts.slice(1).join("/"); // drop the wiki-root segment
  return parts[0] || kind;
}

function normalizeRequiredFields(entities, schema) {
  const globalRequired = asArray(schema.required_fields ?? schema.required);
  return Object.fromEntries(
    Object.entries(entities).map(([kind, spec]) => {
      const fields = normalizeFieldMap(spec);
      const required = new Set([
        ...globalRequired,
        ...asArray(spec.required_fields ?? spec.required),
        ...Object.entries(fields)
          .filter(([, fieldSpec]) => fieldIsRequired(fieldSpec))
          .map(([field]) => field),
      ]);
      return [kind, [...required]];
    }),
  );
}

function normalizeFieldDefaults(entities, schema) {
  const globalDefaults = isObject(schema.field_defaults) ? schema.field_defaults : {};
  return Object.fromEntries(
    Object.entries(entities).map(([kind, spec]) => {
      const fields = normalizeFieldMap(spec);
      const defaults = { ...globalDefaults, ...(isObject(spec.field_defaults) ? spec.field_defaults : {}) };
      for (const [field, fieldSpec] of Object.entries(fields)) {
        const value = fieldDefault(fieldSpec);
        if (value !== undefined) defaults[field] = value;
      }
      return [kind, defaults];
    }),
  );
}

function normalizeValidValues(entities, schema) {
  const globalValues = isObject(schema.valid_values) ? schema.valid_values : {};
  return Object.fromEntries(
    Object.entries(entities).map(([kind, spec]) => {
      const fields = normalizeFieldMap(spec);
      const values = { ...globalValues, ...(isObject(spec.valid_values) ? spec.valid_values : {}) };
      for (const [field, fieldSpec] of Object.entries(fields)) {
        const allowed = fieldValidValues(fieldSpec);
        if (allowed.length > 0) values[field] = allowed;
      }
      return [kind, values];
    }),
  );
}

function edgeEntries(schema) {
  const source = schema.edges ?? schema.types ?? schema.edge_types ?? schema;
  return entriesFromCollection(source, ['edges', 'types', 'edge_types', 'valid_edge_types']);
}

function normalizeEdges(schema) {
  return Object.fromEntries(
    edgeEntries(schema).map(([type, spec]) => [type, isObject(spec) ? spec : {}]),
  );
}

function edgeSpec(type) {
  return EDGES[type];
}

function edgeAttributeSchema(spec) {
  if (!isObject(spec)) return {};
  return spec.attributes ?? spec.attrs ?? spec.fields ?? {};
}

function edgeRequiredAttributes(spec) {
  const attributes = edgeAttributeSchema(spec);
  return new Set([
    ...asArray(spec.required_attributes ?? spec.required_attrs),
    ...Object.entries(attributes)
      .filter(([, attrSpec]) => fieldIsRequired(attrSpec))
      .map(([attr]) => attr),
  ]);
}

function edgeAttributeValidValues(spec, attr) {
  const attributes = edgeAttributeSchema(spec);
  return fieldValidValues(attributes[attr]);
}

function edgeRequiresEvidence(type) {
  const spec = edgeSpec(type);
  if (!spec) return false;
  const required = edgeRequiredAttributes(spec);
  return Boolean(spec.requires_evidence ?? spec.evidence_required ?? required.has('evidence'));
}

function normalizeSlugRule(schema) {
  const slug = schema.slug ?? schema.slugs ?? schema.slug_rule ?? {};
  if (isObject(slug)) return slug;
  if (typeof slug === 'string') return { pattern: slug };
  return {
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
    separator: '-',
    lowercase: true,
  };
}

export const ENTITIES = normalizeEntities(entitiesSchema);
export const ENTITY_DIRS = normalizeEntityDirs(ENTITIES);
export const REQUIRED_FIELDS = normalizeRequiredFields(ENTITIES, entitiesSchema);
export const FIELD_DEFAULTS = normalizeFieldDefaults(ENTITIES, entitiesSchema);
export const VALID_VALUES = normalizeValidValues(ENTITIES, entitiesSchema);
// `lifecycle` is nested per-entity in entities.yaml (e.g. content.lifecycle.transitions),
// not a top-level key. Collect each entity's transition map keyed by entity kind.
export const LIFECYCLE = Object.fromEntries(
  Object.entries(entitiesSchema)
    .filter(([, spec]) => spec && typeof spec === "object" && spec.lifecycle)
    .map(([kind, spec]) => [kind, spec.lifecycle.transitions ?? spec.lifecycle]),
);
export const EDGES = normalizeEdges(edgesSchema);
export const VALID_EDGE_TYPES = [
  ...new Set([
    ...Object.keys(EDGES),
    ...asArray(edgesSchema.valid_edge_types ?? edgesSchema.edge_types),
  ]),
].filter((type) => typeof type === 'string' && type.length > 0);
export const XREF = xrefSchema;
export const CONVENTIONS = conventionsSchema;
export const slugRule = normalizeSlugRule(CONVENTIONS);

export function edgeIsSymmetric(type) {
  const spec = edgeSpec(type);
  if (!spec) return false;
  // edges.yaml expresses this as `direction: symmetric`.
  if (typeof spec.direction === "string") return spec.direction.toLowerCase() === "symmetric";
  return Boolean(spec.symmetric ?? spec.bidirectional ?? spec.undirected);
}

export function edgeRequiresConfidence(type) {
  const spec = edgeSpec(type);
  if (!spec) return false;
  const required = edgeRequiredAttributes(spec);
  return Boolean(spec.requires_confidence ?? spec.confidence_required ?? required.has('confidence'));
}

export function edgeAttributeErrors(type, attributes = {}) {
  const errors = [];
  const spec = edgeSpec(type);

  if (!spec) {
    errors.push(`Unknown edge type: ${type}`);
    return errors;
  }

  for (const attr of edgeRequiredAttributes(spec)) {
    if (attributes[attr] == null || attributes[attr] === '') {
      errors.push(`Missing required edge attribute: ${attr}`);
    }
  }

  if (edgeRequiresConfidence(type) && (attributes.confidence == null || attributes.confidence === '')) {
    errors.push(`Edge type ${type} requires confidence`);
  }

  if (edgeRequiresEvidence(type) && (attributes.evidence == null || attributes.evidence === '')) {
    errors.push(`Edge type ${type} requires evidence`);
  }

  for (const [attr, value] of Object.entries(attributes)) {
    const allowed = edgeAttributeValidValues(spec, attr);
    if (allowed.length > 0 && !allowed.includes(value)) {
      errors.push(`Invalid ${attr} for edge type ${type}: ${value}. Expected one of ${allowed.join(', ')}`);
    }
  }

  return errors;
}

export function validateEdgeAttributes(type, attributes = {}, options = {}) {
  const errors = edgeAttributeErrors(type, attributes);
  const result = { ok: errors.length === 0, errors };

  if (options.returnResult) return result;
  if (!result.ok) {
    const error = new Error(errors.join('; '));
    error.errors = errors;
    throw error;
  }

  return result;
}
