<template>
  <v-card class="mt-6 mx-auto overflow-visible" max-width="400">
    <v-sheet class="v-sheet--offset mx-auto" :color="props.finished ? 'success' : 'primary'" elevation="8"
      max-width="calc(100% - 16px)" rounded="lg" style="padding: 0 10px 10px 10px">
      <div ref="chartContainer" class="chart-container-width-100" :style="{ height: '100px', width: '100%' }"></div>
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
            <br />预计还需 {{ time_number_2_string(props.time / props.progress * (100 - props.progress)) }}</span>
        </span>
      </div>
      <v-progress-linear :model-value="props.progress" v-if="props.progress && !props.finished"></v-progress-linear>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onUnmounted } from "vue";
import * as echarts from "echarts";

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

  const result = [];

  if (hours > 0) {
    result.push(`${hours} 小时`);
  }
  if (minutes > 0) {
    result.push(`${minutes} 分`);
  }
  if (seconds > 0 || result.length === 0) {
    result.push(`${seconds.toFixed(0)} 秒`);
  }
  return result.join(" ");
};

const time_string = computed(() => {
  if (!props.time) return "未知";
  return time_number_2_string(props.time);
});

const value1 = [1];
const value2 = [1];

for (let i = 0; i < 99; i++) {
  value1.push(value1[i] * (1.1 - Math.random() * 0.4));
  value2.push(value2[i] * (1.1 - Math.random() * 0.5 + i * 0.001));
}

for (let i = 0; i < 100; i++) {
  value1[i] = value1[i] * (1 + Math.random() * 0.2);
  value2[i] = value2[i] * (2 + Math.random() * 0.1);
}

import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { registChart } from "@/resize_charts";

use([TitleComponent, TooltipComponent, LegendComponent, GridComponent, LineChart, CanvasRenderer]);

const chartContainer = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const initChart = () => {
  if (chartContainer.value) {
    chartInstance = echarts.init(chartContainer.value);
    updateChart();
  }
};

const updateChart = () => {
  if (!chartInstance) return;

  const option = {
    xAxis: {
      type: "category",
      data: value1.slice(0, props.progress).map((_, index) => `Step ${index + 1}`),
      show: false
    },
    yAxis: {
      type: "value",
      show: false
    },
    series: [
      {
        name: "Train Loss",
        type: "line",
        data: value1.slice(0, props.progress),
        smooth: true,
        lineStyle: {
          color: "#fff",
          width: 2
        },
        itemStyle: {
          color: "#fff"
        },
        symbol: "none"
      },
      {
        name: "Test Loss",
        type: "line",
        data: value2.slice(0, props.progress),
        smooth: true,
        lineStyle: {
          color: "#ddd523",
          width: 2
        },
        itemStyle: {
          color: "#ddd523"
        },
        symbol: "none"
      }
    ],
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 2
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line"
      },
      formatter: function (
        params: Array<{
          value: number | string;
          seriesName: string;
          color: string;
          axisValue: string;
        }>
      ) {
        // params is an array of series data at the hovered point
        const result = params.map((item) => {
          // Format value to 4 decimal places
          const value = typeof item.value === "number" ? item.value.toFixed(4) : item.value;

          // console.log("item.color", item.color);

          // Custom marker with black border
          const marker = `<span style="display:inline-block;margin-right:4px;border-radius:50%;width:10px;height:10px;${item.color == "#fff" ? "border:1px solid #000;" : ""}background:${item.color};"></span>`;
          return `${marker}${item.seriesName}: ${value}`;
        });
        return `${params[0].axisValue}<br/>${result.join("<br/>")}`;
      }
    }
  };

  chartInstance.setOption(option);

  registChart(chartInstance);
};

onMounted(() => {
  initChart();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (chartInstance) {
    chartInstance.dispose();
  }
});

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

watch(() => props.progress, () => {
  updateChart();
});

watch(() => [value1, value2], () => {
  updateChart();
}, { deep: true });


</script>
<style>
.v-sheet--offset {
  top: -24px;
  position: relative;
}
</style>
