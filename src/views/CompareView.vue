<template>
  <v-stepper :items="['模型选择', '指标对比', '详细分析']" next-text="下一步" prev-text="上一步" v-model="currentStep">
    <!-- 第一步：模型选择 -->
    <template v-slot:[`item.1`]>
      <v-card title="模型对比配置" flat>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">选择对比模型</v-card-title>
                <div class="child-mbm-3">
                  <div class="" v-for="model in availableModels" :key="model.id" @click="updateClickedModel(model.id)">
                    <v-checkbox v-model="selectedModels" :value="model.id" :label="model.name"
                      :disabled="model.status !== 'trained'" class="select-none">
                      <template v-slot:append>
                        <v-chip :color="model.status === 'trained' ? 'success' : 'warning'" size="small" class="ml-2">
                          {{ model.status === 'trained' ? '已训练' : '未训练' }}
                        </v-chip>
                      </template>
                    </v-checkbox>
                  </div>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">对比配置</v-card-title>
                <v-select v-model="compareMetrics" :items="metricOptions" label="选择对比指标" multiple chips
                  variant="outlined" density="compact" class="mb-3"></v-select>

                <v-select v-model="chartType" :items="chartTypes" label="图表类型" variant="outlined" density="compact"
                  class="mb-3"></v-select>

                <v-switch v-model="showDataTable" label="显示数据表格" color="primary"></v-switch>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="mt-4">
            <v-col cols="12">
              <v-alert v-if="selectedModels.length < 2" type="warning" variant="outlined" class="mb-4">
                请至少选择两个已训练的模型进行对比
              </v-alert>

              <v-btn color="primary" :disabled="selectedModels.length < 2" @click="generateComparison"
                :loading="isGenerating">
                生成对比分析
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- 第二步：指标对比 -->
    <template v-slot:[`item.2`]>
      <v-card flat>
        <v-card-text>
          <!-- 数据表格 -->
          <v-card v-if="showDataTable" variant="flat" class="mb-6">
            <v-card-title class="text-h6">性能指标对比表</v-card-title>
            <v-card-text>
              <v-data-table :headers="headers" :items="filteredMetrics" class="elevation-1" :items-per-page="10"
                hide-default-footer>
                <template v-slot:[`item.model`]="{ item }">
                  <v-chip :color="getModelColor(item.model)" size="small">
                    {{ item.model }}
                  </v-chip>
                </template>
                <template v-slot:[`item.rmse`]="{ item }">
                  <span :class="getBestValueClass('rmse', item.rmse)">
                    {{ item.rmse.toFixed(4) }}
                  </span>
                </template>
                <template v-slot:[`item.mae`]="{ item }">
                  <span :class="getBestValueClass('mae', item.mae)">
                    {{ item.mae.toFixed(4) }}
                  </span>
                </template>
                <template v-slot:[`item.r2`]="{ item }">
                  <span :class="getBestValueClass('r2', item.r2)">
                    {{ item.r2.toFixed(4) }}
                  </span>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>

          <!-- 可视化图表 -->
          <v-card variant="flat">
            <v-card-title class="text-h6">性能指标可视化</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6" lg="6" xl="3">
                  <div ref="rmseChart" style="height:400px; margin:auto"></div>
                </v-col>
                <v-col cols="12" md="6" lg="6" xl="3">
                  <div ref="maeR2Chart" style="height:400px; margin:auto"></div>
                </v-col>
                <v-col cols="12" md="12" lg="12" xl="6">
                  <div ref="predictionChart" style="height:400px; margin:auto"></div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </template>

    <!-- 第三步：详细分析 -->
    <template v-slot:[`item.3`]>
      <v-card title="详细分析报告" flat>
        <v-card-text>
          <v-row>
            <!-- 最佳模型推荐 -->
            <v-col cols="12" md="6">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="success">mdi-trophy</v-icon>
                  最佳模型推荐
                </v-card-title>
                <v-card v-if="bestModel" color="success" variant="tonal" class="pa-3">
                  <div class="text-h6 mb-2">{{ bestModel.model }}</div>
                  <div class="text-body-2 mb-2">综合评分: {{ bestModel.score.toFixed(2) }}</div>
                  <v-chip-group>
                    <v-chip size="small" color="success">RMSE: {{ bestModel.rmse.toFixed(4) }}</v-chip>
                    <v-chip size="small" color="success">MAE: {{ bestModel.mae.toFixed(4) }}</v-chip>
                    <v-chip size="small" color="success">R²: {{ bestModel.r2.toFixed(4) }}</v-chip>
                  </v-chip-group>
                </v-card>
              </v-card>
            </v-col>

            <!-- 模型排名 -->
            <v-col cols="12" md="6">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="primary">mdi-podium</v-icon>
                  模型排名
                </v-card-title>
                <v-list>
                  <v-list-item v-for="(model, index) in rankedModels" :key="model.model" class="px-0">
                    <template v-slot:prepend>
                      <v-avatar :color="index === 0 ? 'gold' : index === 1 ? 'silver' : 'bronze'" size="24">
                        <span class="text-caption">{{ index + 1 }}</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ model.model }}</v-list-item-title>
                    <v-list-item-subtitle>综合评分: {{ model.score.toFixed(2) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>
          </v-row>

          <!-- 详细分析 -->
          <v-row class="mt-4">
            <v-col cols="12">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="info">mdi-chart-line</v-icon>
                  性能分析总结
                </v-card-title>
                <v-row>
                  <v-col col="12" xl="4" lg="6" md="12" sm="12" v-for="analysis in performanceAnalysis"
                    :key="analysis.metric">
                    <v-expansion-panels>
                      <v-expansion-panel :title="analysis.title" :model-value="true">
                        <v-expansion-panel-text>
                          <div class="text-body-1 mb-3">{{ analysis.description }}</div>
                          <v-alert :type="analysis.recommendation.type" variant="outlined" class="mb-2">
                            <strong>建议：</strong>{{ analysis.recommendation.text }}
                          </v-alert>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <!-- 模型导出功能 -->
          <v-row class="mt-4">
            <v-col cols="12">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="primary">mdi-download</v-icon>
                  模型导出
                </v-card-title>
                <v-card-text class="pa-0">
                  <div class="text-body-2 mb-4 text-medium-emphasis">
                    选择需要导出的模型和导出类型，支持导出训练好的模型文件、配置参数和模型定义文件。
                  </div>

                  <!-- 模型选择 -->
                  <v-row class="mb-1">
                    <v-col cols="12" md="6">
                      <v-select v-model="selectedExportModels" :items="filteredMetrics" item-title="model"
                        item-value="model" label="选择要导出的模型" multiple chips variant="outlined" hint="可选择多个模型进行批量导出"
                        persistent-hint></v-select>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select v-model="exportFormat" :items="exportFormats" label="导出格式" variant="outlined"
                        hint="选择模型文件的导出格式" persistent-hint></v-select>
                    </v-col>
                  </v-row>


                  <!-- 导出选项 -->
                  <v-expansion-panels class="mb-4" variant="accordion">
                    <v-expansion-panel title="高级导出选项">
                      <v-expansion-panel-text>
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-checkbox v-model="exportOptions.includeWeights" label="包含模型权重" density="compact"
                              hint="导出训练好的模型权重参数"></v-checkbox>
                            <v-checkbox v-model="exportOptions.includeOptimizer" label="包含优化器状态" density="compact"
                              hint="导出优化器的状态信息"></v-checkbox>
                            <v-checkbox v-model="exportOptions.includeMetrics" label="包含性能指标" density="compact"
                              hint="导出模型的性能评估指标"></v-checkbox>
                          </v-col>
                          <v-col cols="12" md="6">
                            <v-checkbox v-model="exportOptions.compressFiles" label="压缩导出文件" density="compact"
                              hint="将导出文件打包为ZIP格式"></v-checkbox>
                            <v-checkbox v-model="exportOptions.includeDocumentation" label="包含文档说明" density="compact"
                              hint="生成模型使用说明文档"></v-checkbox>
                            <v-text-field v-model="exportOptions.version" label="版本号" variant="outlined"
                              density="compact" hint="为导出的模型指定版本号"></v-text-field>
                          </v-col>
                        </v-row>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <!-- 导出按钮组 -->
                  <div class="d-flex flex-wrap gap-3">
                    <v-btn @click="exportModelFiles" prepend-icon="mdi-brain" color="primary"
                      :disabled="selectedExportModels.length === 0" :loading="isExportingModels">
                      导出模型文件
                    </v-btn>
                    <v-btn @click="exportModelConfigs" prepend-icon="mdi-cog" color="success"
                      :disabled="selectedExportModels.length === 0" :loading="isExportingConfigs">
                      导出配置参数
                    </v-btn>
                    <v-btn @click="exportModelDefinitions" prepend-icon="mdi-code-json" color="info"
                      :disabled="selectedExportModels.length === 0" :loading="isExportingDefinitions">
                      导出定义文件
                    </v-btn>
                  </div>


                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>
  </v-stepper>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import * as echarts from "echarts";
import { registChart } from "@/resize_charts";

interface Metric {
  model: string;
  rmse: number;
  mae: number;
  r2: number;
  mape?: number;
  training_time?: number;
  score?: number;
}

interface AvailableModel {
  id: string;
  name: string;
  status: "trained" | "training" | "pending";
  accuracy?: number;
}

interface EChartsTooltipParams {
  name: string;
  seriesName: string;
  value: number;
}

interface EChartsRadarTooltipParams {
  name: string;
  value: number[];
}

interface PerformanceAnalysis {
  metric: string;
  title: string;
  description: string;
  recommendation: {
    type: "success" | "warning" | "error" | "info";
    text: string;
  };
}

// 步骤控制
const currentStep = ref(1);

// 模型选择相关
const availableModels = ref<AvailableModel[]>([
  { id: "linear", name: "线性回归", status: "trained", accuracy: 0.85 },
  { id: "decision_tree", name: "决策树", status: "trained", accuracy: 0.72 },
  { id: "random_forest", name: "随机森林", status: "trained", accuracy: 0.68 },
  { id: "lstm", name: "LSTM", status: "trained", accuracy: 0.65 },
  { id: "xgboost", name: "XGBoost", status: "pending" },
  { id: "svm", name: "SVM", status: "training" }
]);

const selectedModels = ref<string[]>(["linear", "decision_tree"]);
const compareMetrics = ref<string[]>(["rmse", "mae", "r2"]);
const chartType = ref("bar");
const showDataTable = ref(true);
const isGenerating = ref(false);

// 模型导出相关
const selectedExportModels = ref<string[]>([]);
const exportFormat = ref("pytorch");
const isExportingModels = ref(false);
const isExportingConfigs = ref(false);
const isExportingDefinitions = ref(false);

const exportFormats = [
  { title: "PyTorch (.pth)", value: "pytorch" },
  { title: "TensorFlow (.pb)", value: "tensorflow" },
  { title: "ONNX (.onnx)", value: "onnx" },
  { title: "Scikit-learn (.pkl)", value: "sklearn" },
  { title: "JSON (.json)", value: "json" }
];

const exportOptions = ref({
  includeWeights: true,
  includeOptimizer: false,
  includeMetrics: true,
  compressFiles: true,
  includeDocumentation: true,
  version: "1.0.0"
});

const updateClickedModel = (modelId: string) => {
  if (selectedModels.value.includes(modelId)) {
    selectedModels.value = selectedModels.value.filter(id => id !== modelId);
  } else {
    selectedModels.value.push(modelId);
  }
};

// 对比配置选项
const metricOptions = [
  { title: "均方根误差 (RMSE)", value: "rmse" },
  { title: "平均绝对误差 (MAE)", value: "mae" },
  { title: "决定系数 (R²)", value: "r2" },
  { title: "平均绝对百分比误差 (MAPE)", value: "mape" },
  { title: "训练时间", value: "training_time" }
];

const chartTypes = [
  { title: "柱状图", value: "bar" },
  { title: "雷达图", value: "radar" },
  { title: "散点图", value: "scatter" }
];

// 表格头部配置
const headers = computed(() => [
  { title: "模型", value: "model", sortable: true },
  { title: "均方根误差 (RMSE)", value: "rmse", sortable: true },
  { title: "平均绝对误差 (MAE)", value: "mae", sortable: true },
  { title: "决定系数 (R²)", value: "r2", sortable: true }
]);

// 模拟的指标数据
const allMetrics: Metric[] = [
  { model: "线性回归", rmse: 0.6234, mae: 0.7812, r2: 0.8534, mape: 12.5, training_time: 2.3 },
  { model: "决策树", rmse: 0.5512, mae: 0.8534, r2: 0.7234, mape: 15.2, training_time: 5.7 },
  { model: "随机森林", rmse: 0.5123, mae: 0.8812, r2: 0.6834, mape: 13.8, training_time: 18.4 },
  { model: "LSTM", rmse: 0.4834, mae: 0.9012, r2: 0.6512, mape: 11.3, training_time: 45.2 },
  { model: "XGBoost", rmse: 0.4623, mae: 0.7234, r2: 0.8912, mape: 9.8, training_time: 12.1 },
  { model: "SVM", rmse: 0.5834, mae: 0.8123, r2: 0.7456, mape: 14.6, training_time: 8.9 }
];

// 筛选后的指标数据
const filteredMetrics = computed(() => {
  const modelNames = selectedModels.value.map(id => {
    const model = availableModels.value.find(m => m.id === id);
    return model?.name || id;
  });
  return allMetrics.filter(metric => modelNames.includes(metric.model));
});

// 图表引用
const rmseChart = ref<HTMLDivElement | null>(null);
const maeR2Chart = ref<HTMLDivElement | null>(null);
const predictionChart = ref<HTMLDivElement | null>(null);

// 生成模拟的预测数据
const generatePredictionData = (modelName: string, numPoints: number = 50) => {
  const actualValues: number[] = [];
  const predictedValues: number[] = [];

  // 基于模型性能生成不同精度的预测数据
  const model = allMetrics.find(m => m.model === modelName);
  const baseAccuracy = model ? (1 - model.rmse) : 0.7; // 使用RMSE来确定准确性

  for (let i = 0; i < numPoints; i++) {
    // 生成实际值（模拟时间序列数据）
    const time = i / numPoints * 4 * Math.PI;
    const actual = 50 + 20 * Math.sin(time) + 10 * Math.cos(time * 2) + (Math.random() - 0.5) * 5;
    actualValues.push(actual);

    // 基于实际值和模型精度生成预测值
    const noise = (Math.random() - 0.5) * 10 * (1 - baseAccuracy);
    const predicted = actual + noise;
    predictedValues.push(predicted);
  }

  return { actualValues, predictedValues };
};

// 获取所有选中模型的预测数据
const predictionData = computed(() => {
  return filteredMetrics.value.map(metric => ({
    modelName: metric.model,
    ...generatePredictionData(metric.model)
  }));
});

// 最佳模型计算
const bestModel = computed(() => {
  if (filteredMetrics.value.length === 0) return null;

  // 计算综合评分 (R²权重最高，RMSE和MAE权重较低)
  const modelsWithScore = filteredMetrics.value.map(metric => ({
    ...metric,
    score: metric.r2 * 0.5 + (1 - metric.rmse) * 0.25 + (1 - metric.mae) * 0.25
  }));

  return modelsWithScore.reduce((best, current) =>
    current.score > best.score ? current : best
  );
});

// 模型排名
const rankedModels = computed(() => {
  if (filteredMetrics.value.length === 0) return [];

  const modelsWithScore = filteredMetrics.value.map(metric => ({
    ...metric,
    score: metric.r2 * 0.5 + (1 - metric.rmse) * 0.25 + (1 - metric.mae) * 0.25
  }));

  return modelsWithScore.sort((a, b) => b.score - a.score);
});

// 性能分析
const performanceAnalysis = computed<PerformanceAnalysis[]>(() => [
  {
    metric: "rmse",
    title: "RMSE (均方根误差) 分析",
    description: "RMSE值越小表示模型预测误差越小。当前对比中，" +
      (bestModel.value ? `${bestModel.value.model}表现最佳，RMSE为${bestModel.value.rmse.toFixed(4)}` : "暂无数据"),
    recommendation: {
      type: "info",
      text: "RMSE适合评估模型对异常值的敏感性，建议关注RMSE较低的模型。"
    }
  },
  {
    metric: "mae",
    title: "MAE (平均绝对误差) 分析",
    description: "MAE反映了预测值与真实值的平均偏差程度。MAE对异常值不如RMSE敏感。",
    recommendation: {
      type: "success",
      text: "如果数据中存在较多异常值，建议重点考虑MAE指标。"
    }
  },
  {
    metric: "r2",
    title: "R² (决定系数) 分析",
    description: "R²值越接近1表示模型拟合效果越好，能够解释的方差比例越高。",
    recommendation: {
      type: bestModel.value && bestModel.value.r2 > 0.8 ? "success" : "warning",
      text: bestModel.value && bestModel.value.r2 > 0.8 ?
        "当前最佳模型的R²值较高，拟合效果良好。" :
        "建议进一步优化模型参数或考虑特征工程以提高R²值。"
    }
  }
]);

// 生成对比分析
const generateComparison = async () => {
  isGenerating.value = true;
  // 模拟生成过程
  await new Promise(resolve => setTimeout(resolve, 2000));
  isGenerating.value = false;
  currentStep.value = 2;
};

// 获取模型颜色
const getModelColor = (modelName: string) => {
  const colors = ["primary", "secondary", "success", "warning", "error", "info"];
  const index = filteredMetrics.value.findIndex(m => m.model === modelName);
  return colors[index % colors.length];
};

// 获取最佳值的样式类
const getBestValueClass = (metric: string, value: number) => {
  const values = filteredMetrics.value.map(m => m[metric as keyof Metric] as number);
  const isBest = metric === "r2" ?
    value === Math.max(...values) :
    value === Math.min(...values);
  return isBest ? "font-weight-bold text-success" : "";
};

// 模型导出功能
const exportModelFiles = async () => {
  isExportingModels.value = true;
  try {
    // 模拟模型文件导出过程
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 生成下载链接
    const exportData = {
      models: selectedExportModels.value,
      format: exportFormat.value,
      options: exportOptions.value,
      timestamp: new Date().toISOString()
    };

    // 模拟文件下载
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `models_${exportFormat.value}_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`导出模型文件: ${selectedExportModels.value.join(", ")} - 格式: ${exportFormat.value}`);
  } catch (error) {
    console.error("模型文件导出失败:", error);
  } finally {
    isExportingModels.value = false;
  }
};

const exportModelConfigs = async () => {
  isExportingConfigs.value = true;
  try {
    // 模拟配置参数导出过程
    await new Promise(resolve => setTimeout(resolve, 2000));

    const configData = selectedExportModels.value.map(modelName => {
      const metric = filteredMetrics.value.find(m => m.model === modelName);
      return {
        modelName,
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 32,
          epochs: 100,
          optimizer: "Adam",
          loss_function: "MSE"
        },
        architecture: {
          layers: ["Dense(64)", "ReLU", "Dense(32)", "ReLU", "Dense(1)"],
          input_shape: [96],
          output_shape: [1]
        },
        performance: metric ? {
          rmse: metric.rmse,
          mae: metric.mae,
          r2: metric.r2
        } : null,
        version: exportOptions.value.version
      };
    });

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model_configs_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`导出配置参数: ${selectedExportModels.value.join(", ")}`);
  } catch (error) {
    console.error("配置参数导出失败:", error);
  } finally {
    isExportingConfigs.value = false;
  }
};

const exportModelDefinitions = async () => {
  isExportingDefinitions.value = true;
  try {
    // 模拟模型定义文件导出过程
    await new Promise(resolve => setTimeout(resolve, 2500));

    const definitionData = selectedExportModels.value.map(modelName => {
      return {
        modelName,
        framework: exportFormat.value,
        definition: {
          class: `${modelName.replace(/\s+/g, "")}Model`,
          imports: [
            "import torch",
            "import torch.nn as nn",
            "import numpy as np"
          ],
          code: `
class ${modelName.replace(/\s+/g, "")}Model(nn.Module):
    def __init__(self, input_size=96, hidden_size=64, output_size=1):
        super().__init__()
        self.layer1 = nn.Linear(input_size, hidden_size)
        self.layer2 = nn.Linear(hidden_size, 32)
        self.layer3 = nn.Linear(32, output_size)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.relu(self.layer2(x))
        x = self.layer3(x)
        return x
          `,
          usage_example: `
# 模型使用示例
model = ${modelName.replace(/\s+/g, "")}Model()
input_tensor = torch.randn(1, 96)
output = model(input_tensor)
print(f"预测结果: {output.item():.4f}")
          `
        },
        created_at: new Date().toISOString(),
        version: exportOptions.value.version
      };
    });

    const blob = new Blob([JSON.stringify(definitionData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `model_definitions_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`导出定义文件: ${selectedExportModels.value.join(", ")}`);
  } catch (error) {
    console.error("定义文件导出失败:", error);
  } finally {
    isExportingDefinitions.value = false;
  }
};

// 初始化图表
const initializeCharts = () => {
  // RMSE柱状图
  if (rmseChart.value && filteredMetrics.value.length > 0) {
    const chart = echarts.init(rmseChart.value);
    chart.setOption({
      title: { text: "RMSE 对比", left: "center" },
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>RMSE: {c}"
      },
      xAxis: {
        type: "category",
        data: filteredMetrics.value.map(m => m.model),
        axisLabel: { interval: 0, rotate: 30 }
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
        data: filteredMetrics.value.map(m => m.rmse),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#1976d2" },
            { offset: 1, color: "#42a5f5" }
          ])
        },
        barWidth: "60%"
      }],
      grid: { bottom: 80 }
    });

    registChart(chart);
  }

  // MAE与R²对比图
  if (maeR2Chart.value && filteredMetrics.value.length > 0) {
    const chart = echarts.init(maeR2Chart.value);
    chart.setOption({
      title: { text: "MAE 与 R² 对比", left: "center" },
      tooltip: {
        trigger: "axis",
        formatter: function (params: EChartsTooltipParams[]) {
          let result = params[0].name + "<br/>";
          params.forEach((param: EChartsTooltipParams) => {
            result += param.seriesName + ": " + param.value.toFixed(4) + "<br/>";
          });
          return result;
        }
      },
      legend: {
        data: ["MAE", "R²"],
        bottom: 10
      },
      xAxis: {
        type: "category",
        data: filteredMetrics.value.map(m => m.model),
        axisLabel: { interval: 0, rotate: 30 }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        interval: 0.1,
        name: "数值"
      },
      series: [
        {
          name: "MAE",
          type: "bar",
          data: filteredMetrics.value.map(m => m.mae),
          itemStyle: { color: "#43a047" },
          barWidth: "30%"
        },
        {
          name: "R²",
          type: "bar",
          data: filteredMetrics.value.map(m => m.r2),
          itemStyle: { color: "#fbc02d" },
          barWidth: "30%"
        }
      ],
      grid: { bottom: 80 }
    });

    registChart(chart);
  }

  // 预测值与实际值对比图
  if (predictionChart.value && filteredMetrics.value.length > 0) {
    const chart = echarts.init(predictionChart.value);

    // 准备系列数据
    const series: echarts.SeriesOption[] = [];
    const colors = ["#1976d2", "#43a047", "#fbc02d", "#e91e63", "#9c27b0", "#ff9800"];

    // 添加实际值系列（所有模型共用同一条实际值线）
    const actualData = predictionData.value[0]?.actualValues || [];
    series.push({
      name: "实际值",
      type: "line",
      data: actualData,
      itemStyle: { color: "#000000" },
      lineStyle: { width: 3, type: "solid", opacity: 0.5 },
      symbol: "circle",
      symbolSize: 0
    });

    // 为每个模型添加预测值系列
    predictionData.value.forEach((data, index) => {
      series.push({
        name: `${data.modelName}预测值`,
        type: "line",
        data: data.predictedValues,
        itemStyle: { color: colors[index % colors.length] },
        lineStyle: { width: 2, type: "dashed" },
        symbol: "diamond",
        symbolSize: 3
      });
    });

    chart.setOption({
      title: { text: "预测值与实际值对比", left: "center" },
      tooltip: {
        trigger: "axis",
        formatter: function (params: { dataIndex: number; seriesName: string; value: number }[]) {
          let result = `时间点 ${params[0].dataIndex + 1}<br/>`;
          params.forEach((param: { seriesName: string; value: number }) => {
            result += `${param.seriesName}: ${param.value.toFixed(2)}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ["实际值", ...predictionData.value.map(d => `${d.modelName}预测值`)],
        bottom: 10,
        type: "scroll"
      },
      xAxis: {
        type: "category",
        data: Array.from({ length: actualData.length }, (_, i) => i + 1),
        name: "时间点",
        nameLocation: "middle",
        nameGap: 25
      },
      yAxis: {
        type: "value",
        name: "数值",
        nameLocation: "middle",
        nameGap: 40
      },
      series: series,
      grid: {
        left: 60,
        right: 20,
        bottom: 80,
        top: 60
      },
      dataZoom: [
        {
          type: "slider",
          start: 0,
          end: 100,
          height: 20,
          bottom: 20
        }
      ]
    });

    registChart(chart);
  }
};

// 监听数据变化重新初始化图表
watch([filteredMetrics, currentStep], () => {
  if (currentStep.value >= 2) {
    setTimeout(initializeCharts, 100);
  }
}, { deep: true });

onMounted(() => {
  if (currentStep.value >= 2) {
    setTimeout(initializeCharts, 100);
  }
});
</script>

<style scoped>
.v-card-title {
  font-weight: 600;
}
</style>
