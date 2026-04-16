import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import VueApexCharts from 'vue3-apexcharts';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import App from './App.vue';

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#7C4DFF',
          secondary: '#448AFF',
          accent: '#FF4081',
          surface: '#1E1E2E',
          background: '#121218',
        },
      },
      light: {
        colors: {
          primary: '#6200EA',
          secondary: '#2962FF',
          accent: '#FF4081',
          surface: '#FFFFFF',
          background: '#F5F5F7',
        },
      },
    },
  },
});

createApp(App).use(vuetify).use(VueApexCharts).mount('#app');
