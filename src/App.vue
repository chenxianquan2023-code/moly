<template>
  <a-config-provider :theme="{ algorithm: theme.defaultAlgorithm, token: { colorPrimary: '#2563EB' } }">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { theme } from 'ant-design-vue';
</script>

<style scoped>
</style>
