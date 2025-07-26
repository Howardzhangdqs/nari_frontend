<template>

  <v-row style="padding: 10px">

    <v-col cols="12" sm="12">
      <v-card title="南京信息工程大学" subtitle="发电功率与电力负荷预测平台">
        <v-card-text class="bg-surface-light pt-4">
          这里是简介。
        </v-card-text>
      </v-card>
    </v-col>

    <v-col cols="12" lg="6">
      <v-row class="gutters-2">
        <v-col cols="12" sm="12">
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">模型库</div>
            <hr />
          </div>
        </v-col>

        <!-- 模型库展示 -->
        <v-col v-for="model in modelLibrary" :key="model.id" cols="12" sm="6" md="4" lg="6" xl="4">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" :color="getModelTypeColor(model.type)">mdi-brain</v-icon>
              {{ model.name }}
            </v-card-title>
            <v-card-text>
              <div class="text-body-2 mb-2">{{ model.description }}</div>
              <div class="d-flex gap-1" style="gap: 5px">
                <v-chip size="x-small" :color="getModelTypeColor(model.type)">
                  {{ model.type }}
                </v-chip>
                <v-chip size="x-small" :color="model.complexity === 'high' ? 'orange' : 'green'">
                  {{ model.complexity === 'high' ? '高复杂度' : '中等复杂度' }}
                </v-chip>
                <v-chip size="x-small" color="blue">
                  {{ model.category }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>

    <v-col cols="12" lg="6">
      <v-row>
        <v-col cols="12" sm="12">
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">任务训练进度</div>
            <hr />
          </div>
        </v-col>
        <v-col cols="12" sm="4" xl="3">
          <TrainSummary model="XGBoost" :time="trainingSessions.xgboost.time"
            :accuracy="trainingSessions.xgboost.accuracy" dataset="CIFAR-10"
            :progress="trainingSessions.xgboost.progress" :finished="trainingSessions.xgboost.finished" />
        </v-col>

        <v-col cols="12" sm="4" xl="3">
          <TrainSummary model="LightGBM" :time="trainingSessions.lightgbm.time"
            :accuracy="trainingSessions.lightgbm.accuracy" dataset="CIFAR-10"
            :progress="trainingSessions.lightgbm.progress" :finished="trainingSessions.lightgbm.finished" />
        </v-col>

        <v-col cols="12" sm="4" xl="3">
          <TrainSummary model="ResMTN" :time="trainingSessions.resmtn.time" :accuracy="trainingSessions.resmtn.accuracy"
            dataset="CIFAR-10" :progress="trainingSessions.resmtn.progress"
            :finished="trainingSessions.resmtn.finished" />
        </v-col>

        <v-col cols="12" sm="4" xl="3">
          <TrainSummary model="AdaBoost" :time="trainingSessions.adaboost.time"
            :accuracy="trainingSessions.adaboost.accuracy" dataset="CIFAR-10"
            :progress="trainingSessions.adaboost.progress" :finished="trainingSessions.adaboost.finished" />
        </v-col>

        <v-col cols="12" sm="4" xl="3">
          <TrainSummary model="Transformer" :time="12807" :accuracy="0.9123412" dataset="CIFAR-10" :finished="true" />
        </v-col>

        <v-col cols="12" sm="4" xl="3">
          <TrainSummary model="MLP" :time="12" :accuracy="0.5412" dataset="CIFAR-10" :finished="true" />
        </v-col>
      </v-row>
    </v-col>

  </v-row>
</template>

<script lang="ts" setup>
import TrainSummary from "../components/TrainSummary.vue";
import { ref, onMounted, onUnmounted } from "vue";

interface TrainingSession {
  time: number;
  accuracy: number;
  progress: number;
  finished: boolean;
}

const trainingSessions = ref<{
  xgboost: TrainingSession;
  lightgbm: TrainingSession;
  resmtn: TrainingSession;
  adaboost: TrainingSession;
}>({
  xgboost: {
    time: 52,
    accuracy: 0.8389,
    progress: 3,
    finished: false
  } as TrainingSession,
  lightgbm: {
    time: 27,
    accuracy: 0.7389,
    progress: 78,
    finished: false
  } as TrainingSession,
  resmtn: {
    time: 153,
    accuracy: 0.89,
    progress: 42,
    finished: false
  } as TrainingSession,
  adaboost: {
    time: 31,
    accuracy: 0.19,
    progress: 12,
    finished: false
  } as TrainingSession
});

// AI模型库
const modelLibrary = ref([
  {
    id: 1,
    name: "LSTM",
    description: "长短期记忆网络，适合时序预测",
    type: "RNN",
    complexity: "medium",
    category: "深度学习"
  },
  {
    id: 2,
    name: "GRU",
    description: "门控循环单元，轻量级RNN",
    type: "RNN",
    complexity: "medium",
    category: "深度学习"
  },
  {
    id: 3,
    name: "Transformer",
    description: "注意力机制，处理长序列",
    type: "Attention",
    complexity: "high",
    category: "深度学习"
  },
  {
    id: 4,
    name: "Informer",
    description: "高效长序列预测模型",
    type: "Attention",
    complexity: "high",
    category: "深度学习"
  },
  {
    id: 5,
    name: "CNN-LSTM",
    description: "卷积神经网络+LSTM混合模型",
    type: "Hybrid",
    complexity: "high",
    category: "深度学习"
  },
  {
    id: 6,
    name: "Random Forest",
    description: "随机森林集成学习",
    type: "Ensemble",
    complexity: "medium",
    category: "机器学习"
  },
  {
    id: 7,
    name: "XGBoost",
    description: "梯度提升决策树",
    type: "Ensemble",
    complexity: "medium",
    category: "机器学习"
  },
  {
    id: 8,
    name: "LightGBM",
    description: "轻量级梯度提升框架",
    type: "Ensemble",
    complexity: "medium",
    category: "机器学习"
  }
]);

// 获取模型类型颜色
const getModelTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    "RNN": "blue",
    "Attention": "purple",
    "Hybrid": "orange",
    "Ensemble": "green"
  };
  return colors[type] || "grey";
};

let intervalId: number | null = null;

const updateTrainingSessions = () => {
  Object.keys(trainingSessions.value).forEach(key => {
    const session = trainingSessions.value[key as keyof typeof trainingSessions.value];

    if (!session.finished) {
      // 增加训练时间（每秒+1）
      session.time += 1;

      // 增加进度（根据当前进度调整增长速度，避免过快到达100%）
      const progressIncrement = Math.random() * 0.5 + 0.2; // 0.2-0.7的随机增长
      session.progress = Math.min(100, session.progress + progressIncrement);

      // 更新精度（前一次乘以1.05±0.2，即0.85-1.25之间的随机系数）
      const accuracyMultiplier = 1.05 + (Math.random() - 0.5) * 0.4; // 0.85-1.25
      session.accuracy = Math.min(0.99, session.accuracy * accuracyMultiplier);

      // 检查是否完成训练
      if (session.progress >= 100) {
        session.progress = 100;
        session.finished = true;
      }
    }
  });
};

onMounted(() => {
  intervalId = setInterval(() => {
    updateTrainingSessions();
  }, 1000); // 每秒更新一次
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>
