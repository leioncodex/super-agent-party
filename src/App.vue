<template>
  <el-config-provider :locale="elementLocale">
    <div class="p-4">
      <LanguageSelector class="mb-4" />
      <AgentCreator />
    </div>
  </el-config-provider>
</template>

<script setup>
import { elementLocale } from './plugins/i18n';
import LanguageSelector from './components/LanguageSelector.vue';
import AgentCreator from './components/AgentCreator.vue';
</script>
