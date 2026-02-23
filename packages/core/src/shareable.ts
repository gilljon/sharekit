import type {
  ShareableConfig,
  ShareableDefinition,
  ShareableDefinitionInput,
  ShareableInstance,
} from "./types.js";

export function createShareable(config: ShareableConfig): ShareableInstance {
  const definitions = new Map<string, ShareableDefinition>();

  const instance: ShareableInstance = {
    config,
    definitions,

    define<TData = unknown, TParams = Record<string, unknown>>(
      id: string,
      input: ShareableDefinitionInput<TData, TParams>,
    ): ShareableDefinition<TData, TParams> {
      if (definitions.has(id)) {
        throw new Error(`Shareable "${id}" is already defined.`);
      }

      const definition: ShareableDefinition<TData, TParams> = {
        id,
        fields: input.fields,
        paramsSchema: input.params,
        getData: input.getData,
        filterData: input.filterData,
        ogImage: input.ogImage,
      };

      definitions.set(id, definition as ShareableDefinition);
      return definition;
    },

    getDefinition(id: string) {
      return definitions.get(id);
    },
  };

  return instance;
}
