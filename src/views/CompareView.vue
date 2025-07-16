<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-6" variant="text">
          <v-card-title class="text-h5">模型对比</v-card-title>
          <v-card-text>
            <v-data-table :headers="headers" :items="metrics" class="elevation-1" :items-per-page="5"
              hide-default-footer>
              <template v-slot:[`item.r2`]="{ item }">
                {{ item.r2 }}
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card variant="text">
          <v-card-title class="text-h5">可视化</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div ref="rmseChart" style="height:400px;"></div>
              </v-col>
              <v-col cols="12" md="6">
                <div ref="maeR2Chart" style="height:400px;"></div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">

import { ref, onMounted } from "vue";
import * as echarts from "echarts";

interface Metric {
  model: string;
  rmse: number;
  mae: number;
  r2: number;
}


const headers = [
  { title: "模型", value: "model" },
  { title: "均方根误差 (RMSE)", value: "rmse" },
  { title: "平均绝对误差 (MAE)", value: "mae" },
  { title: "决定系数 (R²)", value: "r2" }
];

const metrics: Metric[] = [
  { model: "线性回归", rmse: 0.62, mae: 0.78, r2: 0.85 },
  { model: "决策树", rmse: 0.55, mae: 0.85, r2: 0.72 },
  { model: "随机森林", rmse: 0.51, mae: 0.88, r2: 0.68 },
  { model: "LSTM", rmse: 0.48, mae: 0.90, r2: 0.65 }
];

const rmseChart = ref<HTMLDivElement | null>(null);
const maeR2Chart = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (rmseChart.value) {
    const chart = echarts.init(rmseChart.value);
    chart.setOption({
      title: { text: "RMSE 对比" },
      tooltip: {},
      xAxis: {
        type: "category",
        data: metrics.map(m => m.model),
        axisLabel: { interval: 0, rotate: 0 }
      },
      yAxis: {
        type: "value",
        name: "RMSE",
        min: 0,
        max: 1,
        interval: 0.1
      },
      series: [{
        name: "RMSE",
        type: "bar",
        data: metrics.map(m => m.rmse),
        itemStyle: { color: "#1976d2" }
      }]
    });
  }
  if (maeR2Chart.value) {
    const chart = echarts.init(maeR2Chart.value);
    chart.setOption({
      title: { text: "MAE 与 R² 对比" },
      tooltip: {},
      legend: { data: ["MAE", "R²"] },
      xAxis: {
        type: "category",
        data: metrics.map(m => m.model)
      },
      yAxis: { type: "value", min: 0, max: 1, interval: 0.1 },
      series: [
        {
          name: "MAE",
          type: "bar",
          data: metrics.map(m => m.mae),
          itemStyle: { color: "#43a047" }
        },
        {
          name: "R²",
          type: "bar",
          data: metrics.map(m => m.r2),
          itemStyle: { color: "#fbc02d" }
        }
      ]
    });
  }
});
</script>

<style scoped>
.v-card-title {
  font-weight: 600;
}
</style>
