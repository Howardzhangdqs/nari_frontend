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
                <v-col cols="12" md="6">
                  <div ref="rmseChart" style="height:400px;"></div>
                </v-col>
                <v-col cols="12" md="6">
                  <div ref="maeR2Chart" style="height:400px;"></div>
                </v-col>
              </v-row>
              <v-row class="mt-4">
                <v-col cols="12">
                  <div ref="radarChart" style="height:400px;"></div>
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
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel v-for="analysis in performanceAnalysis" :key="analysis.metric"
                    :title="analysis.title">
                    <v-expansion-panel-text>
                      <div class="text-body-1 mb-3">{{ analysis.description }}</div>
                      <v-alert :type="analysis.recommendation.type" variant="outlined" class="mb-2">
                        <strong>建议：</strong>{{ analysis.recommendation.text }}
                      </v-alert>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card>
            </v-col>
          </v-row>

          <!-- 导出功能 -->
          <v-row class="mt-4">
            <v-col cols="12">
              <v-card class="pa-4">
                <v-card-title class="text-h6 pa-0 mb-3">
                  <v-icon class="mr-2" color="primary">mdi-download</v-icon>
                  导出对比报告
                </v-card-title>
                <div class="d-flex justify-start gap-2">
                  <v-btn @click="exportToPDF" prepend-icon="mdi-file-pdf-box" color="primary">
                    导出PDF报告
                  </v-btn>
                  <v-btn @click="exportToExcel" prepend-icon="mdi-file-excel" color="primary">
                    导出Excel数据
                  </v-btn>
                  <v-btn @click="exportCharts" prepend-icon="mdi-image" color="primary">
                    导出图表
                  </v-btn>
                </div>
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
const radarChart = ref<HTMLDivElement | null>(null);

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

// 导出功能
const exportToPDF = () => {
  console.log("导出PDF报告");
  // 实现PDF导出逻辑
};

const exportToExcel = () => {
  console.log("导出Excel数据");
  // 实现Excel导出逻辑
};

const exportCharts = () => {
  console.log("导出图表");
  // 实现图表导出逻辑
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
  }

  // 雷达图
  if (radarChart.value && filteredMetrics.value.length > 0) {
    const chart = echarts.init(radarChart.value);

    const indicator = [
      { name: "R² (×100)", max: 100 },
      { name: "RMSE (反向)", max: 100 },
      { name: "MAE (反向)", max: 100 }
    ];

    const seriesData = filteredMetrics.value.map((metric, index) => ({
      name: metric.model,
      value: [
        metric.r2 * 100,
        (1 - metric.rmse) * 100,
        (1 - metric.mae) * 100
      ],
      itemStyle: {
        color: ["#1976d2", "#43a047", "#fbc02d", "#e91e63", "#9c27b0", "#ff9800"][index]
      }
    }));

    chart.setOption({
      title: { text: "模型综合性能雷达图", left: "center" },
      tooltip: {
        formatter: function (params: EChartsRadarTooltipParams) {
          return `${params.name}<br/>
            R²: ${(params.value[0] / 100).toFixed(4)}<br/>
            RMSE: ${(1 - params.value[1] / 100).toFixed(4)}<br/>
            MAE: ${(1 - params.value[2] / 100).toFixed(4)}`;
        }
      },
      legend: {
        data: filteredMetrics.value.map(m => m.model),
        bottom: 10
      },
      radar: {
        indicator: indicator,
        center: ["50%", "50%"],
        radius: "60%"
      },
      series: [{
        type: "radar",
        data: seriesData
      }]
    });
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
