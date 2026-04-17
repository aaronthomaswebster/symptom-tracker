<template>
  <v-app>
    <template v-if="isAuthenticated">
      <v-app-bar flat color="surface" elevation="1">
        <v-app-bar-title>
          <span class="text-h5 font-weight-bold">
            <span class="text-primary">Symptom</span> Tracker
          </span>
        </v-app-bar-title>
        <template v-slot:append>
          <span class="text-body-2 text-medium-emphasis mr-2 d-none d-sm-inline">
            {{ user?.email }}
          </span>
          <v-btn icon @click="toggleTheme">
            <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          </v-btn>
          <v-btn icon @click="handleLogout">
            <v-icon>mdi-logout</v-icon>
          </v-btn>
        </template>
      </v-app-bar>

      <v-main>
        <template v-if="currentPage === 'home'">
          <v-container fluid class="pa-4 pa-md-8">
            <v-row class="mb-6" align="center">
              <v-col>
                <h2 class="text-h6 text-medium-emphasis mb-1">How are you feeling?</h2>
                <p class="text-body-2 text-disabled">Tap a symptom to log it</p>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  variant="tonal"
                  rounded="lg"
                  size="small"
                  prepend-icon="mdi-pencil-outline"
                  @click="manageOpen = true"
                >
                  Manage
                </v-btn>
              </v-col>
            </v-row>

            <v-row v-if="loading" justify="center" class="my-12">
              <v-progress-circular indeterminate color="primary" size="48" />
            </v-row>

            <v-row v-else>
              <v-col
                v-for="symptom in symptoms"
                :key="symptom.id"
                cols="6" sm="4" md="3" lg="2"
              >
                <v-card
                  class="symptom-card text-center pa-4"
                  variant="tonal"
                  rounded="xl"
                  hover
                  @click="openLog(symptom)"
                >
                  <div class="emoji-display mb-2">{{ symptom.emoji }}</div>
                  <v-card-text class="pa-0 text-body-2 font-weight-medium">
                    {{ symptom.name }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </template>

        <HistoryPage v-else-if="currentPage === 'history'" ref="historyRef" />
        <ReportsPage v-else-if="currentPage === 'reports'" />
      </v-main>

      <v-bottom-navigation v-model="currentPage" grow color="primary">
        <v-btn value="home">
          <v-icon>mdi-home-outline</v-icon>
          <span>Home</span>
        </v-btn>
        <v-btn value="history">
          <v-icon>mdi-clipboard-text-clock-outline</v-icon>
          <span>History</span>
        </v-btn>
        <v-btn value="reports">
          <v-icon>mdi-chart-bar</v-icon>
          <span>Reports</span>
        </v-btn>
      </v-bottom-navigation>

      <LogSymptomDialog
        v-model="dialogOpen"
        :symptom="selectedSymptom"
        @saved="onLogSaved"
      />

      <ManageSymptomsDialog
        v-model="manageOpen"
        @changed="fetchSymptoms"
      />
    </template>

    <LoginPage v-else />

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000" rounded="pill">
      {{ snackbarText }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useTheme } from 'vuetify';
import { useAuth } from './composables/useAuth';
import { supabase } from './lib/supabase';
import LogSymptomDialog from './components/LogSymptomDialog.vue';
import ManageSymptomsDialog from './components/ManageSymptomsDialog.vue';
import HistoryPage from './components/HistoryPage.vue';
import ReportsPage from './components/ReportsPage.vue';
import LoginPage from './components/LoginPage.vue';

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);
const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark';
};

const { isAuthenticated, user, logout } = useAuth();

const currentPage = ref('home');
const symptoms = ref([]);
const loading = ref(true);
const dialogOpen = ref(false);
const manageOpen = ref(false);
const selectedSymptom = ref(null);
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
const historyRef = ref(null);

function openLog(symptom) {
  selectedSymptom.value = symptom;
  dialogOpen.value = true;
}

async function fetchSymptoms() {
  try {
    const { data, error } = await supabase
      .from('symptoms')
      .select('*')
      .eq('archived', false)
      .order('display_order')
      .order('id');
    if (error) throw error;
    symptoms.value = data;
  } catch (e) {
    console.error('Failed to load symptoms:', e);
  } finally {
    loading.value = false;
  }
}

function onLogSaved() {
  historyRef.value?.refresh();
  snackbarText.value = 'Symptom logged!';
  snackbarColor.value = 'success';
  snackbar.value = true;
}

function handleLogout() {
  logout();
  currentPage.value = 'home';
  symptoms.value = [];
  loading.value = true;
}

watch(isAuthenticated, (loggedIn) => {
  if (loggedIn) {
    loading.value = true;
    fetchSymptoms();
  }
}, { immediate: true });
</script>

<style>
.emoji-display {
  font-size: 3rem;
  line-height: 1;
}
.symptom-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.symptom-card:hover {
  transform: translateY(-4px);
}
</style>
