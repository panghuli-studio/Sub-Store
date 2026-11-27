<template>
  <SelectRoot
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
    ><SelectTrigger class="studio-select" :aria-label="label"
      ><SelectValue /><font-awesome-icon
        icon="fa-solid fa-chevron-down"
        aria-hidden="true" /></SelectTrigger
    ><SelectPortal
      ><SelectContent
        class="studio-select-content"
        position="popper"
        :side-offset="6"
        ><SelectViewport
          ><SelectItem
            v-for="(text, key) in options"
            :key="key"
            class="studio-select-item"
            :value="String(key)"
            ><SelectItemText>{{ text }}</SelectItemText></SelectItem
          ></SelectViewport
        ></SelectContent
      ></SelectPortal
    ></SelectRoot
  >
</template>
<script setup lang="ts">
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
} from "reka-ui";
defineProps<{
  modelValue?: string;
  options: Record<string, string>;
  label: string;
  disabled?: boolean;
}>();
defineEmits(["update:modelValue"]);
</script>
