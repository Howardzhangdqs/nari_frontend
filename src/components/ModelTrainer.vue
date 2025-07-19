<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center mt-1">
      <Icon class="mr-2" :color="getModelIconColor(model.type)" :icon="getModelIcon(model.type)"></Icon>
      {{ model.name }}
      <v-spacer></v-spacer>
      <v-chip :color="getModelTypeColor(model.type)" size="small">{{ model.type }}</v-chip>
    </v-card-title>

    <v-card-text>
      <div class="text-body-2 text-medium-emphasis mb-3">{{ model.description }}</div>

      <!-- 状态指示器 -->
      <div class="d-flex align-center" :class="{ 'mb-4': status === 'training' }">
        <v-chip :color="getStatusColor(status)" :prepend-icon="getStatusIcon(status)" size="small" class="mb-2">
          {{ getStatusText(status) }}
        </v-chip>
        <v-spacer></v-spacer>
        <v-btn v-if="status === 'idle'" @click="startTraining" color="primary" size="small" prepend-icon="mdi-play">
          开始训练
        </v-btn>
        <v-btn v-else-if="status === 'training'" @click="stopTraining" color="error" size="small"
          prepend-icon="mdi-stop">
          停止训练
        </v-btn>
      </div>

      <!-- 数据预处理阶段 -->
      <div v-if="status === 'preprocessing'">
        <v-alert type="info" variant="tonal" class="mb-4">
          <v-icon>mdi-cog</v-icon>
          数据预处理中...
        </v-alert>

        <v-progress-linear :model-value="preprocessProgress" color="info" height="8" class="mb-2"></v-progress-linear>

        <div class="text-body-2 text-center">
          {{ preprocessSteps[currentPreprocessStep] }} ({{ Math.round(preprocessProgress) }}%)
        </div>
      </div>

      <!-- 训练阶段 -->
      <div v-if="status === 'training' || status === 'completed'">
        <!-- 训练指标 -->
        <v-row class="mb-4">
          <v-col cols="6" md="3">
            <div class="text-center">
              <div class="text-h6 text-primary">{{ currentEpoch }}</div>
              <div class="text-caption">当前轮次</div>
            </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-center">
              <div class="text-h6 text-success">
                {{ currentLoss < 0.001 ? currentLoss.toExponential(2) : currentLoss.toFixed(4) }} </div>
                  <div class="text-caption">训练损失</div>
              </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-center">
              <div class="text-h6 text-warning">{{ currentValLoss < 0.001 ? currentValLoss.toExponential(2) :
                currentValLoss.toFixed(4) }}</div>
                  <div class="text-caption">验证损失</div>
              </div>
          </v-col>
          <v-col cols="6" md="3">
            <div class="text-center">
              <div class="text-h6 text-info">{{ accuracy.toFixed(2) }}%</div>
              <div class="text-caption">准确率</div>
            </div>
          </v-col>
        </v-row>

        <!-- 训练进度 -->
        <div class="mb-4">
          <div class="d-flex justify-space-between align-center mb-2">
            <span class="text-subtitle-2">训练进度</span>
            <span class="text-body-2">{{ Math.round(trainingProgress) }}%</span>
          </div>
          <v-progress-linear v-model="trainingProgress" color="primary" height="8"></v-progress-linear>
        </div>

        <!-- 损失函数图表 -->
        <div ref="chartContainer" style="height: 250px;" class="mb-4"></div>

        <!-- 训练完成操作 -->
        <div v-if="status === 'completed'" class="d-flex justify-end gap-2">
          <v-btn variant="outlined" size="small" prepend-icon="mdi-download">
            下载模型
          </v-btn>
          <v-btn color="primary" size="small" prepend-icon="mdi-chart-line">
            查看详情
          </v-btn>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-if="status === 'error'">
        <v-alert type="error" variant="tonal">
          <div class="font-weight-medium">训练失败</div>
          <div class="text-body-2 mt-1">{{ errorMessage }}</div>
        </v-alert>
        <div class="d-flex justify-end mt-3">
          <v-btn @click="resetTraining" color="primary" size="small">
            重新开始
          </v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import * as echarts from "echarts";
import { ref, onUnmounted, nextTick, watch, onMounted } from "vue";
import { Icon } from "@iconify/vue";

// Props
interface ModelConfig {
  id: number;
  name: string;
  description: string;
  type: string;
  complexity: string;
}

const props = defineProps<{
  model: ModelConfig;
  trainParams: {
    epochs: number;
    batch_size: number;
    seq_len: number;
    label_len: number;
    pred_len: number;
  };
}>();

// Emits
const emit = defineEmits<{
  trainingCompleted: [modelId: number];
}>();

// 状态管理
type TrainingStatus = "idle" | "preprocessing" | "training" | "completed" | "error";
const status = ref<TrainingStatus>("idle");
const errorMessage = ref("");

// 预处理相关
const preprocessProgress = ref(0);
const currentPreprocessStep = ref(0);
const preprocessSteps = [
  "数据加载中...",
  "数据清洗中...",
  "特征提取中...",
  "数据归一化中...",
  "数据分割中..."
];


// 训练相关
const currentEpoch = ref(0);
const currentLoss = ref(0);
const currentValLoss = ref(0);
const accuracy = ref(0);
const trainingProgress = ref(0);

// 伪造训练数据（参考 TrainSummary.vue）
const fakeTrainLoss = ref<number[]>([]);
const fakeValLoss = ref<number[]>([]);
const fakeAccuracy = ref<number[]>([]);

// 训练历史数据
const trainingHistory = ref({
  epochs: [] as number[],
  losses: [] as number[],
  valLosses: [] as number[],
  accuracies: [] as number[]
});

// 定时器
let preprocessTimer: number | null = null;
let trainingTimer: number | null = null;

// ECharts相关
const chartContainer = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;

// 初始化图表
const initChart = () => {
  if (chartContainer.value && !chartInstance) {
    chartInstance = echarts.init(chartContainer.value);
    updateChart();

    // 创建ResizeObserver来监听容器大小变化
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        resizeChart();
      });
      resizeObserver.observe(chartContainer.value);
    }
  }
};

// 更新图表
const updateChart = () => {
  if (!chartInstance) return;

  const option = {
    title: {
      show: false
    },
    tooltip: {
      trigger: "axis",
      formatter: function (params: Array<{ axisValue: string, seriesName: string, value: number }>) {
        let result = `轮次 ${params[0].axisValue}<br/>`;
        params.forEach((param) => {
          const value = param.value < 0.001 ? param.value.toExponential(2) : param.value.toFixed(4);
          result += `${param.seriesName}: ${value}<br/>`;
        });
        return result;
      }
    },
    legend: {
      data: ["训练损失", "验证损失"],
      top: 0,
      textStyle: {
        fontSize: 11
      }
    },
    grid: {
      left: "10%",
      right: "10%",
      bottom: "15%",
      top: "15%"
    },
    xAxis: {
      type: "category",
      data: trainingHistory.value.epochs,
      name: "轮次",
      nameTextStyle: {
        fontSize: 11
      },
      axisLabel: {
        fontSize: 10
      }
    },
    yAxis: {
      type: "value",
      name: "损失值",
      nameTextStyle: {
        fontSize: 11
      },
      axisLabel: {
        fontSize: 10
      }
    },
    series: [
      {
        name: "训练损失",
        type: "line",
        data: trainingHistory.value.losses,
        smooth: true,
        lineStyle: {
          color: "#1976d2",
          width: 2
        },
        itemStyle: {
          color: "#1976d2"
        },
        symbol: "circle",
        symbolSize: 4
      },
      {
        name: "验证损失",
        type: "line",
        data: trainingHistory.value.valLosses,
        smooth: true,
        lineStyle: {
          color: "#f57c00",
          width: 2
        },
        itemStyle: {
          color: "#f57c00"
        },
        symbol: "circle",
        symbolSize: 4
      }
    ]
  };

  chartInstance.setOption(option);
};

// 监听训练历史数据变化
watch(trainingHistory, () => {
  if (chartInstance) {
    updateChart();
  }
}, { deep: true });

// 方法
const getModelIcon = (type: string) => {
  const icons: { [key: string]: string } = {
    "RNN": "tdesign:sequence-filled",
    "Attention": "material-symbols:eye-tracking-outline-rounded",
    "Hybrid": "fluent:merge-16-filled",
    "Ensemble": "gravity-ui:nodes-right"
  };
  return icons[type] || "mdi-robot";
};

const getModelIconColor = (type: string) => {
  const colors: { [key: string]: string } = {
    "RNN": "blue",
    "Attention": "purple",
    "Hybrid": "orange",
    "Ensemble": "green"
  };
  return colors[type] || "grey";
};

const getModelTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    "RNN": "blue",
    "Attention": "purple",
    "Hybrid": "orange",
    "Ensemble": "green"
  };
  return colors[type] || "grey";
};

const getStatusColor = (status: TrainingStatus) => {
  const colors = {
    "idle": "grey",
    "preprocessing": "info",
    "training": "primary",
    "completed": "success",
    "error": "error"
  };
  return colors[status];
};

const getStatusIcon = (status: TrainingStatus) => {
  const icons = {
    "idle": "mdi-pause",
    "preprocessing": "mdi-cog",
    "training": "mdi-play",
    "completed": "mdi-check",
    "error": "mdi-alert"
  };
  return icons[status];
};

const getStatusText = (status: TrainingStatus) => {
  const texts = {
    "idle": "待开始",
    "preprocessing": "预处理中",
    "training": "训练中",
    "completed": "已完成",
    "error": "训练失败"
  };
  return texts[status];
};


const startTraining = () => {
  resetTrainingData();
  startPreprocessing();
};

// 暴露方法给父组件
defineExpose({
  startTraining
});

const resetTrainingData = () => {
  currentEpoch.value = 0;
  currentLoss.value = 0;
  currentValLoss.value = 0;
  accuracy.value = 0;
  trainingProgress.value = 0;
  preprocessProgress.value = 0;
  currentPreprocessStep.value = 0;

  // 生成伪造训练数据
  const epochs = props.trainParams.epochs || 100;
  const value1: number[] = [1 + Math.random() * 0.5];
  const value2: number[] = [value1[0] * (1.1 - Math.random() * 0.4)];
  const acc: number[] = [20 + Math.random() * 10];
  for (let i = 0; i < epochs - 1; i++) {
    value1.push(value1[i] * (1.1 - Math.random() * 0.4));
    value2.push(value2[i] * (1.1 - Math.random() * 0.5 + i * 0.001));
    acc.push(Math.min(99, acc[i] + Math.random() * 1.5));
  }
  for (let i = 0; i < epochs; i++) {
    value1[i] = value1[i] * (1 + Math.random() * 0.2);
    value2[i] = value2[i] * (2 + Math.random() * 0.1);
  }
  fakeTrainLoss.value = value1;
  fakeValLoss.value = value2;
  fakeAccuracy.value = acc;

  trainingHistory.value = {
    epochs: [],
    losses: [],
    valLosses: [],
    accuracies: []
  };
};

const startPreprocessing = () => {
  status.value = "preprocessing";
  preprocessProgress.value = 0;
  currentPreprocessStep.value = 0;

  preprocessTimer = setInterval(() => {
    preprocessProgress.value += 2;

    // 更新预处理步骤
    const stepProgress = preprocessProgress.value / 20;
    currentPreprocessStep.value = Math.min(Math.floor(stepProgress), preprocessSteps.length - 1);

    if (preprocessProgress.value >= 100) {
      if (preprocessTimer) {
        clearInterval(preprocessTimer);
        preprocessTimer = null;
      }
      startActualTraining();
    }
  }, 50);
};

const random_rate = Math.random() * 1000 + 500;

const startActualTraining = () => {
  status.value = "training";
  currentEpoch.value = 0;

  const updateTraining = async () => {
    if (currentEpoch.value >= props.trainParams.epochs) {
      return completeTraining();
    }

    // 更新当前值
    currentLoss.value = fakeTrainLoss.value[currentEpoch.value] || 0;
    currentValLoss.value = fakeValLoss.value[currentEpoch.value] || 0;
    accuracy.value = fakeAccuracy.value[currentEpoch.value] || 0;
    trainingProgress.value = ((currentEpoch.value + 1) / props.trainParams.epochs) * 100;

    // 每2个epoch更新一次历史数据
    if (currentEpoch.value % 2 === 0) {
      await nextTick();
      trainingHistory.value = {
        epochs: [...trainingHistory.value.epochs, currentEpoch.value + 1],
        losses: [...trainingHistory.value.losses, currentLoss.value],
        valLosses: [...trainingHistory.value.valLosses, currentValLoss.value],
        accuracies: [...trainingHistory.value.accuracies, accuracy.value]
      };
    }

    currentEpoch.value++;
    trainingTimer = setTimeout(updateTraining, random_rate * (Math.random() + 0.5)); // 降低更新频率
  };

  updateTraining();
};

const completeTraining = () => {
  status.value = "completed";
  if (trainingTimer) {
    clearInterval(trainingTimer);
    trainingTimer = null;
  }

  // 发射训练完成事件
  emit("trainingCompleted", props.model.id);
};

const stopTraining = () => {
  if (preprocessTimer) {
    clearInterval(preprocessTimer);
    preprocessTimer = null;
  }
  if (trainingTimer) {
    clearInterval(trainingTimer);
    trainingTimer = null;
  }
  status.value = "idle";
};

const resetTraining = () => {
  stopTraining();
  resetTrainingData();
  status.value = "idle";
};

// 图表初始化
const initChartWhenVisible = () => {
  nextTick(() => {
    if ((status.value === "training" || status.value === "completed") && chartContainer.value && !chartInstance) {
      initChart();
    }
  });
};

// 响应式调整图表大小
const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 监听窗口大小变化
const handleResize = () => {
  resizeChart();
};

// 监听状态变化，在需要时初始化图表
watch(status, () => {
  if (status.value === "training" || status.value === "completed") {
    initChartWhenVisible();
  }
});

// 添加窗口大小变化监听器
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

// 组件卸载时清理定时器和图表
onUnmounted(() => {
  if (preprocessTimer) {
    clearInterval(preprocessTimer);
  }
  if (trainingTimer) {
    clearInterval(trainingTimer);
  }
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  // 移除窗口大小变化监听器
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.v-card-title {
  padding-bottom: 8px;
}

.v-card-text {
  padding-top: 8px;
}
</style>
