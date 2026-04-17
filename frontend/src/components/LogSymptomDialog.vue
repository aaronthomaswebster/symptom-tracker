<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="520"
    persistent
  >
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="d-flex align-center ga-3 pt-4 px-6">
        <span class="emoji-dialog">{{ symptom?.emoji }}</span>
        <span class="text-h6 font-weight-bold">Log {{ symptom?.name }}</span>
      </v-card-title>

      <v-card-text class="px-6 pt-4">
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.date"
              label="Date"
              type="date"
              variant="outlined"
              density="comfortable"
              rounded="lg"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.time"
              label="Time"
              type="time"
              variant="outlined"
              density="comfortable"
              rounded="lg"
            />
          </v-col>
        </v-row>

        <v-slider
          v-model="form.severity"
          label="Severity"
          :min="1"
          :max="5"
          :step="1"
          :ticks="severityLabels"
          show-ticks="always"
          tick-size="4"
          :color="severityColor"
          class="mt-2"
          thumb-label
        />

        <v-text-field
          v-model="form.activity"
          label="What were you doing?"
          placeholder="e.g. Working at desk, exercising, resting..."
          variant="outlined"
          density="comfortable"
          rounded="lg"
          prepend-inner-icon="mdi-run"
          class="mt-2"
        />

        <v-textarea
          v-model="form.notes"
          label="Additional notes"
          placeholder="Any extra details..."
          variant="outlined"
          density="comfortable"
          rounded="lg"
          rows="3"
          auto-grow
          prepend-inner-icon="mdi-note-text-outline"
        />
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn
          variant="text"
          rounded="lg"
          @click="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          rounded="lg"
          :loading="saving"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue';
import { supabase } from '../lib/supabase';

const props = defineProps({
  modelValue: Boolean,
  symptom: Object,
});
const emit = defineEmits(['update:modelValue', 'saved']);

const saving = ref(false);

const form = reactive({
  date: '',
  time: '',
  severity: 3,
  activity: '',
  notes: '',
});

const severityLabels = {
  1: 'Mild',
  2: 'Low',
  3: 'Med',
  4: 'High',
  5: 'Severe',
};

const severityColor = computed(() => {
  const colors = ['green', 'light-green', 'orange', 'deep-orange', 'red'];
  return colors[Math.min(form.severity - 1, 4)];
});

watch(() => props.modelValue, (open) => {
  if (open) {
    const now = new Date();
    form.date = now.toISOString().slice(0, 10);
    form.time = now.toTimeString().slice(0, 5);
    form.severity = 3;
    form.activity = '';
    form.notes = '';
  }
});

function cancel() {
  emit('update:modelValue', false);
}

async function save() {
  if (!props.symptom) return;
  saving.value = true;

  const occurredAt = new Date(`${form.date}T${form.time}`).toISOString();

  try {
    const { error } = await supabase.from('symptom_logs').insert({
      symptom_id: props.symptom.id,
      occurred_at: occurredAt,
      severity: form.severity,
      activity: form.activity || null,
      notes: form.notes || null,
    });

    if (error) throw error;

    emit('update:modelValue', false);
    emit('saved');
  } catch (e) {
    console.error('Failed to save log:', e);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.emoji-dialog {
  font-size: 2rem;
  line-height: 1;
}
</style>
