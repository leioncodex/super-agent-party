<template>
  <div class="p-4 border rounded-lg bg-gray-50">
    <h2 class="text-xl font-bold mb-3">{{ t('agentCreator.title') }}</h2>
    <el-button type="primary" :loading="isCreating" @click="createAgent">
      {{ isCreating ? t('agentCreator.creating') : t('agentCreator.createButton') }}
    </el-button>
    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="agent in agents" :key="agent.name" class="border p-4 rounded-lg">
        <h3 class="font-bold">{{ agent.name }}</h3>
        <p class="text-sm text-gray-600">{{ t('agentCreator.role') }} : {{ agent.role }}</p>
        <p class="text-xs">{{ t('agentCreator.status') }} : {{ agent.status }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { invoke } from '@tauri-apps/api/tauri';
import { useTranslation } from 'i18next-vue';

interface Agent {
  name: string;
  role: string;
  status: string;
}

const { t } = useTranslation();
const agents = ref<Agent[]>([]);
const isCreating = ref(false);

async function loadAgents() {
  const list = await invoke<Agent[]>('list_agents');
  agents.value = list;
}

onMounted(loadAgents);

async function createAgent() {
  isCreating.value = true;
  const name = prompt(t('agentCreator.namePrompt') as string);
  if (!name) {
    isCreating.value = false;
    return;
  }
  try {
    await invoke('create_agent', { name });
    await loadAgents();
  } catch (e) {
    console.error('createAgent error', e);
  } finally {
    isCreating.value = false;
  }
}
</script>
