<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    scrollable
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center pt-5 px-6">
        <v-icon class="mr-2">mdi-pencil-outline</v-icon>
        <span class="text-h6 font-weight-bold">Manage Symptoms</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="px-6 pt-4 pb-0">
        <v-row dense class="mb-4">
          <v-col>
            <v-text-field
              v-model="newName"
              label="New symptom name"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              hide-details
              @keyup.enter="addSymptom"
            >
              <template v-slot:prepend-inner>
                <span
                  class="emoji-pick cursor-pointer"
                  @click="showPicker = !showPicker"
                  :title="'Click to change emoji'"
                >{{ newEmoji }}</span>
              </template>
              <template v-slot:append-inner>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  :disabled="!newName.trim()"
                  @click="addSymptom"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
        </v-row>

        <v-dialog v-model="showPicker" max-width="420">
          <v-card rounded="xl" class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pb-2">Pick an Emoji</v-card-title>
            <v-tabs v-model="emojiTab" color="primary" density="compact" center-active show-arrows class="mb-2">
              <v-tab v-for="group in emojiGroups" :key="group.label" :value="group.label">
                <span class="text-body-1 mr-1">{{ group.icon }}</span>
                <span class="text-caption">{{ group.label }}</span>
              </v-tab>
            </v-tabs>
            <v-window v-model="emojiTab">
              <v-window-item v-for="group in emojiGroups" :key="group.label" :value="group.label">
                <v-card-text class="d-flex flex-wrap ga-1 justify-center" style="max-height: 280px; overflow-y: auto;">
                  <v-btn
                    v-for="e in group.emojis"
                    :key="e"
                    variant="text"
                    size="large"
                    min-width="48"
                    class="emoji-option"
                    @click="newEmoji = e; showPicker = false"
                  >
                    {{ e }}
                  </v-btn>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-card>
        </v-dialog>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          rounded="lg"
          density="compact"
          class="mb-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <v-tabs v-model="tab" color="primary" density="compact" class="mb-2">
          <v-tab value="active">Active ({{ activeSymptoms.length }})</v-tab>
          <v-tab value="archived">Archived ({{ archivedSymptoms.length }})</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="active">
            <v-list v-if="activeSymptoms.length" density="compact" class="py-0">
              <v-list-item v-for="s in activeSymptoms" :key="s.id" class="px-0">
                <template v-slot:prepend>
                  <span class="emoji-list mr-3">{{ s.emoji }}</span>
                </template>
                <v-list-item-title class="font-weight-medium">{{ s.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-tooltip text="Archive" location="top">
                    <template v-slot:activator="{ props: tp }">
                      <v-btn
                        v-bind="tp"
                        icon
                        variant="text"
                        size="small"
                        @click="archiveSymptom(s)"
                      >
                        <v-icon size="18">mdi-archive-arrow-down-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip :text="s.has_logs ? 'Has logs — archive instead' : 'Delete'" location="top">
                    <template v-slot:activator="{ props: tp }">
                      <v-btn
                        v-bind="tp"
                        icon
                        variant="text"
                        size="small"
                        :disabled="s.has_logs"
                        @click="deleteSymptom(s)"
                      >
                        <v-icon size="18" :color="s.has_logs ? 'disabled' : 'error'">mdi-delete-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-disabled text-center py-6">No active symptoms</p>
          </v-window-item>

          <v-window-item value="archived">
            <v-list v-if="archivedSymptoms.length" density="compact" class="py-0">
              <v-list-item v-for="s in archivedSymptoms" :key="s.id" class="px-0">
                <template v-slot:prepend>
                  <span class="emoji-list mr-3 opacity-50">{{ s.emoji }}</span>
                </template>
                <v-list-item-title class="font-weight-medium text-medium-emphasis">{{ s.name }}</v-list-item-title>
                <template v-slot:append>
                  <v-tooltip text="Restore" location="top">
                    <template v-slot:activator="{ props: tp }">
                      <v-btn
                        v-bind="tp"
                        icon
                        variant="text"
                        size="small"
                        color="primary"
                        @click="unarchiveSymptom(s)"
                      >
                        <v-icon size="18">mdi-archive-arrow-up-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                  <v-tooltip :text="s.has_logs ? 'Has logs — cannot delete' : 'Delete'" location="top">
                    <template v-slot:activator="{ props: tp }">
                      <v-btn
                        v-bind="tp"
                        icon
                        variant="text"
                        size="small"
                        :disabled="s.has_logs"
                        @click="deleteSymptom(s)"
                      >
                        <v-icon size="18" :color="s.has_logs ? 'disabled' : 'error'">mdi-delete-outline</v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-disabled text-center py-6">No archived symptoms</p>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer />
        <v-btn variant="text" rounded="lg" @click="close">Done</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { supabase } from '../lib/supabase';

const props = defineProps({ modelValue: Boolean });
const emit = defineEmits(['update:modelValue', 'changed']);

const allSymptoms = ref([]);
const tab = ref('active');
const newName = ref('');
const newEmoji = ref('😵‍💫');
const showPicker = ref(false);
const emojiTab = ref('Faces');
const error = ref('');

const emojiGroups = [
  {
    label: 'Faces',
    icon: '😀',
    emojis: [
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
      '😇','🥰','😍','🤩','😘','😋','😛','😜','🤪','😝',
      '🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑',
      '😶','🫥','😏','😒','🙄','😬','😮‍💨','🤥','🫠','😌',
      '😔','😪','🤤','😴','🫨',
    ],
  },
  {
    label: 'Unwell',
    icon: '🤒',
    emojis: [
      '😷','🤒','🤕','🤢','🤮','🥴','😵','😵‍💫','🤯','🥱',
      '😤','😡','🤬','😈','💀','☠️','😰','😥','😢','😭',
      '😱','😖','😣','😞','😓','😩','😫','🥺','😿','🙀',
      '😮‍💨','🫣','🫢','😧','😦','😨','😮','😯','😲','🥶',
      '🥵','😳','🤧',
    ],
  },
  {
    label: 'Body',
    icon: '👁️',
    emojis: [
      '👁️','👀','👅','👄','🫦','👃','👂','🦻','🦶','🦵',
      '🦿','🦾','💪','🧠','🫀','🫁','🦴','🦷','👣','🩸',
      '🧬','🦠',
    ],
  },
  {
    label: 'Medical',
    icon: '🏥',
    emojis: [
      '💊','🩹','🩺','🩻','🩼','🩱','🌡️','💉','🧪','🧫',
      '🧬','🔬','🏥','🚑','🩸','❤️','🧡','💛','💚','💙',
      '💜','🖤','🤍','🤎','❤️‍🩹','❤️‍🔥','💔','💓','💗','💖',
      '💘','💝','♿','⚕️',
    ],
  },
  {
    label: 'Hands',
    icon: '🤲',
    emojis: [
      '👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','🫷',
      '🫸','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙',
      '👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊',
      '👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏',
      '✍️','💅','🤳','💪',
    ],
  },
  {
    label: 'People',
    icon: '🧑',
    emojis: [
      '👶','🧒','👦','👧','🧑','👱','👨','👩','🧔','🧓',
      '👴','👵','🙍','🙎','🙅','🙆','💁','🙋','🧏','🙇',
      '🤦','🤷','💆','💇','🚶','🧎','🏃','💃','🕺','🧖',
      '🧗','🏄','🚴','🤸','🤼','🤽','🤾','🤺','⛹️','🏋️',
      '🧘','🛀','🛌',
    ],
  },
  {
    label: 'Symbols',
    icon: '⚡',
    emojis: [
      '💤','💫','💥','💦','💨','🌫️','🌀','⚡','🔥','✨',
      '⭐','🌟','💢','❗','❓','‼️','⁉️','🚫','⛔','🆘',
      '⚠️','🔴','🟠','🟡','🟢',
    ],
  },
];

const activeSymptoms = computed(() => allSymptoms.value.filter(s => !s.archived));
const archivedSymptoms = computed(() => allSymptoms.value.filter(s => s.archived));

async function loadSymptoms() {
  try {
    const { data, error } = await supabase
      .from('symptoms')
      .select('*, symptom_logs(count)')
      .order('display_order')
      .order('id');
    if (error) throw error;
    allSymptoms.value = data.map(s => ({
      ...s,
      has_logs: s.symptom_logs?.[0]?.count > 0,
    }));
  } catch (e) {
    console.error('Failed to load symptoms:', e);
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    error.value = '';
    loadSymptoms();
  }
});

async function addSymptom() {
  const name = newName.value.trim();
  if (!name) return;
  error.value = '';
  try {
    const { error: err } = await supabase
      .from('symptoms')
      .insert({ name, emoji: newEmoji.value });
    if (err) {
      if (err.code === '23505') {
        error.value = 'You already have a symptom with that name';
      } else {
        error.value = err.message || 'Failed to add symptom';
      }
      return;
    }
    newName.value = '';
    newEmoji.value = '🩺';
    await loadSymptoms();
    emit('changed');
  } catch (e) {
    error.value = 'Failed to add symptom';
  }
}

async function archiveSymptom(s) {
  try {
    const { error: err } = await supabase
      .from('symptoms')
      .update({ archived: true })
      .eq('id', s.id);
    if (err) throw err;
    await loadSymptoms();
    emit('changed');
  } catch (e) {
    error.value = 'Failed to archive symptom';
  }
}

async function unarchiveSymptom(s) {
  try {
    const { error: err } = await supabase
      .from('symptoms')
      .update({ archived: false })
      .eq('id', s.id);
    if (err) throw err;
    await loadSymptoms();
    emit('changed');
  } catch (e) {
    error.value = 'Failed to restore symptom';
  }
}

async function deleteSymptom(s) {
  error.value = '';
  try {
    const { error: err } = await supabase
      .from('symptoms')
      .delete()
      .eq('id', s.id);
    if (err) {
      error.value = err.message || 'Failed to delete symptom';
      return;
    }
    await loadSymptoms();
    emit('changed');
  } catch (e) {
    error.value = 'Failed to delete symptom';
  }
}

function close() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
.emoji-list {
  font-size: 1.5rem;
  line-height: 1;
}
.emoji-pick {
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}
.emoji-option {
  font-size: 1.4rem;
}
.cursor-pointer {
  cursor: pointer;
}
</style>
