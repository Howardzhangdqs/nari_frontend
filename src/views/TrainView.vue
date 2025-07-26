<template>
  <v-stepper :items="['参数配置', '模型选择']" next-text="下一步" prev-text="上一步" v-model="currentStep">
    <!-- 第一步：参数配置 -->
    <template v-slot:[`item.1`]>
      <v-card title="模型训练参数配置" flat>
        <!-- 参数输入方式选择 -->
        <v-radio-group v-model="paramInputMethod" inline class="mb-4">
          <v-radio label="手动输入参数" value="manual"></v-radio>
          <v-radio label="文件导入参数" value="file"></v-radio>
        </v-radio-group>

        <!-- 手动输入参数 -->
        <div v-if="paramInputMethod === 'manual'">
          <v-row>
            <v-col cols="12" md="12" lg="6" xl="4" sm="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-h6 pa-0 mb-3">基础训练参数</v-card-title>
                <v-row class="child-mbm-2">
                  <v-col cols="12" md="4">
                    <v-text-field v-model="trainParams.seq_len" label="序列长度 (Seq_Len)" type="number" variant="outlined"
                      density="compact" hint="输入序列的长度"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="trainParams.label_len" label="标签长度 (Label_Len)" type="number"
                      variant="outlined" density="compact" hint="标签序列的长度"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field v-model="trainParams.pred_len" label="预测长度 (Pred_Len)" type="number"
                      variant="outlined" density="compact" hint="预测序列的长度"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="trainParams.batch_size" label="批次大小 (Batch Size)" type="number"
                      variant="outlined" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="trainParams.epochs" label="训练轮数 (Epochs)" type="number" variant="outlined"
                      density="compact"></v-text-field>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <v-col cols="12" md="12" lg="6" xl="4" sm="6">
              <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-h6 pa-0 mb-3">超参数优化范围</v-card-title>
                <v-row class="child-mbm-2">
                  <v-col cols="12" md="6">
                    <v-text-field v-model="hyperParams.learning_rate_min" label="学习率最小值" type="number" step="0.0001"
                      variant="outlined" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="hyperParams.learning_rate_max" label="学习率最大值" type="number" step="0.0001"
                      variant="outlined" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="hyperParams.dropout_min" label="Dropout最小值" type="number" step="0.01"
                      variant="outlined" density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="hyperParams.dropout_max" label="Dropout最大值" type="number" step="0.01"
                      variant="outlined" density="compact"></v-text-field>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>

            <v-col cols="12" md="12" lg="6" xl="4" sm="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">归一化参数</v-card-title>
                <v-row style="align-items: center; margin-bottom: -40px;">
                  <v-col cols="12" md="6">
                    <v-select v-model="normalizationParams.method" :items="normalizationMethods" label="归一化方法"
                      variant="outlined" density="compact"></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-switch v-model="normalizationParams.inverse" label="支持反归一化" color="primary"></v-switch>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- 文件导入参数 -->
        <div v-if="paramInputMethod === 'file'">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 pa-0 mb-3">参数文件导入</v-card-title>

            <v-file-input v-model="paramFile" label="选择参数文件" accept=".csv,.xlsx,.yaml,.yml" show-size variant="outlined"
              class="mb-3" hint="支持 CSV、Excel 或 YAML 格式的参数配置文件"></v-file-input>

            <!-- 列名映射配置 -->
            <v-expansion-panels variant="accordion" v-if="paramFile.length > 0">
              <v-expansion-panel title="列名映射配置">
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-text-field v-model="columnMapping.seq_len" label="Seq_Len 列名" variant="outlined"
                        density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field v-model="columnMapping.label_len" label="Label_Len 列名" variant="outlined"
                        density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-text-field v-model="columnMapping.pred_len" label="Pred_Len 列名" variant="outlined"
                        density="compact"></v-text-field>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="mt-4">
              <v-btn @click="loadParamFile" color="primary" :loading="isLoadingParams">
                加载参数配置
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-card>
    </template>

    <!-- 第二步：模型选择 -->
    <template v-slot:[`item.2`]>
      <v-card flat>
        <!-- 特征工程模型 -->
        <div class="mb-6">
          <div class="text-h6 mb-3">特征工程方法</div>
          <v-row>
            <v-col v-for="method in featureEngineeringMethods" :key="method.id" cols="12" md="4" lg="3">
              <v-card variant="outlined" class="pa-3" :class="{ 'border-primary': method.selected }"
                @click="method.selected = !method.selected">
                <div class="d-flex align-center mb-2">
                  <v-checkbox v-model="method.selected" :label="method.name" color="primary" hide-details
                    style="margin: -13px 0"></v-checkbox>
                </div>
                <div class="text-body-2 text-medium-emphasis mb-2" style="user-select: none;">{{ method.description }}
                </div>
                <v-chip size="x-small" :color="method.type === 'statistical' ? 'blue' : 'green'">
                  {{ method.type === 'statistical' ? '统计方法' : '机器学习' }}
                </v-chip>
              </v-card>
            </v-col>
          </v-row>
        </div>

        <!-- AI模型选择 -->
        <div class="mb-6">
          <div class="text-h6 mb-3">人工智能模型</div>
          <v-row>
            <v-col cols="12" md="6">
              <v-select v-model="selectedModelIds" :items="aiModels" item-title="title" item-value="id" label="选择AI模型"
                multiple chips closable-chips variant="outlined" hint="可选择多个模型进行训练" persistent-hint>
                <template v-slot:selection="{ item, index }">
                  <v-chip v-if="index < 3" size="small" closable @click:close="removeModel(item.raw.id)">
                    {{ item.raw.name }}
                  </v-chip>
                  <span v-if="index === 3" class="text-grey text-caption align-self-center">
                    (+{{ selectedModelIds.length - 3 }} 其他)
                  </span>
                </template>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.name">
                    <template v-slot:prepend="{ isActive }">
                      <v-list-item-action start>
                        <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
                      </v-list-item-action>
                    </template>
                    <v-list-item-subtitle>
                      {{ item.raw.description }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <div class="d-flex gap-1" style="gap: 4px">
                        <v-chip size="x-small" :color="getModelTypeColor(item.raw.type)">
                          {{ item.raw.type }}
                        </v-chip>
                        <v-chip size="x-small" :color="item.raw.complexity === 'high' ? 'orange' : 'green'">
                          {{ item.raw.complexity === 'high' ? '高复杂度' : '中等复杂度' }}
                        </v-chip>
                      </div>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
          </v-row>
        </div>

        <!-- 选择摘要 -->
        <v-card variant="tonal" color="primary" class="pa-4">
          <v-card-title class="text-h6 pa-0 mb-2">模型组合摘要</v-card-title>
          <div class="text-body-1">
            已选择 <strong>{{ selectedFeatureMethods.length }}</strong> 种特征工程方法，
            <strong>{{ selectedAiModels.length }}</strong> 个AI模型
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            预计训练时间：{{ estimatedTrainingTime }} 分钟
          </div>
          <div class="mt-4">
            <v-btn color="primary" size="large" @click="startTraining" :disabled="selectedAiModels.length === 0">
              开始训练
            </v-btn>
            <v-btn color="info" variant="outlined" class="ml-3" @click="goToMonitor">
              查看训练监控
            </v-btn>
          </div>
        </v-card>
      </v-card>
    </template>
  </v-stepper>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 步骤控制
const currentStep = ref(1);

// 参数输入方式
const paramInputMethod = ref<"manual" | "file">("manual");

// 训练参数
const trainParams = ref({
  seq_len: 96,
  label_len: 48,
  pred_len: 24,
  batch_size: 32,
  epochs: 100
});

// 超参数优化范围
const hyperParams = ref({
  learning_rate_min: 0.0001,
  learning_rate_max: 0.001,
  dropout_min: 0.1,
  dropout_max: 0.5
});

// 归一化参数
const normalizationParams = ref({
  method: "StandardScaler",
  inverse: true
});

const normalizationMethods = [
  "StandardScaler",
  "MinMaxScaler",
  "RobustScaler",
  "Normalizer"
];

// 文件导入相关
const paramFile = ref<File[]>([]);
const isLoadingParams = ref(false);
const columnMapping = ref({
  seq_len: "",
  label_len: "",
  pred_len: ""
});

// 特征工程方法
const featureEngineeringMethods = ref([
  {
    id: 1,
    name: "主成分分析",
    description: "PCA降维，提取主要特征",
    type: "statistical",
    selected: false
  },
  {
    id: 2,
    name: "独立成分分析",
    description: "ICA分离独立信号源",
    type: "statistical",
    selected: false
  },
  {
    id: 3,
    name: "特征选择",
    description: "基于方差和相关性的特征筛选",
    type: "statistical",
    selected: true
  },
  {
    id: 4,
    name: "时序分解",
    description: "STL时序分解提取趋势季节性",
    type: "statistical",
    selected: true
  },
  {
    id: 5,
    name: "自编码器",
    description: "深度学习特征提取",
    type: "ml",
    selected: false
  },
  {
    id: 6,
    name: "聚类分析",
    description: "K-means无监督特征构造",
    type: "ml",
    selected: false
  }
]);

// AI模型
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

// 选中的模型ID数组
const selectedModelIds = ref<number[]>([1, 3]);

// 移除模型方法
const removeModel = (modelId: number) => {
  const index = selectedModelIds.value.indexOf(modelId);
  if (index > -1) {
    selectedModelIds.value.splice(index, 1);
  }
};

// 计算属性
const selectedFeatureMethods = computed(() =>
  featureEngineeringMethods.value.filter(method => method.selected)
);

const selectedAiModels = computed(() =>
  aiModels.value.filter(model => selectedModelIds.value.includes(model.id))
);

const estimatedTrainingTime = computed(() => {
  const baseTime = 1; // 基础时间（分钟）
  const featureTime = selectedFeatureMethods.value.length * 2;
  const modelTime = selectedAiModels.value.length * 10;
  return baseTime + featureTime + modelTime;
});

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

// 方法
const loadParamFile = async () => {
  isLoadingParams.value = true;
  try {
    // 模拟文件加载
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 模拟从文件中读取的参数
    trainParams.value = {
      seq_len: 120,
      label_len: 60,
      pred_len: 30,
      batch_size: 64,
      epochs: 150
    };

    alert("参数配置文件加载成功！");
  } catch (error) {
    console.error("参数文件加载失败:", error);
  } finally {
    isLoadingParams.value = false;
  }
};

const startTraining = () => {
  // 这里可以启动训练任务，然后跳转到监控页面
  // 可以将选中的模型信息传递给监控页面
  router.push({
    path: "/monitor",
    query: {
      models: JSON.stringify(selectedModelIds.value)
    }
  });
};

const goToMonitor = () => {
  router.push("/monitor");
};
</script>
