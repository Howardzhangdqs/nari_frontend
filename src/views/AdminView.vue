<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card variant="text">
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <v-icon class="mr-2">mdi-shield-account</v-icon>
              管理员控制台
            </div>
            <v-btn-toggle v-model="viewMode" color="primary" variant="outlined">
              <v-btn value="users">
                <v-icon>mdi-account-group</v-icon>
                用户管理
              </v-btn>
              <v-btn value="datasets">
                <v-icon>mdi-database</v-icon>
                数据集管理
              </v-btn>
              <v-btn value="statistics">
                <v-icon>mdi-chart-box</v-icon>
                统计概览
              </v-btn>
            </v-btn-toggle>
          </v-card-title>

          <v-card-text>
            <!-- 用户管理视图 -->
            <div v-if="viewMode === 'users'">
              <v-row class="mb-4">
                <v-col cols="12" md="4">
                  <v-text-field v-model="userSearchKeyword" label="搜索用户" prepend-inner-icon="mdi-magnify"
                    variant="outlined" density="compact" clearable></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select v-model="roleFilter" :items="roleOptions" label="用户角色" variant="outlined" density="compact"
                    clearable></v-select>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select v-model="statusFilter" :items="userStatusOptions" label="用户状态" variant="outlined"
                    density="compact" clearable></v-select>
                </v-col>
              </v-row>

              <v-data-table :headers="userHeaders" :items="filteredUsers" :loading="loading"
                class="elevation-1 admin-table">
                <!-- 用户管理表头 -->
                <template v-slot:[`header.role`]>
                  <div class="text-center">角色</div>
                </template>

                <template v-slot:[`header.modelStats`]>
                  <div class="text-center">训练模型统计</div>
                </template>

                <template v-slot:[`header.lastActivity`]>
                  <div class="text-center">最后活动</div>
                </template>

                <template v-slot:[`header.status`]>
                  <div class="text-center">状态</div>
                </template>

                <template v-slot:[`header.actions`]>
                  <div class="text-end">操作</div>
                </template>

                <!-- 用户信息 -->
                <template v-slot:[`item.user`]="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="32" class="mr-3">
                      <v-icon>mdi-account</v-icon>
                    </v-avatar>
                    <div>
                      <div class="font-weight-medium">{{ item.username }}</div>
                      <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                    </div>
                  </div>
                </template>

                <!-- 角色 -->
                <template v-slot:[`item.role`]="{ item }">
                  <v-chip :color="getRoleColor(item.role)" size="small">
                    {{ getRoleText(item.role) }}
                  </v-chip>
                </template>

                <!-- 训练模型统计 -->
                <template v-slot:[`item.modelStats`]="{ item }">
                  <div class="text-center">
                    <div class="text-h6 font-weight-bold text-primary">{{ item.totalModels }}</div>
                    <div class="text-caption">
                      成功: {{ item.successModels }} | 失败: {{ item.failedModels }}
                    </div>
                  </div>
                </template>

                <!-- 最后活动 -->
                <template v-slot:[`item.lastActivity`]="{ item }">
                  <div>
                    <div>{{ formatDate(item.lastActivity) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatTime(item.lastActivity) }}
                    </div>
                  </div>
                </template>

                <!-- 状态 -->
                <template v-slot:[`item.status`]="{ item }">
                  <v-chip :color="item.status === 'active' ? 'success' : 'error'" size="small">
                    {{ item.status === 'active' ? '活跃' : '禁用' }}
                  </v-chip>
                </template>

                <!-- 用户操作 -->
                <template v-slot:[`item.actions`]="{ item }">
                  <div class="d-flex gap-2 justify-end align-center">
                    <v-btn size="small" variant="text" color="primary" icon="mdi-eye" @click="viewUserDetails(item)">
                      <v-icon>mdi-eye</v-icon>
                      <v-tooltip activator="parent">查看详情</v-tooltip>
                    </v-btn>
                    <v-btn size="small" variant="text" :color="item.status === 'active' ? 'error' : 'success'"
                      :icon="item.status === 'active' ? 'mdi-account-off' : 'mdi-account-check'"
                      @click="toggleUserStatus(item)">
                      <v-icon>{{ item.status === 'active' ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
                      <v-tooltip activator="parent">
                        {{ item.status === 'active' ? '禁用用户' : '启用用户' }}
                      </v-tooltip>
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </div>

            <!-- 数据集管理视图 -->
            <div v-if="viewMode === 'datasets'">
              <v-row class="mb-4">
                <v-col cols="12" md="4">
                  <v-text-field v-model="datasetSearchKeyword" label="搜索数据集" prepend-inner-icon="mdi-magnify"
                    variant="outlined" density="compact" clearable></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select v-model="datasetStatusFilter" :items="datasetStatusOptions" label="训练状态" variant="outlined"
                    density="compact" clearable></v-select>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select v-model="ownerFilter" :items="userOptions" label="数据集所有者" variant="outlined"
                    density="compact" clearable></v-select>
                </v-col>
              </v-row>

              <v-data-table :headers="datasetHeaders" :items="filteredDatasets" :loading="loading"
                class="elevation-1 admin-table">
                <!-- 自定义表头 -->
                <template v-slot:[`header.owner`]>
                  <div class="text-left ml-6">所有者</div>
                </template>

                <template v-slot:[`header.trainingStatus`]>
                  <div class="text-center">训练状态</div>
                </template>

                <template v-slot:[`header.createdAt`]>
                  <div class="text-center">创建时间</div>
                </template>

                <template v-slot:[`header.results`]>
                  <div class="text-center">模型结果</div>
                </template>

                <template v-slot:[`header.actions`]>
                  <div class="text-end">操作</div>
                </template>
                <!-- 数据集信息 -->
                <template v-slot:[`item.dataset`]="{ item }">
                  <div class="d-flex align-center">
                    <v-icon class="mr-2" color="primary">mdi-file-table</v-icon>
                    <div>
                      <div class="font-weight-medium">{{ item.name }}</div>
                      <div class="text-caption text-medium-emphasis">
                        {{ item.description || '暂无描述' }}
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 所有者 -->
                <template v-slot:[`item.owner`]="{ item }">
                  <div class="d-flex align-center">
                    <v-avatar size="24" class="mr-2">
                      <v-icon size="16">mdi-account</v-icon>
                    </v-avatar>
                    <div>{{ item.owner }}</div>
                  </div>
                </template>

                <!-- 训练状态 -->
                <template v-slot:[`item.trainingStatus`]="{ item }">
                  <v-chip :color="getDatasetStatusColor(item.trainingStatus)" size="small">
                    <v-icon start :icon="getDatasetStatusIcon(item.trainingStatus)"></v-icon>
                    {{ getDatasetStatusText(item.trainingStatus) }}
                  </v-chip>
                </template>

                <!-- 模型结果 -->
                <template v-slot:[`item.results`]="{ item }">
                  <div v-if="item.trainingStatus === 'completed'">
                    <div class="text-caption">最佳准确率</div>
                    <div class="font-weight-bold text-success">{{ item.bestAccuracy }}%</div>
                  </div>
                  <div v-else class="text-medium-emphasis">-</div>
                </template>

                <!-- 数据集操作 -->
                <template v-slot:[`item.actions`]="{ item }">
                  <div class="d-flex gap-2 justify-end align-center">
                    <v-btn size="small" variant="text" color="primary" icon="mdi-eye" @click="viewDatasetDetails(item)">
                      <v-icon>mdi-eye</v-icon>
                      <v-tooltip activator="parent">查看详情</v-tooltip>
                    </v-btn>
                    <v-btn v-if="item.trainingStatus === 'completed'" size="small" variant="text" color="success"
                      icon="mdi-chart-line" @click="viewTrainingResults(item)">
                      <v-icon>mdi-chart-line</v-icon>
                      <v-tooltip activator="parent">查看结果</v-tooltip>
                    </v-btn>
                  </div>
                </template>
              </v-data-table>
            </div>

            <!-- 统计概览视图 -->
            <div v-if="viewMode === 'statistics'">
              <v-row class="mb-6">
                <!-- 总体统计卡片 -->
                <v-col cols="12" md="3">
                  <v-card class="pa-4 text-center">
                    <v-icon size="48" color="primary" class="mb-2">mdi-account-group</v-icon>
                    <div class="text-h4 font-weight-bold text-primary">{{ totalUsers }}</div>
                    <div class="text-body-2 text-medium-emphasis">总用户数</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card class="pa-4 text-center">
                    <v-icon size="48" color="success" class="mb-2">mdi-database</v-icon>
                    <div class="text-h4 font-weight-bold text-success">{{ totalDatasets }}</div>
                    <div class="text-body-2 text-medium-emphasis">总数据集数</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card class="pa-4 text-center">
                    <v-icon size="48" color="warning" class="mb-2">mdi-cog</v-icon>
                    <div class="text-h4 font-weight-bold text-warning">{{ totalModels }}</div>
                    <div class="text-body-2 text-medium-emphasis">总训练模型数</div>
                  </v-card>
                </v-col>
                <v-col cols="12" md="3">
                  <v-card class="pa-4 text-center">
                    <v-icon size="48" color="info" class="mb-2">mdi-chart-line</v-icon>
                    <div class="text-h4 font-weight-bold text-info">{{ successRate }}%</div>
                    <div class="text-body-2 text-medium-emphasis">训练成功率</div>
                  </v-card>
                </v-col>
              </v-row>

              <!-- 图表区域 -->
              <v-row>
                <v-col cols="12" md="6">
                  <v-card>
                    <v-card-title>用户活跃度统计</v-card-title>
                    <v-card-text>
                      <div ref="userActivityChart" style="height: 300px;"></div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card>
                    <v-card-title>训练任务趋势</v-card-title>
                    <v-card-text>
                      <div ref="trainingTrendChart" style="height: 300px;"></div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from "vue";
import * as echarts from "echarts";
import { registChart } from "@/resize_charts";

interface User {
  id: string
  username: string
  email: string
  role: "administrator" | "researcher" | "user"
  totalModels: number
  successModels: number
  failedModels: number
  lastActivity: string
  status: "active" | "inactive"
}

interface AdminDataset {
  id: string
  name: string
  description?: string
  owner: string
  trainingStatus: "pending" | "training" | "completed" | "failed"
  createdAt: string
  bestAccuracy?: number
}

// 响应式数据
const loading = ref(false);
const viewMode = ref("users");
const userSearchKeyword = ref("");
const roleFilter = ref("");
const statusFilter = ref("");
const datasetSearchKeyword = ref("");
const datasetStatusFilter = ref("");
const ownerFilter = ref("");

// 图表引用
const userActivityChart = ref<HTMLDivElement | null>(null);
const trainingTrendChart = ref<HTMLDivElement | null>(null);

// 表格列定义
const userHeaders = [
  { title: "用户信息", key: "user", sortable: false },
  { title: "角色", key: "role", sortable: true, align: "center" as const },
  { title: "训练模型统计", key: "modelStats", sortable: false, align: "center" as const },
  { title: "最后活动", key: "lastActivity", sortable: true, align: "center" as const },
  { title: "状态", key: "status", sortable: true, align: "center" as const },
  { title: "操作", key: "actions", sortable: false, align: "end" as const }
];

const datasetHeaders = [
  { title: "数据集信息", key: "dataset", sortable: false },
  { title: "所有者", key: "owner", sortable: true, align: "center" as const },
  { title: "训练状态", key: "trainingStatus", sortable: true, align: "center" as const },
  { title: "创建时间", key: "createdAt", sortable: true, align: "center" as const },
  { title: "模型结果", key: "results", sortable: false, align: "center" as const },
  { title: "操作", key: "actions", sortable: false, align: "end" as const }
];

// 筛选选项
const roleOptions = [
  { title: "管理员", value: "administrator" },
  { title: "研究员", value: "researcher" },
  { title: "普通用户", value: "user" }
];

const userStatusOptions = [
  { title: "活跃", value: "active" },
  { title: "禁用", value: "inactive" }
];

const datasetStatusOptions = [
  { title: "待训练", value: "pending" },
  { title: "训练中", value: "training" },
  { title: "已完成", value: "completed" },
  { title: "训练失败", value: "failed" }
];

// 模拟数据
const users = ref<User[]>([
  {
    id: "1",
    username: "张研究员",
    email: "zhang@example.com",
    role: "researcher",
    totalModels: 15,
    successModels: 12,
    failedModels: 3,
    lastActivity: "2024-01-30T14:30:00Z",
    status: "active"
  },
  {
    id: "2",
    username: "李博士",
    email: "li@example.com",
    role: "researcher",
    totalModels: 8,
    successModels: 7,
    failedModels: 1,
    lastActivity: "2024-01-29T16:45:00Z",
    status: "active"
  },
  {
    id: "3",
    username: "王用户",
    email: "wang@example.com",
    role: "user",
    totalModels: 3,
    successModels: 2,
    failedModels: 1,
    lastActivity: "2024-01-28T09:15:00Z",
    status: "active"
  },
  {
    id: "4",
    username: "赵管理员",
    email: "zhao@example.com",
    role: "administrator",
    totalModels: 25,
    successModels: 22,
    failedModels: 3,
    lastActivity: "2024-01-30T18:20:00Z",
    status: "active"
  }
]);

const datasets = ref<AdminDataset[]>([
  {
    id: "1",
    name: "电力负荷数据集-01",
    description: "2023年全年电力负荷数据",
    owner: "张研究员",
    trainingStatus: "completed",
    createdAt: "2024-01-15T09:30:00Z",
    bestAccuracy: 92.5
  },
  {
    id: "2",
    name: "风力发电数据集-02",
    owner: "李博士",
    trainingStatus: "training",
    createdAt: "2024-01-20T14:15:00Z"
  },
  {
    id: "3",
    name: "太阳能发电数据集-03",
    owner: "王用户",
    trainingStatus: "pending",
    createdAt: "2024-01-25T11:20:00Z"
  },
  {
    id: "4",
    name: "区域负荷数据集-04",
    owner: "赵管理员",
    trainingStatus: "failed",
    createdAt: "2024-01-18T16:45:00Z"
  }
]);

// 用户选项（用于数据集筛选）
const userOptions = computed(() => [
  ...new Set(datasets.value.map(d => d.owner))
].map(owner => ({ title: owner, value: owner })));

// 计算属性
const filteredUsers = computed(() => {
  let filtered = users.value;

  if (userSearchKeyword.value) {
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(userSearchKeyword.value.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchKeyword.value.toLowerCase())
    );
  }

  if (roleFilter.value) {
    filtered = filtered.filter(user => user.role === roleFilter.value);
  }

  if (statusFilter.value) {
    filtered = filtered.filter(user => user.status === statusFilter.value);
  }

  return filtered;
});

const filteredDatasets = computed(() => {
  let filtered = datasets.value;

  if (datasetSearchKeyword.value) {
    filtered = filtered.filter(dataset =>
      dataset.name.toLowerCase().includes(datasetSearchKeyword.value.toLowerCase())
    );
  }

  if (datasetStatusFilter.value) {
    filtered = filtered.filter(dataset => dataset.trainingStatus === datasetStatusFilter.value);
  }

  if (ownerFilter.value) {
    filtered = filtered.filter(dataset => dataset.owner === ownerFilter.value);
  }

  return filtered;
});

// 统计数据
const totalUsers = computed(() => users.value.length);
const totalDatasets = computed(() => datasets.value.length);
const totalModels = computed(() => users.value.reduce((sum, user) => sum + user.totalModels, 0));
const successRate = computed(() => {
  const total = users.value.reduce((sum, user) => sum + user.totalModels, 0);
  const success = users.value.reduce((sum, user) => sum + user.successModels, 0);
  return total > 0 ? Math.round((success / total) * 100) : 0;
});

// 方法
const getRoleColor = (role: string) => {
  const colors = {
    administrator: "error",
    researcher: "primary",
    user: "success"
  };
  return colors[role as keyof typeof colors] || "default";
};

const getRoleText = (role: string) => {
  const texts = {
    administrator: "管理员",
    researcher: "研究员",
    user: "普通用户"
  };
  return texts[role as keyof typeof texts] || "未知";
};

const getDatasetStatusColor = (status: string) => {
  const colors = {
    pending: "warning",
    training: "info",
    completed: "success",
    failed: "error"
  };
  return colors[status as keyof typeof colors] || "default";
};

const getDatasetStatusIcon = (status: string) => {
  const icons = {
    pending: "mdi-clock-outline",
    training: "mdi-loading",
    completed: "mdi-check-circle",
    failed: "mdi-alert-circle"
  };
  return icons[status as keyof typeof icons] || "mdi-help-circle";
};

const getDatasetStatusText = (status: string) => {
  const texts = {
    pending: "待训练",
    training: "训练中",
    completed: "已完成",
    failed: "训练失败"
  };
  return texts[status as keyof typeof texts] || "未知";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

const viewUserDetails = (user: User) => {
  console.log("查看用户详情:", user);
};

const toggleUserStatus = (user: User) => {
  user.status = user.status === "active" ? "inactive" : "active";
};

const viewDatasetDetails = (dataset: AdminDataset) => {
  console.log("查看数据集详情:", dataset);
};

const viewTrainingResults = (dataset: AdminDataset) => {
  console.log("查看训练结果:", dataset);
};

// 初始化图表
const initializeCharts = () => {
  // 用户活跃度图表
  if (userActivityChart.value) {
    const chart = echarts.init(userActivityChart.value);
    chart.setOption({
      tooltip: {
        trigger: "axis"
      },
      xAxis: {
        type: "category",
        data: ["研究员", "管理员", "普通用户"]
      },
      yAxis: {
        type: "value",
        name: "模型数量"
      },
      series: [
        {
          name: "成功模型",
          type: "bar",
          data: [19, 22, 2],
          itemStyle: { color: "#4caf50" }
        },
        {
          name: "失败模型",
          type: "bar",
          data: [4, 3, 1],
          itemStyle: { color: "#f44336" }
        }
      ],
      legend: {
        bottom: 0
      }
    });
    registChart(chart);
  }

  // 训练任务趋势图表
  if (trainingTrendChart.value) {
    const chart = echarts.init(trainingTrendChart.value);
    chart.setOption({
      tooltip: {
        trigger: "axis"
      },
      xAxis: {
        type: "category",
        data: ["1月", "2月", "3月", "4月", "5月", "6月"]
      },
      yAxis: {
        type: "value",
        name: "任务数量"
      },
      series: [
        {
          name: "训练任务",
          type: "line",
          data: [5, 8, 12, 15, 18, 22],
          smooth: true,
          itemStyle: { color: "#2196f3" }
        },
        {
          name: "完成任务",
          type: "line",
          data: [4, 7, 10, 13, 16, 20],
          smooth: true,
          itemStyle: { color: "#4caf50" }
        }
      ],
      legend: {
        bottom: 0
      }
    });
    registChart(chart);
  }
};

// 监听视图模式变化
watch(viewMode, (newMode) => {
  if (newMode === "statistics") {
    nextTick(() => {
      initializeCharts();
    });
  }
});

onMounted(() => {
  if (viewMode.value === "statistics") {
    initializeCharts();
  }
});
</script>

<style scoped>
.admin-table :deep(.v-data-table__th) {
  text-align: center !important;
}

.admin-table :deep(.v-data-table__th:first-child) {
  text-align: left !important;
}

.text-medium-emphasis {
  opacity: 0.7;
}

.v-data-table {
  border-radius: 8px;
}
</style>
