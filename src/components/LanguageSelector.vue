<template>
  <el-select v-model="current" size="small" @change="changeLanguage" class="language-selector">
    <el-option
      v-for="opt in options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';

const { t, i18n } = useTranslation();
const current = ref(i18n.language);

const options = computed(() => [
  { value: 'en', label: t('language.en') },
  { value: 'fr', label: t('language.fr') },
  { value: 'es', label: t('language.es') }
]);

function changeLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
}
</script>

<style scoped>
.language-selector {
  width: 120px;
}
</style>
