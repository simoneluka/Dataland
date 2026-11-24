<template>
  <RouterLink
    :to="{ name: 'Framework Documentation Details', params: { frameworkId }, query: { dataPoint: path } }"
    :aria-label="`View documentation for ${label}`"
    v-tooltip.top="description || `View documentation for ${label}`"
    class="inline-flex align-items-center text-color-secondary no-underline ml-2"
    data-test="data-point-documentation-link"
    @click.stop
  >
    <i class="pi pi-info-circle text-sm" aria-hidden="true" />
  </RouterLink>
</template>

<script setup lang="ts">
import Tooltip from 'primevue/tooltip';

defineProps<{ frameworkId: string; path: string; label: string; description?: string }>();
const vTooltip = Tooltip;
</script>
