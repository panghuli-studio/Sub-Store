<template>
  <Primitive
    as="input"
    class="studio-input"
    :value="modelValue"
    @input="
      $emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
  />
</template>
<script setup lang="ts">
import { Primitive } from "reka-ui";
defineProps<{ modelValue?: string | number }>();
defineEmits(["update:modelValue"]);
</script>
