<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <v-icon class="mr-2">mdi-database</v-icon>
              数据集管理
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showUploadDialog = true">
              上传数据集
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- 搜索和筛选 -->
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-text-field v-model="searchKeyword" label="搜索数据集名称" prepend-inner-icon="mdi-magnify"
                  variant="outlined" density="compact" clearable></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="statusFilter" :items="statusOptions" label="训练状态" variant="outlined"
                  density="compact" clearable></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="sortBy" :items="sortOptions" label="排序方式" variant="outlined"
                  density="compact"></v-select>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn variant="text" prepend-icon="mdi-refresh" @click="refreshData" class="mt-1">
                  刷新
                </v-btn>
              </v-col>
            </v-row>

            <!-- 数据集列表 -->
            <v-data-table :headers="headers" :items="filteredDatasets" :loading="loading"
              :sort-by="[{ key: sortBy, order: 'desc' }]" class="elevation-1 dataset-table">

              <template v-slot:[`header.trainingStatus`]>
                <div class="text-center">训练状态</div>
              </template>

              <template v-slot:[`header.recordCount`]>
                <div class="text-center">记录数</div>
              </template>

              <template v-slot:[`header.createdAt`]>
                <div class="text-center">创建时间</div>
              </template>

              <template v-slot:[`header.trainingStartedAt`]>
                <div class="text-center">训练开始时间</div>
              </template>

              <template v-slot:[`header.completedAt`]>
                <div class="text-center">完成时间</div>
              </template>

              <template v-slot:[`header.actions`]>
                <div class="text-end">操作</div>
              </template>


              <!-- 数据集名称 -->
              <template v-slot:[`item.name`]="{ item }">
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

              <!-- 训练状态 -->
              <template v-slot:[`item.trainingStatus`]="{ item }">
                <v-chip :color="getStatusColor(item.trainingStatus)"
                  :variant="item.trainingStatus === 'completed' ? 'flat' : 'outlined'" size="small">
                  <v-icon start :icon="getStatusIcon(item.trainingStatus)"></v-icon>
                  {{ getStatusText(item.trainingStatus) }}
                </v-chip>
              </template>

              <!-- 创建时间 -->
              <template v-slot:[`item.createdAt`]="{ item }">
                <div>
                  <div>{{ formatDate(item.createdAt) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(item.createdAt) }}
                  </div>
                </div>
              </template>

              <!-- 训练开始时间 -->
              <template v-slot:[`item.trainingStartedAt`]="{ item }">
                <div v-if="item.trainingStartedAt">
                  <div>{{ formatDate(item.trainingStartedAt) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(item.trainingStartedAt) }}
                  </div>
                </div>
                <div v-else class="text-medium-emphasis">未开始</div>
              </template>

              <!-- 完成时间 -->
              <template v-slot:[`item.completedAt`]="{ item }">
                <div v-if="item.completedAt">
                  <div>{{ formatDate(item.completedAt) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(item.completedAt) }}
                  </div>
                </div>
                <div v-else class="text-medium-emphasis">未完成</div>
              </template>

              <!-- 操作列 -->
              <template v-slot:[`item.actions`]="{ item }">
                <div class="d-flex gap-2 justify-end align-end">
                  <!-- 查看训练进度 -->
                  <v-btn v-if="item.trainingStatus === 'training' || item.trainingStatus === 'completed'" size="small"
                    variant="text" color="primary" icon="mdi-chart-line" @click="viewTrainingProgress(item)">
                    <v-tooltip activator="parent">查看训练进度</v-tooltip>
                    <v-icon>mdi-chart-line</v-icon>
                  </v-btn>

                  <!-- 模型对比 -->
                  <v-btn v-if="item.trainingStatus === 'completed'" size="small" variant="text" color="success"
                    icon="mdi-compare" @click="viewModelComparison(item)">
                    <v-tooltip activator="parent">模型对比</v-tooltip>
                    <v-icon>mdi-compare</v-icon>
                  </v-btn>

                  <!-- 开始训练 -->
                  <v-btn v-if="item.trainingStatus === 'pending'" size="small" variant="text" color="primary"
                    icon="solar:play-bold" @click="startTraining(item)">
                    <v-tooltip activator="parent">开始训练</v-tooltip>
                    <v-icon>
                      <Icon icon="solar:play-bold" />
                    </v-icon>
                  </v-btn>

                  <!-- 更多操作 -->
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn size="small" variant="text" v-bind="props" icon="mdi-dots-vertical">
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item @click="editDataset(item)">
                        <template v-slot:prepend>
                          <v-icon>mdi-pencil</v-icon>
                        </template>
                        <v-list-item-title>编辑</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="downloadDataset(item)">
                        <template v-slot:prepend>
                          <v-icon>mdi-download</v-icon>
                        </template>
                        <v-list-item-title>下载</v-list-item-title>
                      </v-list-item>
                      <v-divider></v-divider>
                      <v-list-item @click="deleteDataset(item)" class="text-error">
                        <template v-slot:prepend>
                          <v-icon color="error">mdi-delete</v-icon>
                        </template>
                        <v-list-item-title>删除</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 上传对话框 -->
    <v-dialog v-model="showUploadDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-upload</v-icon>
          上传新数据集
        </v-card-title>
        <v-card-text>
          <v-form ref="uploadForm" v-model="uploadFormValid">
            <v-text-field v-model="newDataset.name" label="数据集名称" :rules="[rules.required]" variant="outlined"
              class="mb-3"></v-text-field>

            <v-textarea v-model="newDataset.description" label="数据集描述" variant="outlined" rows="3"
              class="mb-3"></v-textarea>

            <v-file-input v-model="newDataset.file" label="选择数据文件" accept=".csv,.xlsx,.json" :rules="[rules.required]"
              variant="outlined" show-size class="mb-3"></v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showUploadDialog = false">取消</v-btn>
          <v-btn color="primary" :disabled="!uploadFormValid" @click="uploadDataset" :loading="uploading">
            上传
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

interface Dataset {
  id: string
  name: string
  description?: string
  trainingStatus: "pending" | "training" | "completed" | "failed"
  createdAt: string
  trainingStartedAt?: string
  completedAt?: string
  fileSize: number
  recordCount: number
}

const router = useRouter();

// 响应式数据
const loading = ref(false);
const showUploadDialog = ref(false);
const uploading = ref(false);
const uploadFormValid = ref(false);
const searchKeyword = ref("");
const statusFilter = ref("");
const sortBy = ref("createdAt");

type HeaderAlign = "center" | "end" | "start" | undefined;

// 表格列定义
const headers = [
  { title: "数据集名称", key: "name", sortable: true },
  { title: "训练状态", key: "trainingStatus", sortable: true, align: "center" as HeaderAlign },
  { title: "记录数", key: "recordCount", sortable: true, align: "center" as HeaderAlign },
  { title: "创建时间", key: "createdAt", sortable: true, align: "center" as HeaderAlign },
  { title: "训练开始时间", key: "trainingStartedAt", sortable: true, align: "center" as HeaderAlign },
  { title: "完成时间", key: "completedAt", sortable: true, align: "center" as HeaderAlign },
  { title: "操作", key: "actions", sortable: false, width: 200, align: "end" as HeaderAlign }
];

// 筛选选项
const statusOptions = [
  { title: "待训练", value: "pending" },
  { title: "训练中", value: "training" },
  { title: "已完成", value: "completed" },
  { title: "训练失败", value: "failed" }
];

const sortOptions = [
  { title: "创建时间", value: "createdAt" },
  { title: "训练开始时间", value: "trainingStartedAt" },
  { title: "完成时间", value: "completedAt" },
  { title: "数据集名称", value: "name" }
];

// 模拟数据
const datasets = ref<Dataset[]>([
  {
    id: "1",
    name: "电力负荷数据集-01",
    description: "2023年全年电力负荷数据，包含温度、湿度等特征",
    trainingStatus: "completed",
    createdAt: "2024-01-15T09:30:00Z",
    trainingStartedAt: "2024-01-15T10:00:00Z",
    completedAt: "2024-01-15T14:30:00Z",
    fileSize: 25600000,
    recordCount: 8760
  },
  {
    id: "2",
    name: "风力发电数据集-02",
    description: "某风电场2023年发电功率数据",
    trainingStatus: "training",
    createdAt: "2024-01-20T14:15:00Z",
    trainingStartedAt: "2024-01-20T15:00:00Z",
    fileSize: 15800000,
    recordCount: 5256
  },
  {
    id: "3",
    name: "太阳能发电数据集-03",
    description: "光伏电站发电功率及气象数据",
    trainingStatus: "pending",
    createdAt: "2024-01-25T11:20:00Z",
    fileSize: 32100000,
    recordCount: 12045
  },
  {
    id: "4",
    name: "区域负荷数据集-04",
    description: "某地区用电负荷及经济指标数据",
    trainingStatus: "failed",
    createdAt: "2024-01-18T16:45:00Z",
    trainingStartedAt: "2024-01-18T17:00:00Z",
    fileSize: 18900000,
    recordCount: 6570
  }
]);

// 新数据集表单
const newDataset = ref({
  name: "",
  description: "",
  file: [] as File[]
});

// 表单验证规则
const rules = {
  required: (value: unknown) => !!value || "此字段必填"
};

// 计算属性
const filteredDatasets = computed(() => {
  let filtered = datasets.value;

  // 按关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(dataset =>
      dataset.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (dataset.description || "").toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }

  // 按状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(dataset => dataset.trainingStatus === statusFilter.value);
  }

  return filtered;
});

// 方法
const getStatusColor = (status: string) => {
  const colors = {
    pending: "warning",
    training: "info",
    completed: "success",
    failed: "error"
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusIcon = (status: string) => {
  const icons = {
    pending: "mdi-clock-outline",
    training: "mdi-loading",
    completed: "mdi-check-circle",
    failed: "mdi-alert-circle"
  };
  return icons[status as keyof typeof icons] || "mdi-help-circle";
};

const getStatusText = (status: string) => {
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

const refreshData = () => {
  loading.value = true;
  // 模拟刷新
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const viewTrainingProgress = (dataset: Dataset) => {
  // 跳转到训练监控页面
  router.push({ name: "monitor", query: { datasetId: dataset.id } });
};

const viewModelComparison = (dataset: Dataset) => {
  // 跳转到模型对比页面
  router.push({ name: "compare", query: { datasetId: dataset.id } });
};

const startTraining = (dataset: Dataset) => {
  // 跳转到训练配置页面
  router.push({ name: "train", query: { datasetId: dataset.id } });
};

const editDataset = (dataset: Dataset) => {
  console.log("编辑数据集:", dataset);
  // 实现编辑功能
};

const downloadDataset = (dataset: Dataset) => {
  console.log("下载数据集:", dataset);
  // 实现下载功能
};

const deleteDataset = (dataset: Dataset) => {
  console.log("删除数据集:", dataset);
  // 实现删除功能
};

const uploadDataset = async () => {
  if (!uploadFormValid.value) return;

  uploading.value = true;
  try {
    // 模拟上传过程
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 添加新数据集到列表
    const newId = (datasets.value.length + 1).toString();
    datasets.value.unshift({
      id: newId,
      name: newDataset.value.name,
      description: newDataset.value.description,
      trainingStatus: "pending",
      createdAt: new Date().toISOString(),
      fileSize: newDataset.value.file[0]?.size || 0,
      recordCount: Math.floor(Math.random() * 10000) + 1000
    });

    // 重置表单
    newDataset.value = {
      name: "",
      description: "",
      file: []
    };
    showUploadDialog.value = false;
  } finally {
    uploading.value = false;
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.dataset-table :deep(.v-data-table__th) {
  text-align: center !important;
}

.dataset-table :deep(.v-data-table__th:first-child) {
  text-align: left !important;
}

.v-data-table {
  border-radius: 8px;
}

.text-medium-emphasis {
  opacity: 0.7;
}
</style>
