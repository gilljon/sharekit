import type { FieldDefinition, FieldGroupDefinition, FieldSchema, VisibleFields } from "./types.js";

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

function isGroup(field: FieldDefinition | FieldGroupDefinition): field is FieldGroupDefinition {
  return "type" in field && field.type === "group";
}

export interface FlatField {
  path: string;
  label: string;
  defaultVisible: boolean;
  requires?: string;
  group?: string;
}

/**
 * Flatten a nested FieldSchema into a list of fields with dot-paths.
 *
 * `{ analytics: { type: "group", children: { viewsOverTime: ... } } }`
 * becomes `[{ path: "analytics.viewsOverTime", group: "analytics", ... }]`
 */
export function flattenSchema(schema: FieldSchema): FlatField[] {
  const result: FlatField[] = [];
  for (const [key, field] of Object.entries(schema)) {
    if (isGroup(field)) {
      for (const [childKey, child] of Object.entries(field.children)) {
        result.push({
          path: `${key}.${childKey}`,
          label: child.label,
          defaultVisible: child.default,
          requires: child.requires,
          group: key,
        });
      }
    } else {
      result.push({
        path: key,
        label: field.label,
        defaultVisible: field.default,
        requires: field.requires,
      });
    }
  }
  return result;
}

/**
 * Build the default VisibleFields map from a schema.
 */
export function getDefaults(schema: FieldSchema): VisibleFields {
  const flat = flattenSchema(schema);
  const defaults: VisibleFields = {};
  for (const f of flat) {
    defaults[f.path] = f.defaultVisible;
  }
  return defaults;
}

/**
 * Get the groups defined in a schema, with their labels and child paths.
 */
export function getGroups(schema: FieldSchema): Array<{ key: string; label: string; children: string[] }> {
  const groups: Array<{ key: string; label: string; children: string[] }> = [];
  for (const [key, field] of Object.entries(schema)) {
    if (isGroup(field)) {
      groups.push({
        key,
        label: field.label,
        children: Object.keys(field.children).map((c) => `${key}.${c}`),
      });
    }
  }
  return groups;
}

/**
 * Resolve field dependencies: if a field `requires` another field and that
 * field is not visible, force the dependent field to be hidden.
 */
export function resolveDependencies(visibleFields: VisibleFields, schema: FieldSchema): VisibleFields {
  const flat = flattenSchema(schema);
  const resolved = { ...visibleFields };

  for (const field of flat) {
    if (field.requires && !resolved[field.requires]) {
      resolved[field.path] = false;
    }
  }

  return resolved;
}

/**
 * Given a VisibleFields map, return the list of dependency warnings.
 * E.g. "Enable 'Earnings' to include 'Earnings Breakdown'"
 */
export function getDependencyWarnings(
  visibleFields: VisibleFields,
  schema: FieldSchema,
): Array<{ field: string; requires: string; message: string }> {
  const flat = flattenSchema(schema);
  const warnings: Array<{ field: string; requires: string; message: string }> = [];

  for (const field of flat) {
    if (field.requires && visibleFields[field.path] && !visibleFields[field.requires]) {
      const requiredField = flat.find((f) => f.path === field.requires);
      const requiredLabel = requiredField?.label ?? field.requires;
      warnings.push({
        field: field.path,
        requires: field.requires,
        message: `Enable '${requiredLabel}' to include '${field.label}'`,
      });
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Data Filtering
// ---------------------------------------------------------------------------

/**
 * Filter a data object by removing top-level keys that map to hidden fields.
 *
 * For dot-path fields like `analytics.viewsOverTime`, the key `viewsOverTime`
 * is removed from the nested `analytics` object.
 */
export function filterData<T>(data: T, visibleFields: VisibleFields): T {
  if (data === null || data === undefined || typeof data !== "object") {
    return data;
  }

  const result = { ...data } as Record<string, unknown>;

  for (const [path, visible] of Object.entries(visibleFields)) {
    if (visible) continue;

    const parts = path.split(".");
    if (parts.length === 1) {
      delete result[parts[0]!];
    } else if (parts.length === 2) {
      const [parent, child] = parts as [string, string];
      if (result[parent] && typeof result[parent] === "object") {
        result[parent] = { ...(result[parent] as Record<string, unknown>) };
        delete (result[parent] as Record<string, unknown>)[child];
      }
    }
  }

  return result as T;
}

/**
 * Generate the toggle configuration for the share UI.
 * Returns top-level fields and groups with their children.
 */
export interface ToggleItem {
  path: string;
  label: string;
  defaultVisible: boolean;
  requires?: string;
  type: "field" | "group";
  children?: ToggleItem[];
}

export function getToggleConfig(schema: FieldSchema): ToggleItem[] {
  const items: ToggleItem[] = [];

  for (const [key, field] of Object.entries(schema)) {
    if (isGroup(field)) {
      const children: ToggleItem[] = Object.entries(field.children).map(([childKey, child]) => ({
        path: `${key}.${childKey}`,
        label: child.label,
        defaultVisible: child.default,
        requires: child.requires,
        type: "field" as const,
      }));
      items.push({
        path: key,
        label: field.label,
        defaultVisible: children.every((c) => c.defaultVisible),
        type: "group",
        children,
      });
    } else {
      items.push({
        path: key,
        label: field.label,
        defaultVisible: field.default,
        requires: field.requires,
        type: "field",
      });
    }
  }

  return items;
}
