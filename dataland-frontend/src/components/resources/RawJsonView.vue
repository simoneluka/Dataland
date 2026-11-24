<template>
  <pre class="raw-json m-0 surface-ground p-2 border-round" data-test="raw-json"><code>{{ formattedJson }}</code></pre>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ value: unknown }>();
const formattedJson = computed(() => JSON.stringify(props.value, null, 2));
</script>

<style scoped>
.raw-json {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-width: 100%;
}
</style>
