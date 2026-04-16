<template>
  <v-container fluid class="pa-4 pa-md-8">
    <v-row class="mb-6">
      <v-col>
        <h2 class="text-h6 text-medium-emphasis mb-1">History</h2>
        <p class="text-body-2 text-disabled">Your logged symptoms</p>
      </v-col>
    </v-row>

    <v-row v-if="loading" justify="center" class="my-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-row>

    <v-row v-else-if="logs.length === 0">
      <v-col>
        <v-card variant="tonal" rounded="xl" class="pa-8 text-center">
          <v-icon size="48" color="disabled" class="mb-4">mdi-clipboard-text-outline</v-icon>
          <p class="text-body-1 text-disabled">No symptoms logged yet. Tap a symptom on the Home page to get started.</p>
        </v-card>
      </v-col>
    </v-row>

    <template v-else>
      <v-row>
        <v-col cols="12">
          <v-card variant="tonal" rounded="xl">
            <v-list lines="three">
              <v-list-item
                v-for="log in logs"
                :key="log.id"
              >
                <template v-slot:prepend>
                  <span class="emoji-small mr-3">{{ log.emoji }}</span>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ log.symptom_name }}
                  <v-chip
                    v-if="log.severity"
                    size="x-small"
                    :color="severityColor(log.severity)"
                    class="ml-2"
                    label
                  >
                    {{ log.severity }}/5
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(log.occurred_at) }}
                  <span v-if="log.activity" class="text-disabled"> &mdash; {{ log.activity }}</span>
                </v-list-item-subtitle>
                <v-list-item-subtitle v-if="log.notes" class="mt-1 text-disabled text-caption">
                  {{ log.notes }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn icon variant="text" size="small" @click.stop="deleteLog(log.id)">
                    <v-icon size="18" color="error">mdi-delete-outline</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="hasMore" justify="center" class="mt-4">
        <v-btn
          variant="tonal"
          rounded="lg"
          :loading="loadingMore"
          @click="loadMore"
        >
          Load more
        </v-btn>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useAuth } from '../composables/useAuth';

const PAGE_SIZE = 30;

const { apiFetch } = useAuth();

const logs = ref([]);
const loading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(false);

function severityColor(level) {
  const colors = ['green', 'light-green', 'orange', 'deep-orange', 'red'];
  return colors[Math.min(level - 1, 4)];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

async function fetchLogs(offset = 0) {
  const res = await apiFetch(`/api/logs?limit=${PAGE_SIZE + 1}&offset=${offset}`);
  const data = await res.json();
  const more = data.length > PAGE_SIZE;
  return { rows: data.slice(0, PAGE_SIZE), more };
}

async function loadInitial() {
  loading.value = true;
  try {
    const { rows, more } = await fetchLogs(0);
    logs.value = rows;
    hasMore.value = more;
  } catch (e) {
    console.error('Failed to load logs:', e);
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  loadingMore.value = true;
  try {
    const { rows, more } = await fetchLogs(logs.value.length);
    logs.value.push(...rows);
    hasMore.value = more;
  } catch (e) {
    console.error('Failed to load more logs:', e);
  } finally {
    loadingMore.value = false;
  }
}

async function deleteLog(id) {
  try {
    await apiFetch(`/api/logs/${id}`, { method: 'DELETE' });
    logs.value = logs.value.filter(l => l.id !== id);
  } catch (e) {
    console.error('Failed to delete log:', e);
  }
}

defineExpose({ refresh: loadInitial });

watch(() => true, loadInitial, { immediate: true });
</script>

<style scoped>
.emoji-small {
  font-size: 1.75rem;
  line-height: 1;
}
</style>
