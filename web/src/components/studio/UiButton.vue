<template>
  <Primitive
    as="button"
    type="button"
    class="studio-button"
    :disabled="disabled"
    ><slot
  /></Primitive>
</template>
<script setup lang="ts">
import { Primitive } from "reka-ui";
defineProps<{ disabled?: boolean }>();
</script>
