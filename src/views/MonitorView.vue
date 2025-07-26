<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card title="模型训练实时监控" flat>
          <v-card-text>
            <!-- 批量操作按钮 -->
            <div class="d-flex justify-space-between align-center mb-4">
              <v-btn @click="startAllTraining" color="primary" prepend-icon="mdi-play" :disabled="isAnyTraining">
                开始全部训练
              </v-btn>
              <v-btn @click="stopAllTraining" color="error" prepend-icon="mdi-stop" variant="outlined"
                :disabled="!isAnyTraining">
                停止全部训练
              </v-btn>
            </div>

            <!-- 训练进度总览 -->
            <v-card variant="tonal" color="primary" class="mb-4">
              <v-card-text>
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-h6">训练总进度</div>
                    <div class="text-body-2">{{ completedModels }}/{{ selectedAiModels.length }} 个模型已完成</div>
                  </div>
                  <div class="text-right">
                    <div class="text-h4">{{ Math.round(overallProgress) }}%</div>
                  </div>
                </div>
                <v-progress-linear :model-value="overallProgress" color="white" class="mt-2"
                  height="8"></v-progress-linear>
              </v-card-text>
            </v-card>

            <!-- 每个选中的模型训练组件 -->
            <v-row>
              <v-col col="12" md="12" lg="6" xl="4" xxl="3" v-for="(model, idx) in selectedAiModels" :key="model.id">
                <ModelTrainer :model="model" :train-params="trainParams" @training-completed="onModelCompleted"
                  :ref="el => modelTrainerRefs[idx] = (el as any)" />
              </v-col>
            </v-row>

            <!-- 训练总结（当有模型完成训练时显示） -->
            <TrainingSummary v-if="completedModels > 0" :model-results="modelResults" />

            <!-- 没有选择模型的提示 -->
            <v-alert v-if="selectedAiModels.length === 0" type="info" variant="tonal" class="text-center">
              <div class="text-h6 mb-2">当前没有正在训练的模型</div>
              <div class="text-body-2">请前往训练配置页面选择要训练的模型</div>
              <v-btn class="mt-3" color="primary" to="/train" variant="outlined">
                前往训练配置
              </v-btn>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import { ref, computed, onMounted, nextTick } from "vue";
import ModelTrainer from "@/components/ModelTrainer.vue";
import TrainingSummary from "@/components/TrainingSummary.vue";

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement);

// 训练参数（可从 TrainView 传递或从全局状态获取）
const trainParams = ref({
  seq_len: 96,
  label_len: 48,
  pred_len: 24,
  batch_size: 32,
  epochs: 100
});

// AI模型数据
const aiModels = ref([
  {
    id: 1,
    name: "LSTM",
    title: "LSTM - 长短期记忆网络",
    description: "长短期记忆网络，适合时序预测",
    type: "RNN",
    complexity: "medium"
  },
  {
    id: 2,
    name: "GRU",
    title: "GRU - 门控循环单元",
    description: "门控循环单元，轻量级RNN",
    type: "RNN",
    complexity: "medium"
  },
  {
    id: 3,
    name: "Transformer",
    title: "Transformer - 注意力机制",
    description: "注意力机制，处理长序列",
    type: "Attention",
    complexity: "high"
  },
  {
    id: 4,
    name: "Informer",
    title: "Informer - 高效长序列预测",
    description: "高效长序列预测模型",
    type: "Attention",
    complexity: "high"
  },
  {
    id: 5,
    name: "CNN-LSTM",
    title: "CNN-LSTM - 混合模型",
    description: "卷积神经网络+LSTM混合模型",
    type: "Hybrid",
    complexity: "high"
  },
  {
    id: 6,
    name: "Random Forest",
    title: "Random Forest - 随机森林",
    description: "随机森林集成学习",
    type: "Ensemble",
    complexity: "medium"
  }
]);

// 当前选中的模型ID（可以从路由参数或全局状态获取）
const selectedModelIds = ref<number[]>([1, 3]);

// 训练状态管理
const completedModelIds = ref(new Set<number>());
const modelResults = ref<{
  id: number;
  name: string;
  type: string;
  accuracy: number;
  finalLoss: number;
  trainingTime: number;
  status: "completed" | "training" | "failed";
}[]>([]);

const isAnyTraining = ref(false);
const modelTrainerRefs = ref<(InstanceType<typeof ModelTrainer> | null)[]>([]);

// 计算属性
const selectedAiModels = computed(() =>
  aiModels.value.filter(model => selectedModelIds.value.includes(model.id))
);

const completedModels = computed(() => completedModelIds.value.size);

const overallProgress = computed(() => {
  if (selectedAiModels.value.length === 0) return 0;
  return (completedModels.value / selectedAiModels.value.length) * 100;
});

// 方法
const startAllTraining = async () => {
  isAnyTraining.value = true;
  // 重置训练结果
  completedModelIds.value.clear();
  modelResults.value = [];
  // 触发所有模型组件开始训练
  await nextTick();
  modelTrainerRefs.value.forEach(refItem => {
    if (refItem && typeof refItem.startTraining === "function") {
      refItem.startTraining();
    }
  });
};

const stopAllTraining = () => {
  isAnyTraining.value = false;
  // 这里可以触发所有模型组件停止训练
};

const onModelCompleted = (modelId: number) => {
  completedModelIds.value.add(modelId);

  // 找到对应的模型信息
  const model = selectedAiModels.value.find(m => m.id === modelId);
  if (model) {
    // 生成模拟的训练结果
    const result = {
      id: modelId,
      name: model.name,
      type: model.type,
      accuracy: 75 + Math.random() * 20, // 75-95% 的准确率
      finalLoss: 0.01 + Math.random() * 0.1, // 0.01-0.11 的最终损失
      trainingTime: Math.floor(5 + Math.random() * 15), // 5-20分钟的训练时间
      status: "completed" as const
    };

    modelResults.value.push(result);
  }

  // 检查是否所有模型都完成了训练
  if (completedModels.value === selectedAiModels.value.length) {
    isAnyTraining.value = false;
  }
};

// 页面挂载时可以从路由参数或全局状态加载选中的模型
onMounted(() => {
  // 这里可以添加从路由参数或全局状态获取选中模型的逻辑
  // 例如：从 URL 查询参数获取选中的模型ID
  // const route = useRoute();
  // if (route.query.models) {
  //   selectedModelIds.value = JSON.parse(route.query.models as string);
  // }
});
</script>
