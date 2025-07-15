<template>
  <v-stepper :items="['数据上传', '数据预览']" next-text="下一步" prev-text="上一步">
    <template v-slot:[`item.1`]>
      <v-card title="训练数据上传" flat>
        <v-file-input label="File input" accept=".csv,.xlsx" show-size>
        </v-file-input>
      </v-card>
    </template>

    <template v-slot:[`item.2`]>
      <v-card flat>
        <div style="display: flex; flex-direction: column; align-items: stretch;">
          <div class="text-h6 mb-1" style="line-height: 20px">前5条数据</div>
          <hr />
        </div>
        <v-data-table-virtual :items="table_data" :headers="headers"></v-data-table-virtual>
        <div class="mt-6" style="display: flex; flex-direction: column; align-items: stretch;">
          <div class="text-h6 mb-1" style="line-height: 20px">数据分布</div>
          <hr />
        </div>
        <div class="charts-container"
          style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-top: 20px;">
          <div v-for="(chart, index) in chartData" :key="index" class="chart-wrapper"
            style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <Bar :data="chart.data" :options="chart.options" />
          </div>
        </div>
      </v-card>
    </template>
  </v-stepper>
</template>

<script lang="ts" setup>
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const num_features = 100;

// 生成正态分布数据
function generateNormalDistribution(mean: number, stdDev: number, count: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < count; i++) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    data.push(z * stdDev + mean);
  }
  return data;
}

// 创建直方图数据
function createHistogramData(data: number[], bins: number = 20): { labels: string[], values: number[] } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 0; i < bins; i++) {
    const start = min + i * binWidth;
    const end = min + (i + 1) * binWidth;
    labels.push(`${Math.round(start)}-${Math.round(end)}`);

    const count = data.filter(val => val >= start && val < end).length;
    values.push(count);
  }

  return { labels, values };
}

// 为几个特征生成图表数据
const chartData = [];
const selectedFeatures = [1, 15, 32, 67, 89]; // 选择几个特征来展示

for (let i = 0; i < selectedFeatures.length; i++) {
  const featureIndex = selectedFeatures[i];
  const mean = 50 + (Math.random() - 0.5) * 40; // 随机均值
  const stdDev = 10 + Math.random() * 10; // 随机标准差
  const normalData = generateNormalDistribution(mean, stdDev, 1000);
  const histData = createHistogramData(normalData);

  chartData.push({
    data: {
      labels: histData.labels,
      datasets: [{
        label: `特征 ${featureIndex} 分布`,
        data: histData.values,
        backgroundColor: `#0365af`,
        borderColor: `#0365af`,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `特征 ${featureIndex} 的分布 (均值: ${mean.toFixed(2)}, 标准差: ${stdDev.toFixed(2)})`
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: '数值区间'
          }
        },
        y: {
          title: {
            display: true,
            text: '频次'
          },
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

const headers: {
  title: string;
  align?: "start" | "end" | "center";
  key: string;
}[] = [
    { title: '数据 ID', align: 'start', key: 'id' },
  ];

for (let i = 1; i <= num_features; i++) {
  headers.push({ title: `特征 ${i}`, key: `feature_${i}`, align: 'start' });
}

const table_data: {
  id: string;
  [key: string]: string;
}[] = [];

for (let i = 0; i < 5; i++) {
  const row: { id: string;[key: string]: string } = { id: (i + 1).toString() };
  for (let j = 1; j <= num_features; j++) {
    row[`feature_${j}`] = (Math.random() * 100).toFixed(2);
  }
  table_data.push(row);
}
</script>

<style>
.v-data-table-header__content {
  width: max-content;
}
</style>
