import {
  type FieldSchema,
  type ToggleItem,
  type VisibleFields,
  getDefaults,
  getDependencyWarnings,
  getToggleConfig,
  resolveDependencies,
} from "@sharekit/core";
import { useCallback, useMemo, useState } from "react";

export interface DependencyWarning {
  field: string;
  requires: string;
  message: string;
}

export interface UseToggleFieldsReturn {
  visibleFields: VisibleFields;
  setFieldVisible: (path: string, visible: boolean) => void;
  setAllFieldsVisible: (visible: boolean) => void;
  toggleConfig: ToggleItem[];
  warnings: DependencyWarning[];
}

/**
 * Standalone hook for managing privacy field toggle state.
 *
 * Automatically resolves dependencies on every toggle and derives
 * toggle configuration and warnings reactively from the schema.
 * No provider wrapping required.
 */
export function useToggleFields(schema: FieldSchema): UseToggleFieldsReturn {
  const [visibleFields, setVisibleFieldsState] = useState<VisibleFields>(() =>
    resolveDependencies(getDefaults(schema), schema),
  );

  const toggleConfig = useMemo(() => getToggleConfig(schema), [schema]);

  const warnings = useMemo(
    () => getDependencyWarnings(visibleFields, schema),
    [visibleFields, schema],
  );

  const setFieldVisible = useCallback(
    (path: string, visible: boolean) => {
      setVisibleFieldsState((prev) => {
        const next = { ...prev, [path]: visible };
        return resolveDependencies(next, schema);
      });
    },
    [schema],
  );

  const setAllFieldsVisible = useCallback(
    (visible: boolean) => {
      const defaults = getDefaults(schema);
      const updated: VisibleFields = {};
      for (const key of Object.keys(defaults)) {
        updated[key] = visible;
      }
      setVisibleFieldsState(resolveDependencies(updated, schema));
    },
    [schema],
  );

  return { visibleFields, setFieldVisible, setAllFieldsVisible, toggleConfig, warnings };
}
