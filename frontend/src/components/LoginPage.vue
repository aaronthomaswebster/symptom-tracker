<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        <v-card rounded="xl" class="pa-4" variant="elevated" elevation="8">
          <v-card-title class="text-center pt-6 pb-2">
            <div class="text-h4 font-weight-bold mb-1">
              <span class="text-primary">Symptom</span> Tracker
            </div>
            <p class="text-body-2 text-medium-emphasis">
              {{ isRegistering ? 'Create an account' : 'Sign in to continue' }}
            </p>
          </v-card-title>

          <v-card-text class="px-6 pt-6">
            <v-form @submit.prevent="submit" ref="formRef">
              <v-text-field
                v-model="form.email"
                label="Email"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                prepend-inner-icon="mdi-email-outline"
                :rules="[rules.required, rules.email]"
                autofocus
              />

              <v-text-field
                v-model="form.password"
                :label="isRegistering ? 'Password (min 6 characters)' : 'Password'"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword ? 'text' : 'password'"
                :rules="isRegistering ? [rules.required, rules.minLength] : [rules.required]"
                @click:append-inner="showPassword = !showPassword"
              />

              <v-text-field
                v-if="isRegistering"
                v-model="form.confirmPassword"
                label="Confirm password"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                prepend-inner-icon="mdi-lock-check-outline"
                :type="showPassword ? 'text' : 'password'"
                :rules="[rules.required, rules.passwordMatch]"
              />

              <v-alert
                v-if="success"
                type="success"
                variant="tonal"
                rounded="lg"
                class="mb-4"
                density="compact"
              >
                {{ success }}
              </v-alert>

              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                rounded="lg"
                class="mb-4"
                density="compact"
              >
                {{ error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                block
                size="large"
                rounded="lg"
                :loading="loading"
                class="mb-2"
              >
                {{ isRegistering ? 'Create Account' : 'Sign In' }}
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center pb-6">
            <span class="text-body-2 text-medium-emphasis">
              {{ isRegistering ? 'Already have an account?' : "Don't have an account?" }}
            </span>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              @click="toggleMode"
            >
              {{ isRegistering ? 'Sign In' : 'Register' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuth } from '../composables/useAuth';

const { login, register } = useAuth();

const isRegistering = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');
const formRef = ref(null);

const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
});

const rules = {
  required: v => !!v || 'Required',
  email: v => /.+@.+\..+/.test(v) || 'Valid email required',
  minLength: v => (v && v.length >= 6) || 'Must be at least 6 characters',
  passwordMatch: v => v === form.password || 'Passwords do not match',
};

function toggleMode() {
  isRegistering.value = !isRegistering.value;
  error.value = '';
  success.value = '';
  form.password = '';
  form.confirmPassword = '';
}

async function submit() {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  error.value = '';
  success.value = '';

  try {
    if (isRegistering.value) {
      await register(form.email, form.password);
      success.value = 'Account created! Check your email to confirm your account.';
    } else {
      await login(form.email, form.password);
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>
