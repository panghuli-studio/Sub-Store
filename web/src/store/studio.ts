import { defineStore } from "pinia";
import { ref, shallowReactive, shallowRef } from "vue";
export interface ResourceAction {
  label: string;
  icon: string;
  run: () => unknown;
  danger?: boolean;
}
export const useStudioStore = defineStore("studio", () => {
  const managementOpen = ref(false);
  const resources = shallowReactive<
    Record<
      string,
      {
        name: string;
        data?: any;
        controls?: {
          label: string;
          get: () => boolean;
          set: (value: boolean) => void;
          disabled: () => boolean;
        }[];
        actions: ResourceAction[];
      }
    >
  >({});
  const selection = shallowRef<any>(null);
  const description = ref("");
  const pageActions = shallowRef<ResourceAction[]>([]);
  const filters = shallowRef<{
    options: any;
    value: any;
    set: (value: any) => void;
  } | null>(null);
  function clear() {
    managementOpen.value = false;
    Object.keys(resources).forEach((key) => delete resources[key]);
    filters.value = null;
    selection.value = null;
    pageActions.value = [];
    description.value = "";
  }
  return {
    description,
    managementOpen,
    resources,
    filters,
    selection,
    pageActions,
    clear,
  };
});
