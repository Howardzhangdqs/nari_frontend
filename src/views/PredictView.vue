<template>
  <v-stepper :items="['预测配置', '模型预测', '结果分析']" next-text="下一步" prev-text="上一步" v-model="currentStep">
    <!-- 第一步：预测配置 -->
    <template v-slot:[`item.1`]>
      <v-card title="预测参数配置" flat>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">选择预测模型</v-card-title>
                <v-select v-model="selectedModel" :items="trainedModels" item-title="name" item-value="id"
                  label="选择已训练的模型" variant="outlined" density="compact" class="mb-3">
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:append>
                        <v-chip :color="item.raw.accuracy > 0.8 ? 'success' : 'warning'" size="small">
                          准确率: {{ (item.raw.accuracy * 100).toFixed(1) }}%
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>

                <v-text-field v-model="predictionLength" label="预测长度" type="number" variant="outlined" density="compact"
                  hint="预测未来多少个时间点" class="mb-3"></v-text-field>

                <v-select v-model="predictionMode" :items="predictionModes" label="预测模式" variant="outlined"
                  density="compact" class="mb-3"></v-select>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">数据输入配置</v-card-title>

                <v-radio-group v-model="inputDataSource" class="mb-3">
                  <v-radio label="使用历史数据" value="historical"></v-radio>
                  <v-radio label="上传新数据" value="upload"></v-radio>
                  <v-radio label="实时数据流" value="realtime"></v-radio>
                </v-radio-group>

                <!-- 历史数据选择 -->
                <div v-if="inputDataSource === 'historical'">
                  <v-select v-model="selectedDataset" :items="availableDatasets" label="选择数据集" variant="outlined"
                    density="compact" class="mb-3"></v-select>

                  <v-row>
                    <v-col cols="6">
                      <v-text-field v-model="dateRange.start" label="开始日期" type="date" variant="outlined"
                        density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="dateRange.end" label="结束日期" type="date" variant="outlined"
                        density="compact"></v-text-field>
                    </v-col>
                  </v-row>
                </div>

                <!-- 文件上传 -->
                <div v-if="inputDataSource === 'upload'">
                  <v-file-input v-model="uploadedFile" label="上传预测数据" accept=".csv,.xlsx" show-size variant="outlined"
                    class="mb-3"></v-file-input>
                </div>

                <!-- 实时数据配置 -->
                <div v-if="inputDataSource === 'realtime'">
                  <v-text-field v-model="realtimeConfig.endpoint" label="数据接口地址" variant="outlined" density="compact"
                    class="mb-3"></v-text-field>
                  <v-text-field v-model="realtimeConfig.interval" label="更新间隔(秒)" type="number" variant="outlined"
                    density="compact"></v-text-field>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-row class="mt-4">
            <v-col cols="12">
              <v-alert v-if="!selectedModel" type="warning" variant="outlined" class="mb-4">
                请选择一个已训练的模型进行预测
              </v-alert>

              <v-btn color="primary" :disabled="!selectedModel || !canStartPrediction" @click="startPrediction"
                :loading="isPredicting">
                开始预测
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- 第二步：模型预测 -->
    <template v-slot:[`item.2`]>
      <v-card title="预测结果展示" flat>
        <v-card-text>
          <!-- 预测进度 -->
          <v-card v-if="isPredicting" variant="outlined" class="pa-4 mb-6">
            <v-card-title class="text-h6 pa-0 mb-3">预测进度</v-card-title>
            <v-progress-linear v-model="predictionProgress" color="primary" height="20" class="mb-2">
              <template v-slot:default="{ value }">
                <strong>{{ Math.ceil(value) }}%</strong>
              </template>
            </v-progress-linear>
            <div class="text-body-2 text-center">
              {{ predictionStatus }}
            </div>
          </v-card>

          <!-- 预测结果图表 -->
          <v-card variant="outlined" class="mb-6">
            <v-card-title class="text-h6 d-flex justify-space-between align-center">
              时间序列预测对比
              <v-btn v-if="inputDataSource === 'realtime'" @click="toggleRealtime"
                :color="realtimeEnabled ? 'error' : 'success'" size="small"
                :prepend-icon="realtimeEnabled ? 'mdi-pause' : 'mdi-play'">
                {{ realtimeEnabled ? '暂停更新' : '开始实时更新' }}
              </v-btn>
            </v-card-title>
            <v-card-text>
              <div ref="timeSeriesChart" style="height:500px;"></div>
            </v-card-text>
          </v-card>

          <!-- 实时指标监控 -->
          <v-row>
            <v-col cols="12" md="3">
              <v-card class="pa-4">
                <v-card-title class="text-subtitle-1 pa-0 mb-2">
                  <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
                  预测精度
                </v-card-title>
                <div class="text-h4 font-weight-bold text-primary">
                  {{ predictionAccuracy.toFixed(2) }}%
                </div>
                <div class="text-caption text-medium-emphasis">
                  基于验证集评估
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="3">
              <v-card class="pa-4">
                <v-card-title class="text-subtitle-1 pa-0 mb-2">
                  <v-icon class="mr-2" color="success">mdi-target</v-icon>
                  平均误差
                </v-card-title>
                <div class="text-h4 font-weight-bold text-success">
                  {{ predictionMetrics.meanError.toFixed(4) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  MAE
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="3">
              <v-card class="pa-4">
                <v-card-title class="text-subtitle-1 pa-0 mb-2">
                  <v-icon class="mr-2" color="warning">mdi-alert-circle</v-icon>
                  最大误差
                </v-card-title>
                <div class="text-h4 font-weight-bold text-warning">
                  {{ predictionMetrics.maxError.toFixed(4) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Max Error
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="3">
              <v-card class="pa-4">
                <v-card-title class="text-subtitle-1 pa-0 mb-2">
                  <v-icon class="mr-2" color="info">mdi-percent</v-icon>
                  MAPE
                </v-card-title>
                <div class="text-h4 font-weight-bold text-info">
                  {{ predictionMetrics.mape.toFixed(1) }}%
                </div>
                <div class="text-caption text-medium-emphasis">
                  平均绝对百分比误差
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </template>

    <!-- 第三步：结果分析 -->
    <template v-slot:[`item.3`]>
      <v-card title="深度分析报告" flat>
        <v-card-text>
          <v-row>
            <!-- 误差分析 -->
            <v-col cols="12" md="6">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="error">mdi-chart-bell-curve</v-icon>
                  误差分布分析
                </v-card-title>
                <div ref="errorDistributionChart" style="height:300px;"></div>
              </v-card>
            </v-col>

            <!-- 残差分析 -->
            <v-col cols="12" md="6">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="warning">mdi-scatter-plot</v-icon>
                  残差散点图
                </v-card-title>
                <div ref="residualChart" style="height:300px;"></div>
              </v-card>
            </v-col>
          </v-row>

          <!-- 预测质量评估 -->
          <v-row class="mt-4">
            <v-col cols="12">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="success">mdi-check-circle</v-icon>
                  预测质量评估
                </v-card-title>

                <v-row>
                  <v-col cols="12" md="4">
                    <div class="text-center">
                      <div class="text-h2 font-weight-bold" :class="getQualityScoreColor(overallQuality)">
                        {{ overallQuality.toFixed(1) }}
                      </div>
                      <div class="text-body-1 font-weight-medium">综合评分</div>
                      <v-rating v-model="qualityStars" color="amber" density="compact" readonly size="small"></v-rating>
                    </div>
                  </v-col>

                  <v-col cols="12" md="8">
                    <v-expansion-panels variant="accordion">
                      <v-expansion-panel v-for="assessment in qualityAssessments" :key="assessment.metric"
                        :title="assessment.title">
                        <v-expansion-panel-text>
                          <div class="text-body-1 mb-3">{{ assessment.description }}</div>
                          <v-alert :type="assessment.level" variant="outlined" class="mb-2">
                            <strong>{{ assessment.title }}：</strong>{{ assessment.conclusion }}
                          </v-alert>
                        </v-expansion-panel-text>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>

          <!-- 预测结果导出 -->
          <v-row class="mt-4">
            <v-col cols="12">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="primary">mdi-download</v-icon>
                  导出预测结果
                </v-card-title>

                <v-row>
                  <v-col cols="12" md="6">
                    <div class="d-flex flex-column gap-2">
                      <v-btn @click="exportPredictionData" prepend-icon="mdi-file-excel" color="primary">
                        导出预测数据
                      </v-btn>
                      <v-btn @click="exportAnalysisReport" prepend-icon="mdi-file-pdf-box" color="primary">
                        导出分析报告
                      </v-btn>
                      <v-btn @click="exportCharts" prepend-icon="mdi-image" color="primary">
                        导出图表
                      </v-btn>
                    </div>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-card color="grey-lighten-4" class="pa-3">
                      <v-card-title class="text-subtitle-1 pa-0 mb-2">预测摘要</v-card-title>
                      <div class="text-body-2 mb-1">
                        <strong>模型：</strong>{{ getSelectedModelName() }}
                      </div>
                      <div class="text-body-2 mb-1">
                        <strong>预测点数：</strong>{{ predictionLength }}
                      </div>
                      <div class="text-body-2 mb-1">
                        <strong>预测精度：</strong>{{ predictionAccuracy.toFixed(2) }}%
                      </div>
                      <div class="text-body-2">
                        <strong>生成时间：</strong>{{ new Date().toLocaleString() }}
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
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

interface TrainedModel {
  id: string;
  name: string;
  accuracy: number;
  type: string;
}

interface PredictionMetrics {
  meanError: number;
  maxError: number;
  mape: number;
  rmse: number;
}

interface QualityAssessment {
  metric: string;
  title: string;
  description: string;
  level: "success" | "warning" | "error" | "info";
  conclusion: string;
}

interface RealtimeConfig {
  endpoint: string;
  interval: number;
}

interface DateRange {
  start: string;
  end: string;
}

// 步骤控制
const currentStep = ref(1);

// 预测配置
const selectedModel = ref("");
const predictionLength = ref(30);
const predictionMode = ref("single");
const inputDataSource = ref("historical");

// 模型选项
const trainedModels = ref<TrainedModel[]>([
  { id: "linear_001", name: "线性回归模型", accuracy: 0.85, type: "Linear Regression" },
  { id: "lstm_002", name: "LSTM深度模型", accuracy: 0.78, type: "LSTM" },
  { id: "forest_003", name: "随机森林模型", accuracy: 0.82, type: "Random Forest" },
  { id: "xgb_004", name: "XGBoost模型", accuracy: 0.88, type: "XGBoost" }
]);

const predictionModes = [
  { title: "单步预测", value: "single" },
  { title: "多步预测", value: "multi" },
  { title: "滚动预测", value: "rolling" }
];

// 数据输入配置
const selectedDataset = ref("");
const uploadedFile = ref<File[]>([]);
const realtimeConfig = ref<RealtimeConfig>({
  endpoint: "",
  interval: 60
});

const dateRange = ref<DateRange>({
  start: "",
  end: ""
});

const availableDatasets = [
  { title: "历史负荷数据", value: "load_history" },
  { title: "温度数据", value: "temperature" },
  { title: "综合数据集", value: "comprehensive" }
];

// 预测状态
const isPredicting = ref(false);
const predictionProgress = ref(0);
const predictionStatus = ref("准备开始预测...");

// 预测结果
const predictionAccuracy = ref(87.5);
const predictionMetrics = ref<PredictionMetrics>({
  meanError: 0.0523,
  maxError: 0.1987,
  mape: 5.2,
  rmse: 0.0687
});

// 图表引用
const timeSeriesChart = ref<HTMLDivElement | null>(null);
const errorDistributionChart = ref<HTMLDivElement | null>(null);
const residualChart = ref<HTMLDivElement | null>(null);

// 计算属性
const canStartPrediction = computed(() => {
  if (inputDataSource.value === "historical") {
    return selectedDataset.value !== "";
  } else if (inputDataSource.value === "upload") {
    return uploadedFile.value.length > 0;
  } else if (inputDataSource.value === "realtime") {
    return realtimeConfig.value.endpoint !== "";
  }
  return false;
});

const overallQuality = computed(() => {
  // 基于各项指标计算综合质量分数
  const accuracyScore = predictionAccuracy.value;
  const errorScore = Math.max(0, 100 - predictionMetrics.value.mape * 10);
  return (accuracyScore + errorScore) / 2;
});

const qualityStars = computed(() => {
  return Math.round(overallQuality.value / 20);
});

const qualityAssessments = computed<QualityAssessment[]>(() => [
  {
    metric: "accuracy",
    title: "预测精度评估",
    description: `模型在验证集上的预测精度为${predictionAccuracy.value.toFixed(2)}%`,
    level: predictionAccuracy.value > 85 ? "success" : predictionAccuracy.value > 70 ? "warning" : "error",
    conclusion: predictionAccuracy.value > 85 ? "精度优秀，模型表现良好" : predictionAccuracy.value > 70 ? "精度良好，建议进一步优化" : "精度较低，需要重新训练或调整参数"
  },
  {
    metric: "error",
    title: "误差分析",
    description: `平均绝对百分比误差(MAPE)为${predictionMetrics.value.mape.toFixed(1)}%`,
    level: predictionMetrics.value.mape < 5 ? "success" : predictionMetrics.value.mape < 10 ? "warning" : "error",
    conclusion: predictionMetrics.value.mape < 5 ? "误差控制优秀" : predictionMetrics.value.mape < 10 ? "误差在可接受范围内" : "误差较大，需要改进模型"
  },
  {
    metric: "stability",
    title: "预测稳定性",
    description: "基于残差分析评估模型预测的稳定性",
    level: "info",
    conclusion: "模型预测具有较好的稳定性，残差分布基本符合正态分布"
  }
]);

// 模拟预测数据
const generateMockPredictionData = () => {
  const historical = [];
  const prediction = [];
  const actual = [];

  // 生成历史数据（过去100个点）
  for (let i = 0; i < 100; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (100 - i));
    const value = 50 + 20 * Math.sin(i * 0.1) + Math.random() * 10;
    historical.push([date.toISOString().split("T")[0], value.toFixed(2)]);
  }

  // 生成预测数据
  for (let i = 0; i < predictionLength.value; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const predValue = 50 + 20 * Math.sin((100 + i) * 0.1) + Math.random() * 5;
    const actualValue = 50 + 20 * Math.sin((100 + i) * 0.1) + Math.random() * 8;

    prediction.push([date.toISOString().split("T")[0], predValue.toFixed(2)]);
    actual.push([date.toISOString().split("T")[0], actualValue.toFixed(2)]);
  }

  return { historical, prediction, actual };
};

// 方法
const startPrediction = async () => {
  isPredicting.value = true;
  predictionProgress.value = 0;

  // 模拟预测过程
  const steps = [
    { progress: 20, status: "加载数据中..." },
    { progress: 40, status: "初始化模型..." },
    { progress: 60, status: "执行预测计算..." },
    { progress: 80, status: "后处理结果..." },
    { progress: 100, status: "预测完成！" }
  ];

  for (const step of steps) {
    await new Promise(resolve => setTimeout(resolve, 800));
    predictionProgress.value = step.progress;
    predictionStatus.value = step.status;
  }

  isPredicting.value = false;
  currentStep.value = 2;

  // 初始化图表
  setTimeout(initializeCharts, 100);
};

const getSelectedModelName = () => {
  const model = trainedModels.value.find(m => m.id === selectedModel.value);
  return model ? model.name : "未选择模型";
};

const getQualityScoreColor = (score: number) => {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warning";
  return "text-error";
};

// 导出功能
const exportPredictionData = () => {
  console.log("导出预测数据");
  // 实现数据导出逻辑
};

const exportAnalysisReport = () => {
  console.log("导出分析报告");
  // 实现报告导出逻辑
};

const exportCharts = () => {
  console.log("导出图表");
  // 实现图表导出逻辑
};

// 初始化图表
const initializeCharts = () => {
  const { historical, prediction, actual } = generateMockPredictionData();

  // 时间序列预测对比图
  if (timeSeriesChart.value) {
    const chart = echarts.init(timeSeriesChart.value);
    chart.setOption({
      title: {
        text: "时间序列预测结果",
        left: "center"
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross"
        }
      },
      legend: {
        data: ["历史数据", "预测值", "实际值"],
        bottom: 10
      },
      xAxis: {
        type: "category",
        data: [...historical.map(h => h[0]), ...prediction.map(p => p[0])],
        axisLabel: {
          formatter: function (value: string) {
            return new Date(value).toLocaleDateString();
          }
        }
      },
      yAxis: {
        type: "value",
        name: "数值"
      },
      series: [
        {
          name: "历史数据",
          type: "line",
          data: historical.map(h => h[1]),
          itemStyle: { color: "#1976d2" },
          lineStyle: { width: 2 }
        },
        {
          name: "预测值",
          type: "line",
          data: [...new Array(historical.length).fill(null), ...prediction.map(p => p[1])],
          itemStyle: { color: "#43a047" },
          lineStyle: { width: 2, type: "dashed" },
          connectNulls: false
        },
        {
          name: "实际值",
          type: "line",
          data: [...new Array(historical.length).fill(null), ...actual.map(a => a[1])],
          itemStyle: { color: "#ff9800" },
          lineStyle: { width: 2 },
          connectNulls: false
        }
      ],
      grid: {
        bottom: 80,
        left: 80,
        right: 50
      },
      dataZoom: [
        {
          type: "slider",
          start: 70,
          end: 100
        }
      ]
    });
  }
};

// 初始化分析图表（第三步）
const initializeAnalysisCharts = () => {
  // 生成误差数据
  const generateErrorData = () => {
    const errors = [];
    // 生成正态分布的误差数据
    for (let i = 0; i < 1000; i++) {
      // 使用Box-Muller变换生成正态分布
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      errors.push(z0 * 0.05); // 标准差为0.05
    }
    return errors;
  };

  // 生成残差数据
  const generateResidualData = () => {
    const residuals = [];
    const { prediction, actual } = generateMockPredictionData();

    for (let i = 0; i < Math.min(prediction.length, actual.length); i++) {
      const predValue = parseFloat(prediction[i][1]);
      const actualValue = parseFloat(actual[i][1]);
      const residual = actualValue - predValue;
      residuals.push([i + 1, residual]);
    }
    return residuals;
  };

  // 误差分布直方图
  if (errorDistributionChart.value) {
    const chart = echarts.init(errorDistributionChart.value);
    const errorData = generateErrorData();

    // 计算直方图数据
    const bins = 30;
    const min = Math.min(...errorData);
    const max = Math.max(...errorData);
    const binWidth = (max - min) / bins;
    const histogram = new Array(bins).fill(0);
    const binCenters = [];

    // 统计每个区间的频次
    errorData.forEach(error => {
      const binIndex = Math.min(Math.floor((error - min) / binWidth), bins - 1);
      histogram[binIndex]++;
    });

    // 计算区间中心点
    for (let i = 0; i < bins; i++) {
      binCenters.push(min + (i + 0.5) * binWidth);
    }

    chart.setOption({
      title: {
        text: "预测误差分布",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold"
        }
      },
      tooltip: {
        trigger: "axis",
        formatter: function (params: { name: string; value: number }[]) {
          const data = params[0];
          return `误差范围: ${data.name}<br/>频次: ${data.value}`;
        }
      },
      xAxis: {
        type: "category",
        data: binCenters.map(center => center.toFixed(3)),
        name: "误差值",
        nameLocation: "middle",
        nameGap: 30,
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: "value",
        name: "频次",
        nameLocation: "middle",
        nameGap: 40
      },
      series: [{
        name: "频次",
        type: "bar",
        data: histogram,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#1976d2" },
            { offset: 1, color: "#64b5f6" }
          ])
        },
        barWidth: "80%"
      }],
      grid: {
        left: 60,
        right: 30,
        bottom: 80,
        top: 60
      }
    });
  }

  // 残差散点图
  if (residualChart.value) {
    const chart = echarts.init(residualChart.value);
    const residualData = generateResidualData();

    chart.setOption({
      title: {
        text: "残差分析图",
        left: "center",
        textStyle: {
          fontSize: 16,
          fontWeight: "bold"
        }
      },
      tooltip: {
        trigger: "item",
        formatter: function (params: { data: number[] }) {
          return `样本 ${params.data[0]}<br/>残差: ${params.data[1].toFixed(4)}`;
        }
      },
      xAxis: {
        type: "value",
        name: "样本序号",
        nameLocation: "middle",
        nameGap: 30
      },
      yAxis: {
        type: "value",
        name: "残差值",
        nameLocation: "middle",
        nameGap: 40,
        axisLine: {
          show: true
        },
        splitLine: {
          show: true,
          lineStyle: {
            type: "dashed"
          }
        }
      },
      series: [
        {
          name: "残差",
          type: "scatter",
          data: residualData,
          itemStyle: {
            color: "#43a047",
            opacity: 0.7
          },
          symbolSize: 8
        },
        {
          name: "零线",
          type: "line",
          data: [[1, 0], [residualData.length, 0]],
          lineStyle: {
            color: "#f44336",
            width: 2,
            type: "solid"
          },
          symbol: "none",
          silent: true
        }
      ],
      grid: {
        left: 60,
        right: 30,
        bottom: 60,
        top: 60
      },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          start: 0,
          end: 100
        }
      ]
    });
  }
};

// 实时更新相关
const realtimeEnabled = ref(false);
const realtimeInterval = ref<number | null>(null);

// 启用实时更新
const toggleRealtime = () => {
  if (realtimeEnabled.value) {
    if (realtimeInterval.value) {
      clearInterval(realtimeInterval.value);
      realtimeInterval.value = null;
    }
    realtimeEnabled.value = false;
  } else {
    realtimeInterval.value = setInterval(() => {
      // 模拟实时数据更新
      updateRealtimeData();
    }, realtimeConfig.value.interval * 1000);
    realtimeEnabled.value = true;
  }
};

// 更新实时数据
const updateRealtimeData = () => {
  // 更新预测指标
  predictionMetrics.value.meanError += (Math.random() - 0.5) * 0.001;
  predictionMetrics.value.maxError += (Math.random() - 0.5) * 0.002;
  predictionMetrics.value.mape += (Math.random() - 0.5) * 0.1;

  // 确保数值在合理范围内
  predictionMetrics.value.meanError = Math.max(0, predictionMetrics.value.meanError);
  predictionMetrics.value.maxError = Math.max(0, predictionMetrics.value.maxError);
  predictionMetrics.value.mape = Math.max(0, predictionMetrics.value.mape);

  // 更新图表
  if (currentStep.value >= 2) {
    setTimeout(initializeCharts, 100);
  }
};

// 直接跳转到分析步骤（用于测试）
const jumpToAnalysis = () => {
  // 设置一个默认的模型选择
  if (!selectedModel.value) {
    selectedModel.value = "lstm_002";
  }
  currentStep.value = 3;
  setTimeout(initializeAnalysisCharts, 100);
};

// 监听步骤变化
watch(currentStep, (newStep) => {
  if (newStep === 2) {
    setTimeout(initializeCharts, 100);
  } else if (newStep === 3) {
    setTimeout(initializeAnalysisCharts, 100);
  }
});

onMounted(() => {
  // 设置默认日期范围
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  dateRange.value.end = today.toISOString().split("T")[0];
  dateRange.value.start = lastMonth.toISOString().split("T")[0];

  // 如果当前在分析步骤，初始化分析图表
  if (currentStep.value === 3) {
    setTimeout(initializeAnalysisCharts, 100);
  }
});
</script>

<style scoped>
.v-card-title {
  font-weight: 600;
}


.child-mbm-3>* {
  margin-bottom: 12px;
}

.child-mbm-3>*:last-child {
  margin-bottom: 0;
}

.select-none {
  user-select: none;
}
</style>
