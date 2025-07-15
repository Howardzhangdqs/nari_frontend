<template>
  <v-card class="mt-6 mx-auto overflow-visible" max-width="400">
    <v-sheet class="v-sheet--offset mx-auto" :color="props.finished ? 'success' : 'primary'" elevation="8"
      max-width="calc(100% - 16px)" rounded="lg" style="padding: 0 10px 10px 10px">
      <Line :data="chartData" :options="chartOptions" />
    </v-sheet>

    <v-card-text class="pt-0">
      <div class="subheading" style="margin-top: -6px">
        模型：{{ props.model }}<br />
        <span v-if="props.dataset">数据集：{{ props.dataset }}</span><br />
        <span v-if="props.accuracy">精度：{{ (props.accuracy * 100).toFixed(2) }}%</span>
      </div>
      <v-divider class="my-2"></v-divider>
      <div class="mb-1" style="display: flex; flex-direction: row; align-items: center;">
        <v-icon class="me-2 text-caption text-grey" size="small">
          mdi-clock
        </v-icon>
        <span class="text-caption text-grey" style="line-height: 15px;">
          训练用时 {{ time_string }}
          <span v-if="props.progress && props.time && !props.finished">
            <br />预计还需 {{ time_number_2_string(props.time / props.progress * 100) }}</span>
        </span>
      </div>
      <v-progress-linear :model-value="props.progress" v-if="props.progress && !props.finished"></v-progress-linear>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs';

const props = defineProps<{
  model: string;
  accuracy?: number;
  dataset?: string; // 数据集名称
  time?: number; // 训练时间，单位秒
  progress?: number; // 训练进度百分比
  finished?: boolean; // 是否训练完成
}>();

const time_number_2_string = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  if (hours > 0) {
    return `${hours} 小时 ${minutes} 分 ${seconds.toPrecision(2)} 秒`;
  }
  if (minutes > 0) {
    return `${minutes} 分 ${seconds.toFixed(2)} 秒`;
  }
  return `${seconds.toFixed(2)} 秒`;
}

const time_string = computed(() => {
  if (!props.time) return '未知';
  return time_number_2_string(props.time);
});

const value1 = [1];
const value2 = [1];

for (let i = 0; i < 99; i++) {
  value1.push(value1[i] * (1.1 - Math.random() * 0.4));
  value2.push(value2[i] * (1.1 - Math.random() * 0.5 + i * 0.001));
}


import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, PointElement, LineElement, CategoryScale, LinearScale)
const chartData = ref({
  labels: value1.map((_, index) => `Step ${index + 1}`),
  datasets: [{
    data: value1.map(v => v * (1 + Math.random() * 0.2)),
    borderColor: '#fff',
    backgroundColor: '#fff',
    pointBackgroundColor: '#fff',
    pointBorderColor: '#fff',
    borderWidth: 2,
    label: 'Train Loss',
  }, {
    data: value2.map(v => v * (2 + Math.random() * 0.1)),
    borderColor: '#ddd523',
    backgroundColor: '#ddd523',
    pointBackgroundColor: '#ddd523',
    pointBorderColor: '#ddd523',
    borderWidth: 2,
    label: 'Test Loss',
  }]
});
const chartOptions = ref({
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#fff'
      }
    }
  },
  scales: {
    x: {
      display: false,
      grid: { display: false }
    },
    y: {
      display: false,
      grid: { display: false }
    }
  },
  type: 'line',
  elements: {
    point: {
      radius: 0,
      hoverRadius: 5,
      hitRadius: 5
    }
  },
  borderWidth: 2,
});

</script>
<style>
.v-sheet--offset {
  top: -24px;
  position: relative;
}
</style>
