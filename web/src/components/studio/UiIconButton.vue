<template>
  <VTooltip
    :delay="{ show: 300, hide: 0 }"
    :container="false"
    :triggers="['hover', 'focus']"
    ><UiButton
      class="studio-icon-button"
      :class="{ danger }"
      :aria-label="label"
      :disabled="disabled"
      @click.stop="$emit('activate')"
      ><font-awesome-icon
        :icon="'fa-solid fa-' + icon"
        aria-hidden="true" /></UiButton
    ><template #popper>{{ label }}</template></VTooltip
  >
</template>
<script setup lang="ts">
defineProps<{
  label: string;
  icon: string;
  disabled?: boolean;
  danger?: boolean;
}>();
defineEmits(["activate"]);
</script>
