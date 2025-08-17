<template>
  <v-row style="padding: 10px">
    <v-col cols="12" sm="12">
      <v-card title="时间序列训练平台" subtitle="发电功率与电力负荷预测平台">
        <v-card-text class="bg-surface-light pt-4">
          该平台提供时间序列模型训练、数据集管理、任务管理和模型管理等功能。
        </v-card-text>
      </v-card>
    </v-col>

    <!-- 模型概况 -->
    <v-col cols="12" lg="6">
      <v-row class="gutters-2">
        <v-col cols="12" sm="12">
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">模型概况</div>
            <hr />
          </div>
        </v-col>

        <!-- 模型统计卡片 -->
        <v-col cols="12" sm="6" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" color="primary">mdi-brain</v-icon>
              总模型数量
            </v-card-title>
            <v-card-text>
              <div class="text-h4 text-primary mb-2">{{ modelStats.totalModels }}</div>
              <div class="text-body-2">系统中可用的模型总数</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="6">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
              活跃模型
            </v-card-title>
            <v-card-text>
              <div class="text-h4 text-success mb-2">{{ modelStats.activeModels }}</div>
              <div class="text-body-2">当前活跃可用的模型数</div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 模型使用频次统计 -->
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-subtitle-1">模型使用频次</v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item v-for="model in modelUsageStats" :key="model.name">
                  <template v-slot:prepend>
                    <v-icon :color="getModelTypeColor(model.type)" class="mr-2">mdi-brain</v-icon>
                  </template>
                  <v-list-item-title>{{ model.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ getModelDescription(model) }} - 已使用 {{ model.usageCount }}
                    次</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-chip size="small" :color="getModelTypeColor(model.type)">
                      {{ model.usageCount }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>

    <!-- 任务概况 -->
    <v-col cols="12" lg="6">
      <v-row>
        <v-col cols="12" sm="12">
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">任务概况</div>
            <hr />
          </div>
        </v-col>

        <!-- 任务统计卡片 -->
        <v-col cols="12" sm="4">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" color="info">mdi-clipboard-list</v-icon>
              总任务数
            </v-card-title>
            <v-card-text>
              <div class="text-h4 text-info mb-2">{{ taskStats.totalTasks }}</div>
              <div class="text-body-2">系统中的任务总数</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
              已完成
            </v-card-title>
            <v-card-text>
              <div class="text-h4 text-success mb-2">{{ taskStats.completedTasks }}</div>
              <div class="text-body-2">已完成的任务数量</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card>
            <v-card-title class="text-subtitle-1">
              <v-icon class="mr-2" color="warning">mdi-progress-clock</v-icon>
              进行中
            </v-card-title>
            <v-card-text>
              <div class="text-h4 text-warning mb-2">{{ taskStats.runningTasks }}</div>
              <div class="text-body-2">正在进行的任务数量</div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- 任务进度展示 -->
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-subtitle-1">当前运行任务</v-card-title>
            <v-card-text>
              <div v-if="runningTasks.length === 0" class="text-center text-medium-emphasis py-8">
                <v-icon size="48" color="medium-emphasis">mdi-clipboard-check</v-icon>
                <div class="mt-2">暂无运行中的任务</div>
              </div>
              <v-list v-else density="compact">
                <v-list-item v-for="task in runningTasks" :key="task.id">
                  <template v-slot:prepend>
                    <v-icon color="primary" class="mr-2">mdi-play-circle</v-icon>
                  </template>
                  <v-list-item-title>{{ task.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ task.dataset }} - {{ task.model }}
                  </v-list-item-subtitle>
                  <template v-slot:append>
                    <div class="text-caption">{{ task.progress }}%</div>
                    <v-progress-linear :model-value="task.progress" color="primary" height="4" class="ml-2"
                      style="width: 80px;"></v-progress-linear>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

// 模型统计数据
const modelStats = ref({
  totalModels: 8,
  activeModels: 6
});

// 模型使用频次统计
const modelUsageStats = ref([
  { name: "LSTM", type: "RNN", usageCount: 24 },
  { name: "Transformer", type: "Attention", usageCount: 18 },
  { name: "XGBoost", type: "Ensemble", usageCount: 15 },
  { name: "Random Forest", type: "Ensemble", usageCount: 12 },
  { name: "GRU", type: "RNN", usageCount: 8 }
]);

// 任务统计数据
const taskStats = ref({
  totalTasks: 12,
  completedTasks: 8,
  runningTasks: 3
});

// 运行中的任务
const runningTasks = ref([
  {
    id: "1",
    name: "电力负荷预测任务-01",
    dataset: "电力负荷数据集-01",
    model: "LSTM",
    progress: 75
  },
  {
    id: "2",
    name: "风力发电预测任务-02",
    dataset: "风力发电数据集-02",
    model: "Transformer",
    progress: 42
  },
  {
    id: "3",
    name: "太阳能发电预测任务-03",
    dataset: "太阳能发电数据集-03",
    model: "XGBoost",
    progress: 18
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

// 将模型类型或模型对象映射为一句简短的中文关键信息（单句、简洁）
const getModelDescription = (model: { name?: string; type?: string }) => {
  const type = model.type || "";
  const descMap: { [key: string]: string } = {
    "RNN": "擅长时间序列建模",
    "Attention": "擅长捕捉长距离依赖",
    "Ensemble": "集成提升稳健性",
    "Hybrid": "混合架构优势"
  };
  return descMap[type] || (type ? "类型：" + type : "模型");
};
</script>
