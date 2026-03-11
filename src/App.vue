<template>
  <a-config-provider :theme="{ algorithm: theme.darkAlgorithm, token: { colorPrimary: '#1677ff' } }">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { theme } from 'ant-design-vue';
</script>

<style scoped>
</style>
