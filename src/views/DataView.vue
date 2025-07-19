<template>
  <v-stepper :items="['数据获取', '数据构建', '数据展示']" next-text="下一步" prev-text="上一步" v-model="currentStep">
    <!-- 第一步：数据获取 -->
    <template v-slot:[`item.1`]>
      <v-card title="数据获取配置" flat>
        <!-- 数据源选择 -->
        <v-radio-group v-model="dataSource" inline class="child-mbm-1">
          <v-radio label="数据库交互取数" value="database"></v-radio>
          <v-radio label="文件目录地址取数" value="file" style="margin-left: 20px;"></v-radio>
        </v-radio-group>

        <!-- <Transition></Transition> -->

        <!-- 数据库配置 -->
        <div v-if="dataSource === 'database'" class="mt-4">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 pa-0 mb-3">数据库配置</v-card-title>

            <!-- 数据库连接配置 -->
            <v-row class="child-mbm-2">
              <v-col cols="12" md="6">
                <v-text-field v-model="dbConfig.host" label="数据库主机" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dbConfig.port" label="端口" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dbConfig.username" label="用户名" variant="outlined"
                  density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="dbConfig.password" label="密码" type="password" variant="outlined"
                  density="compact"></v-text-field>
              </v-col>
            </v-row>

            <!-- 多个表配置 -->
            <v-card-title class="text-subtitle-1 pa-0 mt-4 mb-2">数据表配置</v-card-title>
            <div v-for="(table, index) in dbTables" :key="index" class="mb-4">
              <v-card variant="outlined" class="pa-3">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-2">表配置 {{ index + 1 }}</span>
                  <v-btn v-if="dbTables.length > 1" @click="removeTable(index)" size="small" color="error"
                    variant="text" icon="mdi-delete"></v-btn>
                </div>
                <v-row class="">
                  <v-col cols="12" md="3">
                    <v-text-field v-model="table.schema" label="数据库模式名" variant="outlined"
                      density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field v-model="table.tableName" label="表名" variant="outlined"
                      density="compact"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-combobox v-model="table.primaryKeys" label="主键名" multiple chips closable-chips variant="outlined"
                      density="compact" hint="支持联合主键，输入后按回车添加" persistent-hint></v-combobox>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-text-field v-model="table.primaryKeyValueRange" label="主键取值范围" variant="outlined"
                      density="compact" hint="例如: 1-1000 或 A001-A999"></v-text-field>
                  </v-col>
                </v-row>

                <!-- 列名映射配置 -->
                <v-expansion-panels class="mt-2">
                  <v-expansion-panel title="数据列配置">
                    <v-expansion-panel-text>
                      <v-row class="child-mbm-3">
                        <v-col cols="12" md="6">
                          <v-text-field v-model="table.timeColumnName" label="时间索引列名" variant="outlined"
                            density="compact" hint="将映射为标准的 'timestamp' 列"></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field v-model="table.pointColumnName" label="基准点号列名" variant="outlined"
                            density="compact" hint="将映射为标准的 'point_id' 列"></v-text-field>
                        </v-col>
                      </v-row>
                      <v-row class="child-mbm-1">
                        <v-col cols="12">
                          <v-combobox v-model="table.dataColumns" label="数据所在列的列名" multiple chips closable-chips
                            variant="outlined" density="compact" hint="选择或输入需要提取数据的列名，支持多个列"
                            persistent-hint></v-combobox>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card>
            </div>

            <v-btn @click="addTable" variant="outlined" color="primary" prepend-icon="mdi-plus" class="mt-2">
              添加表配置
            </v-btn>

            <div class="mt-4">
              <v-btn @click="connectDatabase" color="primary" :loading="isConnecting">
                连接并获取数据
              </v-btn>
            </div>
          </v-card>
        </div>

        <!-- 文件上传配置 -->
        <div v-if="dataSource === 'file'" class="mt-4">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="text-h6 pa-0 mb-3">文件导入配置</v-card-title>

            <!-- 文件路径输入 -->
            <v-text-field v-model="filePath" label="文件路径" variant="outlined" hint="输入 CSV 或 Excel 文件的完整路径">
            </v-text-field>

            <!-- 或者文件上传 -->
            <div class="text-center mtm-1 mb-3">
              <span class="text-body-2 text-medium-emphasis">或</span>
            </div>

            <v-file-input v-model="uploadedFile" label="选择文件" accept=".csv,.xlsx,.xls" show-size variant="outlined"
              class="">
            </v-file-input>

            <!-- 列名映射配置 -->
            <v-expansion-panels variant="accordion" class="mt-2">
              <v-expansion-panel title="列名映射配置">
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="fileColumnMapping.timeColumn" label="时间索引列名" variant="outlined"
                        density="compact" hint="文件中的时间列名，将映射为 'timestamp'"></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model="fileColumnMapping.pointColumn" label="基准点号列名" variant="outlined"
                        density="compact" hint="文件中的点号列名，将映射为 'point_id'"></v-text-field>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="mt-4">
              <v-btn @click="loadFile" color="primary" :loading="isLoading">
                加载文件数据
              </v-btn>
            </div>
          </v-card>
        </div>
      </v-card>
    </template>

    <!-- 第二步：数据构建 -->
    <template v-slot:[`item.2`]>
      <v-card flat>
        <div v-if="!isDataProcessed" class="text-center py-8">
          <v-progress-circular v-if="isProcessing" indeterminate color="primary" size="64"></v-progress-circular>
          <div v-else>
            <v-icon size="64" color="grey-lighten-1">mdi-database-off</v-icon>
          </div>
          <div class="text-h6 mt-4">
            {{ isProcessing ? '正在构建标准数据集...' : '请先完成数据获取配置' }}
          </div>
          <div v-if="isProcessing" class="text-body-2 text-medium-emphasis mt-2">
            数据预处理、列名统一、格式标准化中...
          </div>
        </div>

        <div v-if="isDataProcessed">
          <v-card>
            <v-card-title class="text-h6">
              数据集构建完成
            </v-card-title>
            <v-card-text>
              <v-alert type="success" variant="tonal" class="mb-4">
                <v-alert-title>数据集构建完成</v-alert-title>
                标准数据集已成功构建，包含 {{ processedDataInfo.totalRows }} 行数据，{{ processedDataInfo.totalColumns }} 个特征列。
              </v-alert>
            </v-card-text>
          </v-card>

          <!-- 数据处理摘要 -->
          <v-card variant="flat" class="mb-4">
            <v-card-title>数据处理摘要</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="3">
                  <v-card variant="tonal" color="primary">
                    <v-card-text class="text-center">
                      <div class="text-h4 text-bold">{{ processedDataInfo.totalRows }}</div>
                      <div class="text-body-2">总行数</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card variant="tonal" color="success">
                    <v-card-text class="text-center">
                      <div class="text-h4 text-bold">{{ processedDataInfo.totalColumns }}</div>
                      <div class="text-body-2">总列数</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card variant="tonal" color="info">
                    <v-card-text class="text-center">
                      <div class="text-h4 text-bold">{{ processedDataInfo.featureColumns }}</div>
                      <div class="text-body-2">特征列数</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card variant="tonal" color="warning">
                    <v-card-text class="text-center">
                      <div class="text-h4 text-bold">{{ processedDataInfo.mappedColumns }}</div>
                      <div class="text-body-2">映射列数</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>
      </v-card>
    </template>

    <!-- 第三步：数据展示 -->
    <template v-slot:[`item.3`]>
      <v-card flat>
        <div v-if="!isDataProcessed" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-table-off</v-icon>
          <div class="text-h6 mt-4">暂无数据可展示</div>
          <div class="text-body-2 text-medium-emphasis mt-2">请先完成数据获取和构建</div>
        </div>

        <div v-if="isDataProcessed">
          <!-- 操作按钮 -->
          <div class="d-flex justify-end">
            <router-link to="/train">
              <v-btn color="primary" variant="elevated" size="large" prepend-icon="mdi-arrow-right">
                进入下一步训练
              </v-btn>
            </router-link>
          </div>

          <!-- 列名展示 -->
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">全部列名 ({{ headers.length }} 列)</div>
            <hr />
          </div>

          <div class="mt-3 mb-6">
            <v-expansion-panels variant="accordion" :model-value="['feature']">
              <v-expansion-panel title="所有列名" value="feature">
                <v-expansion-panel-text>
                  <div class="d-flex justify-center ga-2" style="display: flex; flex-wrap: wrap;">
                    <v-chip v-for="header in headers" :key="header.key" :color="getColumnTypeColor(header.key)"
                      variant="outlined" size="small">
                      {{ header.title }}
                    </v-chip>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <!-- 数据表格展示 -->
          <div style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">标准数据集预览 (前 50 行)</div>
            <hr />
          </div>

          <div class="data-table-container mt-3">
            <v-data-table :items="paginatedData" :headers="headers" :items-per-page="10" hide-default-footer
              item-key="id" class="data-table-no-wrap">
              <template v-slot:bottom>
                <div class="text-center pt-2">
                  <v-pagination v-model="currentPage" :length="totalPages" :total-visible="5"></v-pagination>
                </div>
              </template>
            </v-data-table>
          </div>

          <!-- 数据分布图表 -->
          <div class="mt-6" style="display: flex; flex-direction: column; align-items: stretch;">
            <div class="text-h6 mb-1" style="line-height: 20px">特征数据分布</div>
            <hr />
          </div>

          <div class="mt-4">
            <v-select v-model="selectedFeatureIndices" :items="featureOptions" item-title="title" item-value="value"
              label="选择要查看的特征" multiple chips closable-chips max-width="500"></v-select>
          </div>

          <div v-if="selectedFeatureIndices.length === 0" class="mt-4">
            <v-alert type="info" variant="tonal">
              请选择至少一个特征来查看数据分布图
            </v-alert>
          </div>

          <div v-if="selectedFeatureIndices.length > 0" class="charts-container"
            style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-top: 20px;">
            <div v-for="(chart, index) in filteredChartData" :key="`chart-${selectedFeatureIndices[index]}`"
              class="chart-wrapper" style="padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <Bar :data="chart.data" :options="chart.options" />
            </div>
          </div>
        </div>
      </v-card>
    </template>
  </v-stepper>
</template>

<script lang="ts" setup>
import { Bar } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";
import { ref, computed } from "vue";
import router from "@/router";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// 步骤控制
const currentStep = ref(1);

// 数据源选择
const dataSource = ref<"database" | "file">("database");

// 数据库配置
const dbConfig = ref({
  host: "",
  port: "3306",
  username: "",
  password: ""
});

// 数据库表配置
interface DbTable {
  schema: string;
  tableName: string;
  primaryKeys: string[]; // 支持联合主键
  primaryKeyValueRange: string; // 主键取值范围
  timeColumnName: string;
  pointColumnName: string;
  dataColumns: string[]; // 数据所在列的列名
}

const dbTables = ref<DbTable[]>([
  {
    schema: "",
    tableName: "",
    primaryKeys: [],
    primaryKeyValueRange: "",
    timeColumnName: "",
    pointColumnName: "",
    dataColumns: []
  }
]);

// 文件配置
const filePath = ref("");
const uploadedFile = ref<File[]>([]);
const fileColumnMapping = ref({
  timeColumn: "",
  pointColumn: ""
});

// 状态控制
const isConnecting = ref(false);
const isLoading = ref(false);
const isProcessing = ref(false);
const isDataProcessed = ref(false);

// 处理后的数据信息
const processedDataInfo = ref({
  totalRows: 0,
  totalColumns: 0,
  featureColumns: 0,
  mappedColumns: 0
});

const num_features = 100;
const currentPage = ref(1);
const selectedFeatureIndices = ref([1, 15, 32]); // 默认选择3个特征

// 数据库操作方法
const addTable = () => {
  dbTables.value.push({
    schema: "",
    tableName: "",
    primaryKeys: [],
    primaryKeyValueRange: "",
    timeColumnName: "",
    pointColumnName: "",
    dataColumns: []
  });
};

const removeTable = (index: number) => {
  dbTables.value.splice(index, 1);
};

const connectDatabase = async () => {
  isConnecting.value = true;
  try {
    // 模拟数据库连接和数据获取
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 进入数据构建阶段
    currentStep.value = 2;
    isProcessing.value = true;

    // 模拟数据处理
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 完成数据处理
    isDataProcessed.value = true;
    isProcessing.value = false;
    processedDataInfo.value = {
      totalRows: 1500,
      totalColumns: num_features + 3, // 包括 timestamp, point_id 和其他标识列
      featureColumns: num_features,
      mappedColumns: 2 // timestamp 和 point_id
    };

    // 自动跳转到展示页面
    // currentStep.value = 3;
  } catch (error) {
    console.error("数据库连接失败:", error);
  } finally {
    isConnecting.value = false;
  }
};

const loadFile = async () => {
  isLoading.value = true;
  try {
    // 模拟文件加载和处理
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 进入数据构建阶段
    currentStep.value = 2;
    isProcessing.value = true;

    // 模拟数据处理
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 完成数据处理
    isDataProcessed.value = true;
    isProcessing.value = false;
    processedDataInfo.value = {
      totalRows: 2000,
      totalColumns: num_features + 3,
      featureColumns: num_features,
      mappedColumns: 2
    };

    // 自动跳转到展示页面
    currentStep.value = 3;
  } catch (error) {
    console.error("文件加载失败:", error);
  } finally {
    isLoading.value = false;
  }
};

// 获取列类型颜色
const getColumnTypeColor = (columnKey: string) => {
  if (columnKey === "id") return "primary";
  if (columnKey.includes("timestamp")) return "success";
  if (columnKey.includes("point_id")) return "info";
  return "default";
};

// 为了数据一致性，预生成所有特征的随机参数
const featureParams = new Map<number, { mean: number; stdDev: number }>();
for (let i = 1; i <= num_features; i++) {
  featureParams.set(i, {
    mean: 50 + (Math.random() - 0.5) * 40,
    stdDev: 10 + Math.random() * 10
  });
}

// 生成正态分布数据
function generateNormalDistribution(mean: number, stdDev: number, count: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < count; i++) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    data.push(z * stdDev + mean);
  }
  return data;
}

// 创建直方图数据
function createHistogramData(data: number[], bins: number = 20): { labels: string[], values: number[] } {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 0; i < bins; i++) {
    const start = min + i * binWidth;
    const end = min + (i + 1) * binWidth;
    labels.push(`${Math.round(start)}-${Math.round(end)}`);

    const count = data.filter(val => val >= start && val < end).length;
    values.push(count);
  }

  return { labels, values };
}

// 为几个特征生成图表数据
interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
}

interface ChartOptions {
  responsive: boolean;
  plugins: {
    title: {
      display: boolean;
      text: string;
    };
    legend: {
      display: boolean;
    };
  };
  scales: {
    x: {
      title: {
        display: boolean;
        text: string;
      };
    };
    y: {
      title: {
        display: boolean;
        text: string;
      };
      ticks: {
        stepSize: number;
      };
    };
  };
}

interface ChartDataItem {
  data: {
    labels: string[];
    datasets: ChartDataset[];
  };
  options: ChartOptions;
}

// 生成单个特征的图表数据
function generateChartDataForFeature(featureIndex: number): ChartDataItem {
  const params = featureParams.get(featureIndex)!;
  const { mean, stdDev } = params;
  const normalData = generateNormalDistribution(mean, stdDev, 1000);
  const histData = createHistogramData(normalData);

  return {
    data: {
      labels: histData.labels,
      datasets: [{
        label: `特征 ${featureIndex} 分布`,
        data: histData.values,
        backgroundColor: "#0365af",
        borderColor: "#0365af",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `特征 ${featureIndex} 的分布 (均值: ${mean.toFixed(2)}, 标准差: ${stdDev.toFixed(2)})`
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "数值区间"
          }
        },
        y: {
          title: {
            display: true,
            text: "频次"
          },
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  };
}

const headers: {
  title: string;
  align?: "start" | "end" | "center";
  key: string;
}[] = [
    { title: "数据 ID", align: "start", key: "id" },
    { title: "时间戳", align: "start", key: "timestamp" },
    { title: "基准点号", align: "start", key: "point_id" },
  ];

for (let i = 1; i <= num_features; i++) {
  headers.push({ title: `特征 ${i}`, key: `feature_${i}`, align: "start" });
}

const table_data: {
  id: string;
  timestamp: string;
  point_id: string;
  [key: string]: string;
}[] = [];

// 生成50条数据（5页，每页10条）
for (let i = 0; i < 50; i++) {
  const row: { id: string; timestamp: string; point_id: string;[key: string]: string } = {
    id: (i + 1).toString(),
    timestamp: new Date(Date.now() - (50 - i) * 60000).toISOString().slice(0, 19).replace("T", " "),
    point_id: `P${Math.floor(i / 10) + 1}_${(i % 10) + 1}`
  };
  for (let j = 1; j <= num_features; j++) {
    row[`feature_${j}`] = (Math.random() * 100).toFixed(2);
  }
  table_data.push(row);
}

// 分页相关计算属性
const totalPages = computed(() => Math.ceil(table_data.length / 10));
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * 10;
  const end = start + 10;
  return table_data.slice(start, end);
});

// 特征选择选项
const featureOptions = computed(() => {
  const options = [];
  for (let i = 1; i <= num_features; i++) {
    options.push({
      title: `特征 ${i}`,
      value: i
    });
  }
  return options;
});

// 根据选择的特征动态生成图表数据
const filteredChartData = computed(() => {
  return selectedFeatureIndices.value.map(featureIndex => generateChartDataForFeature(featureIndex));
});
</script>

<style>
.v-data-table-header__content {
  width: max-content;
}

/* 数据表格容器样式 */
.data-table-container {
  overflow-x: auto;
  max-width: 100%;
}

/* 防止表格内容换行 */
.data-table-no-wrap {
  white-space: nowrap;
}

.data-table-no-wrap .v-data-table__td {
  white-space: nowrap !important;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  /* 限制最大宽度 */
}

.data-table-no-wrap .v-data-table__th {
  white-space: nowrap !important;
  min-width: fit-content;
}

/* 确保表格可以横向滚动 */
.data-table-no-wrap .v-table {
  min-width: max-content;
}
</style>
