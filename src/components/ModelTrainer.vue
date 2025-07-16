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
        <v-chip :color="getStatusColor(status)" :prepend-icon="getStatusIcon(status)" size="small">
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
        <div style="height: 250px;" class="mb-4">
          <Line :data="lossChartData" :options="lossChartOptions" />
        </div>

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
import { Line } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import { ref, computed, onUnmounted, nextTick } from "vue";
import { Icon } from "@iconify/vue";

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

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

// 计算属性
const lossChartData = computed(() => ({
  labels: trainingHistory.value.epochs.map(epoch => `${epoch}`),
  datasets: [
    {
      label: "训练损失",
      data: trainingHistory.value.losses,
      borderColor: "#1976d2",
      backgroundColor: "rgba(25, 118, 210, 0.1)",
      tension: 0.4,
      pointRadius: 2
    },
    {
      label: "验证损失",
      data: trainingHistory.value.valLosses,
      borderColor: "#f57c00",
      backgroundColor: "rgba(245, 124, 0, 0.1)",
      tension: 0.4,
      pointRadius: 2
    }
  ]
}));

const lossChartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: false
    },
    legend: {
      display: true,
      position: "top" as const,
      labels: {
        boxWidth: 12,
        font: {
          size: 11
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "轮次",
        font: {
          size: 11
        }
      },
      ticks: {
        font: {
          size: 10
        }
      }
    },
    y: {
      title: {
        display: true,
        text: "损失值",
        font: {
          size: 11
        }
      },
      beginAtZero: true,
      ticks: {
        font: {
          size: 10
        }
      }
    }
  }
});

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

const getConvergenceRate = (modelType: string) => {
  // 不同模型类型的收敛特性
  const rates: { [key: string]: number } = {
    "RNN": 0.985,
    "Attention": 0.980,
    "Hybrid": 0.975,
    "Ensemble": 0.990
  };
  return rates[modelType] || 0.985;
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

// 组件卸载时清理定时器
onUnmounted(() => {
  if (preprocessTimer) {
    clearInterval(preprocessTimer);
  }
  if (trainingTimer) {
    clearInterval(trainingTimer);
  }
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
