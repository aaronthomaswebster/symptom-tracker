import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';

const session = ref(null);
const user = computed(() => session.value?.user ?? null);
const isAuthenticated = computed(() => !!session.value);

supabase.auth.getSession().then(({ data: { session: s } }) => {
  session.value = s;
});

supabase.auth.onAuthStateChange((_event, s) => {
  session.value = s;
});

async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function register(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
}

async function logout() {
  await supabase.auth.signOut();
}

export function useAuth() {
  return { session, user, isAuthenticated, login, register, logout };
}
