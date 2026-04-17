<template>
  <v-container fluid class="pa-4 pa-md-8">
    <v-row align="center" class="mb-6">
      <v-col>
        <h2 class="text-h6 text-medium-emphasis mb-1">Reports</h2>
        <p class="text-body-2 text-disabled">Insights into your symptom patterns</p>
      </v-col>
      <v-col cols="auto">
        <v-btn-toggle v-model="days" mandatory variant="outlined" density="compact" rounded="lg" color="primary">
          <v-btn :value="7">1W</v-btn>
          <v-btn :value="14">2W</v-btn>
          <v-btn :value="30">1M</v-btn>
          <v-btn :value="90">3M</v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <v-row v-if="loadingCount > 0" justify="center" class="my-12">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-row>

    <template v-else-if="hasData">
      <v-row>
        <v-col cols="12" md="6">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pb-2">Symptom Frequency</v-card-title>
            <apexchart
              type="bar"
              height="320"
              :options="frequencyOptions"
              :series="frequencySeries"
            />
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pb-2">Daily Symptom Count</v-card-title>
            <apexchart
              type="area"
              height="320"
              :options="dailyTotalOptions"
              :series="dailyTotalSeries"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pb-2">Symptoms Over Time</v-card-title>
            <apexchart
              type="heatmap"
              height="350"
              :options="heatmapOptions"
              :series="heatmapSeries"
            />
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pb-2">Time of Day</v-card-title>
            <apexchart
              type="radar"
              height="350"
              :options="hourlyOptions"
              :series="hourlySeries"
            />
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="severityData.length">
        <v-col cols="12">
          <v-card variant="tonal" rounded="xl" class="pa-4">
            <v-card-title class="text-subtitle-1 font-weight-bold pb-2">Average Severity Over Time</v-card-title>
            <apexchart
              type="line"
              height="320"
              :options="severityOptions"
              :series="severitySeries"
            />
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-row v-else>
      <v-col>
        <v-card variant="tonal" rounded="xl" class="pa-8 text-center">
          <v-icon size="48" color="disabled" class="mb-4">mdi-chart-box-outline</v-icon>
          <p class="text-body-1 text-disabled">No data to display for the selected period. Log some symptoms to see your reports.</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useTheme } from 'vuetify';
import { supabase } from '../lib/supabase';

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const days = ref(30);
const loadingCount = ref(0);
const frequencyData = ref([]);
const timelineData = ref([]);
const severityData = ref([]);
const hourlyData = ref([]);
const dailyTotalData = ref([]);

const hasData = computed(() => frequencyData.value.length > 0);

const chartFg = computed(() => isDark.value ? '#ccc' : '#555');
const gridColor = computed(() => isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');
const chartBg = 'transparent';

const palette = [
  '#7C4DFF', '#448AFF', '#FF4081', '#69F0AE', '#FFD740',
  '#FF6E40', '#40C4FF', '#B388FF', '#EA80FC', '#84FFFF',
  '#CCFF90', '#FF9E80', '#A7FFEB', '#F4FF81', '#FF80AB',
];

function baseChartOpts(extra = {}) {
  return {
    chart: { background: chartBg, toolbar: { show: false }, fontFamily: 'inherit', ...extra },
    theme: { mode: isDark.value ? 'dark' : 'light' },
    colors: palette,
    grid: { borderColor: gridColor.value },
    xaxis: { labels: { style: { colors: chartFg.value } } },
    yaxis: { labels: { style: { colors: chartFg.value } } },
    tooltip: { theme: isDark.value ? 'dark' : 'light' },
    legend: { labels: { colors: chartFg.value } },
  };
}

const frequencyOptions = computed(() => ({
  ...baseChartOpts(),
  chart: { ...baseChartOpts().chart, type: 'bar' },
  plotOptions: { bar: { borderRadius: 6, horizontal: true } },
  xaxis: {
    categories: frequencyData.value.map(r => `${r.emoji} ${r.name}`),
    labels: { style: { colors: chartFg.value } },
  },
  yaxis: { labels: { style: { colors: chartFg.value, fontSize: '13px' } } },
  dataLabels: { enabled: true, style: { fontSize: '12px' } },
}));

const frequencySeries = computed(() => [{
  name: 'Occurrences',
  data: frequencyData.value.map(r => r.count),
}]);

const dailyTotalOptions = computed(() => ({
  ...baseChartOpts(),
  chart: { ...baseChartOpts().chart, type: 'area', sparkline: { enabled: false } },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
  xaxis: {
    type: 'datetime',
    categories: dailyTotalData.value.map(r => r.date),
    labels: { style: { colors: chartFg.value }, datetimeUTC: false },
  },
  yaxis: { min: 0, labels: { style: { colors: chartFg.value } }, forceNiceScale: true },
  dataLabels: { enabled: false },
}));

const dailyTotalSeries = computed(() => [{
  name: 'Total Symptoms',
  data: dailyTotalData.value.map(r => r.count),
}]);

const heatmapOptions = computed(() => {
  const dates = [...new Set(timelineData.value.map(r => r.date))].sort();
  return {
    ...baseChartOpts(),
    chart: { ...baseChartOpts().chart, type: 'heatmap' },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 4,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: isDark.value ? '#1E1E2E' : '#F5F5F7', name: 'None' },
            { from: 1, to: 2, color: '#448AFF', name: '1-2' },
            { from: 3, to: 5, color: '#7C4DFF', name: '3-5' },
            { from: 6, to: 100, color: '#FF4081', name: '6+' },
          ],
        },
      },
    },
    xaxis: {
      type: 'category',
      categories: dates.map(d => {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }),
      labels: { style: { colors: chartFg.value, fontSize: '10px' }, rotateAlways: dates.length > 14, rotate: -45 },
    },
    yaxis: { labels: { style: { colors: chartFg.value } } },
    dataLabels: { enabled: false },
  };
});

const heatmapSeries = computed(() => {
  const dates = [...new Set(timelineData.value.map(r => r.date))].sort();
  const names = [...new Set(timelineData.value.map(r => r.name))];
  const lookup = {};
  timelineData.value.forEach(r => { lookup[`${r.name}|${r.date}`] = r.count; });
  return names.map(name => ({
    name: name,
    data: dates.map(date => ({ x: date, y: lookup[`${name}|${date}`] || 0 })),
  }));
});

const hourlyLabels = computed(() => {
  const labels = [];
  for (let h = 0; h < 24; h++) {
    const ampm = h < 12 ? 'AM' : 'PM';
    const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
    labels.push(`${hr}${ampm}`);
  }
  return labels;
});

const hourlyOptions = computed(() => ({
  ...baseChartOpts(),
  chart: { ...baseChartOpts().chart, type: 'radar' },
  xaxis: {
    categories: hourlyLabels.value,
    labels: { style: { colors: chartFg.value, fontSize: '10px' } },
  },
  yaxis: { show: false },
  stroke: { width: 2 },
  fill: { opacity: 0.25 },
  markers: { size: 3 },
  dataLabels: { enabled: false },
}));

const hourlySeries = computed(() => {
  const counts = new Array(24).fill(0);
  hourlyData.value.forEach(r => { counts[r.hour] = r.count; });
  return [{ name: 'Symptoms', data: counts }];
});

const severityOptions = computed(() => {
  const dates = [...new Set(severityData.value.map(r => r.date))].sort();
  return {
    ...baseChartOpts(),
    chart: { ...baseChartOpts().chart, type: 'line' },
    stroke: { curve: 'smooth', width: 2 },
    markers: { size: 4 },
    xaxis: {
      type: 'datetime',
      categories: dates,
      labels: { style: { colors: chartFg.value }, datetimeUTC: false },
    },
    yaxis: { min: 1, max: 5, tickAmount: 4, labels: { style: { colors: chartFg.value } } },
    dataLabels: { enabled: false },
  };
});

const severitySeries = computed(() => {
  const dates = [...new Set(severityData.value.map(r => r.date))].sort();
  const names = [...new Set(severityData.value.map(r => r.name))];
  const lookup = {};
  severityData.value.forEach(r => { lookup[`${r.name}|${r.date}`] = r.avg_severity; });
  return names.map(name => ({
    name,
    data: dates.map(date => lookup[`${name}|${date}`] ?? null),
  }));
});

async function fetchReport(fnName, target) {
  loadingCount.value++;
  try {
    const { data, error } = await supabase.rpc(fnName, { p_days: days.value });
    if (error) throw error;
    target.value = data;
  } catch (e) {
    console.error(`Failed to load ${fnName}:`, e);
    target.value = [];
  } finally {
    loadingCount.value--;
  }
}

function loadAll() {
  fetchReport('report_frequency', frequencyData);
  fetchReport('report_timeline', timelineData);
  fetchReport('report_severity', severityData);
  fetchReport('report_hourly', hourlyData);
  fetchReport('report_daily_total', dailyTotalData);
}

watch(days, loadAll, { immediate: true });
</script>
