<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12">
        <v-card title="国电南瑞科技股份有限公司" subtitle="XXXX训练与预测平台">
          <v-card-text class="bg-surface-light pt-4">
            这里是简介。Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ratione debitis quis est labore
            voluptatibus!
            Eaque
            cupiditate minima, at placeat totam, magni doloremque veniam neque porro libero rerum unde voluptatem!
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="12">
        <div style="display: flex; flex-direction: column; align-items: stretch;">
          <div class="text-h6 mb-1" style="line-height: 20px">服务状态</div>
          <hr />
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- GPU 状态 -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" color="primary">mdi-memory</v-icon>
            GPU 显存
          </v-card-title>
          <v-card-text>
            <div class="text-h5 font-weight-bold">{{ serverStatus.gpu.memoryUsed.toFixed(1) }} / {{
              serverStatus.gpu.memoryTotal.toFixed(1) }}
              GB</div>
            <v-progress-linear :model-value="serverStatus.gpu.memoryPercent" color="primary" class="my-2"
              height="8"></v-progress-linear>
            <div class="text-caption text-medium-emphasis">使用率: {{ serverStatus.gpu.memoryPercent.toFixed(1) }}%</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- GPU 功率 -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" color="orange">mdi-flash</v-icon>
            GPU 功率
          </v-card-title>
          <v-card-text>
            <div class="text-h5 font-weight-bold">{{ serverStatus.gpu.powerUsage.toFixed(1) }} W</div>
            <v-progress-linear :model-value="(serverStatus.gpu.powerUsage / serverStatus.gpu.powerLimit) * 100"
              color="orange" class="my-2" height="8"></v-progress-linear>
            <div class="text-caption text-medium-emphasis">限制: {{ serverStatus.gpu.powerLimit }} W</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- CPU 使用率 -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" color="green">mdi-cpu-64-bit</v-icon>
            CPU 使用率
          </v-card-title>
          <v-card-text>
            <div class="text-h5 font-weight-bold">{{ serverStatus.cpu.usage.toFixed(1) }}%</div>
            <v-progress-linear :model-value="serverStatus.cpu.usage" color="green" class="my-2"
              height="8"></v-progress-linear>
            <div class="text-caption text-medium-emphasis">{{ serverStatus.cpu.cores }} 核心</div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 正在训练的模型 -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" color="blue">mdi-brain</v-icon>
            训练状态
          </v-card-title>
          <v-card-text>
            <div class="text-h5 font-weight-bold">{{ serverStatus.training.activeModels }}</div>
            <div class="text-body-2 my-2">个模型正在训练</div>
            <div class="text-caption text-medium-emphasis">
              队列中: {{ serverStatus.training.queuedModels }} 个
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <!-- 系统信息 -->
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" color="purple">mdi-server</v-icon>
            系统信息
          </v-card-title>
          <v-card-text>
            <v-row dense>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">操作系统</div>
                <div class="text-body-2">{{ serverStatus.system.os }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">运行时间</div>
                <div class="text-body-2">{{ serverStatus.system.uptime }}</div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">内存使用</div>
                <div class="text-body-2">{{ serverStatus.system.memoryUsed.toFixed(1) }} / {{
                  serverStatus.system.memoryTotal }} GB
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-caption text-medium-emphasis">磁盘使用</div>
                <div class="text-body-2">{{ serverStatus.system.diskUsed.toFixed(1) }} / {{
                  serverStatus.system.diskTotal.toFixed(1) }} TB
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 服务状态 -->
      <v-col cols="12" sm="6">
        <v-card>
          <v-card-title class="text-subtitle-1">
            <v-icon class="mr-2" color="teal">mdi-cog</v-icon>
            服务状态
          </v-card-title>
          <v-card-text>
            <div v-for="service in serverStatus.services" :key="service.name" class="d-flex align-center mb-2">
              <v-icon
                :color="service.status === 'running' ? 'success' : service.status === 'stopped' ? 'error' : 'warning'"
                class="mr-2">
                {{ service.status === 'running' ? 'mdi-check-circle' : service.status === 'stopped' ? 'mdi-close-circle'
                  : 'mdi-alert-circle' }}
              </v-icon>
              <div class="flex-grow-1">
                <div class="text-body-2">{{ service.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ service.description }}</div>
              </div>
              <v-chip
                :color="service.status === 'running' ? 'success' : service.status === 'stopped' ? 'error' : 'warning'"
                size="x-small" variant="flat">
                {{ service.status === 'running' ? '运行中' : service.status === 'stopped' ? '已停止' : '连接丢失' }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="12">
        <div style="display: flex; flex-direction: column; align-items: stretch;">
          <div class="text-h6 mb-1" style="line-height: 20px">训练摘要</div>
          <hr />
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="4">
        <TrainSummary model="XGBoost" :time="trainingSessions.xgboost.time"
          :accuracy="trainingSessions.xgboost.accuracy" dataset="CIFAR-10" :progress="trainingSessions.xgboost.progress"
          :finished="trainingSessions.xgboost.finished" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="LightGBM" :time="trainingSessions.lightgbm.time"
          :accuracy="trainingSessions.lightgbm.accuracy" dataset="CIFAR-10"
          :progress="trainingSessions.lightgbm.progress" :finished="trainingSessions.lightgbm.finished" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="ResMTN" :time="trainingSessions.resmtn.time" :accuracy="trainingSessions.resmtn.accuracy"
          dataset="CIFAR-10" :progress="trainingSessions.resmtn.progress"
          :finished="trainingSessions.resmtn.finished" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="AdaBoost" :time="trainingSessions.adaboost.time"
          :accuracy="trainingSessions.adaboost.accuracy" dataset="CIFAR-10"
          :progress="trainingSessions.adaboost.progress" :finished="trainingSessions.adaboost.finished" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="Transformer" :time="12807" :accuracy="0.9123412" dataset="CIFAR-10" :finished="true" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="MLP" :time="12" :accuracy="0.5412" dataset="CIFAR-10" :finished="true" />
      </v-col>

    </v-row>
  </v-container>
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

interface ServerStatus {
  gpu: {
    memoryUsed: number;
    memoryTotal: number;
    memoryPercent: number;
    powerUsage: number;
    powerLimit: number;
    temperature: number;
  };
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
  };
  training: {
    activeModels: number;
    queuedModels: number;
  };
  system: {
    os: string;
    uptime: string;
    memoryUsed: number;
    memoryTotal: number;
    diskUsed: number;
    diskTotal: number;
  };
  services: Array<{
    name: string;
    description: string;
    status: "running" | "stopped" | "warning";
  }>;
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

const serverStatus = ref<ServerStatus>({
  gpu: {
    memoryUsed: 18.2,
    memoryTotal: 24.0,
    memoryPercent: 75.8,
    powerUsage: 280,
    powerLimit: 350,
    temperature: 72
  },
  cpu: {
    usage: 45.6,
    cores: 16,
    temperature: 58
  },
  training: {
    activeModels: 4,
    queuedModels: 2
  },
  system: {
    os: "Ubuntu 22.04 LTS",
    uptime: "15天 8小时",
    memoryUsed: 42.3,
    memoryTotal: 64.0,
    diskUsed: 1.2,
    diskTotal: 2.0
  },
  services: [
    {
      name: "训练服务",
      description: "机器学习模型训练服务",
      status: "running"
    },
    {
      name: "数据库服务",
      description: "MongoDB 数据库",
      status: "running"
    },
    {
      name: "Redis 缓存",
      description: "Redis 内存缓存服务",
      status: "running"
    },
    {
      name: "文件存储",
      description: "MinIO 对象存储服务",
      status: "warning"
    }
  ]
});

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

const updateServerStatus = () => {
  // 模拟 GPU 显存使用的变化
  const memoryChange = (Math.random() - 0.5) * 0.5;
  serverStatus.value.gpu.memoryUsed = Math.max(10, Math.min(23, serverStatus.value.gpu.memoryUsed + memoryChange));
  serverStatus.value.gpu.memoryPercent = (serverStatus.value.gpu.memoryUsed / serverStatus.value.gpu.memoryTotal) * 100;

  // 模拟 GPU 功率变化
  const powerChange = (Math.random() - 0.5) * 20;
  serverStatus.value.gpu.powerUsage = Math.max(200, Math.min(340, serverStatus.value.gpu.powerUsage + powerChange));

  // 模拟 CPU 使用率变化
  const cpuChange = (Math.random() - 0.5) * 10;
  serverStatus.value.cpu.usage = Math.max(20, Math.min(90, serverStatus.value.cpu.usage + cpuChange));

  // 更新正在训练的模型数量
  const activeTraining = Object.values(trainingSessions.value).filter(session => !session.finished).length;
  serverStatus.value.training.activeModels = activeTraining;

  // 模拟系统内存使用变化
  const memChange = (Math.random() - 0.5) * 2;
  serverStatus.value.system.memoryUsed = Math.max(30, Math.min(60, serverStatus.value.system.memoryUsed + memChange));
};

onMounted(() => {
  intervalId = setInterval(() => {
    updateTrainingSessions();
    updateServerStatus();
  }, 1000); // 每秒更新一次
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>
