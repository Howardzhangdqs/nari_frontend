<template>
  <v-card class="mb-4">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2" color="success">mdi-chart-line</v-icon>
      训练结果总览
    </v-card-title>

    <v-card-text>
      <!-- 总体统计 -->
      <v-row class="mb-4">
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 text-primary text-bold">{{ totalModels }}</div>
            <div class="text-caption">训练模型数</div>
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 text-success text-bold">{{ completedModels }}</div>
            <div class="text-caption">已完成</div>
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 text-info text-bold">{{ averageAccuracy.toFixed(1) }}%</div>
            <div class="text-caption">平均准确率</div>
          </div>
        </v-col>
        <v-col cols="6" md="3">
          <div class="text-center">
            <div class="text-h4 text-warning text-bold">{{ totalTrainingTime }}</div>
            <div class="text-caption">总训练时间(分钟)</div>
          </div>
        </v-col>
      </v-row>

      <!-- 模型排行榜 -->
      <div class="mb-4">
        <div class="text-subtitle-1 mb-3">模型性能排行</div>
        <v-list density="compact">
          <v-list-item v-for="(model, index) in sortedModelResults" :key="model.id" class="px-0">
            <template v-slot:prepend>
              <v-chip :color="getRankColor(index)" size="small" class="mr-3">
                {{ index + 1 }}
              </v-chip>
            </template>

            <v-list-item-title>{{ model.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ model.type }}</v-list-item-subtitle>

            <template v-slot:append>
              <div class="text-right">
                <div class="text-body-1 font-weight-medium">{{ model.accuracy.toFixed(2) }}%</div>
                <div class="text-caption">Loss: {{ model.finalLoss.toFixed(4) }}</div>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- 快速操作 -->
      <v-divider class="mb-4"></v-divider>
      <div class="d-flex justify-end gap-2">
        <v-btn variant="outlined" prepend-icon="mdi-download">
          导出报告
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-chart-box">
          详细分析
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-rocket">
          部署最优模型
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { computed } from "vue";

// Props
interface ModelResult {
  id: number;
  name: string;
  type: string;
  accuracy: number;
  finalLoss: number;
  trainingTime: number;
  status: "completed" | "training" | "failed";
}

const props = defineProps<{
  modelResults: ModelResult[];
}>();

// 计算属性
const totalModels = computed(() => props.modelResults.length);

const completedModels = computed(() =>
  props.modelResults.filter(model => model.status === "completed").length
);

const averageAccuracy = computed(() => {
  const completedResults = props.modelResults.filter(model => model.status === "completed");
  if (completedResults.length === 0) return 0;

  const totalAccuracy = completedResults.reduce((sum, model) => sum + model.accuracy, 0);
  return totalAccuracy / completedResults.length;
});

const totalTrainingTime = computed(() =>
  props.modelResults.reduce((sum, model) => sum + model.trainingTime, 0)
);

const sortedModelResults = computed(() =>
  [...props.modelResults]
    .filter(model => model.status === "completed")
    .sort((a, b) => b.accuracy - a.accuracy)
);

// 方法
const getRankColor = (index: number) => {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "grey-lighten-2";
};
</script>

<style scoped>
.v-list-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.v-list-item:last-child {
  border-bottom: none;
}
</style>
