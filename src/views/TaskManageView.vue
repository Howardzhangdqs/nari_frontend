<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card v-cloak variant="text">
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <v-icon class="mr-2">mdi-clipboard-list</v-icon>
              任务管理
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showTaskDialog = true">
              新增任务
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- 搜索和筛选 -->
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-text-field v-model="searchKeyword" label="搜索任务名称" prepend-inner-icon="mdi-magnify" variant="outlined"
                  density="compact" clearable></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="statusFilter" :items="statusOptions" label="任务状态" variant="outlined"
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

            <!-- 任务列表 -->
            <v-data-table :headers="headers" :items="filteredTasks" :loading="loading"
              :sort-by="[{ key: sortBy, order: 'desc' }]" class="elevation-1">

              <!-- 任务名称 -->
              <template v-slot:[`item.name`]="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-clipboard-text</v-icon>
                  <div>
                    <div class="font-weight-medium">{{ item.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ item.description || '暂无描述' }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 任务状态 -->
              <template v-slot:[`item.status`]="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small">
                  <v-icon start :icon="getStatusIcon(item.status)"></v-icon>
                  {{ getStatusText(item.status) }}
                </v-chip>
              </template>

              <!-- 数据集 -->
              <template v-slot:[`item.dataset`]="{ item }">
                <v-chip size="small" color="info" variant="outlined">
                  {{ item.dataset }}
                </v-chip>
              </template>

              <!-- 预测模型 -->
              <template v-slot:[`item.model`]="{ item }">
                <v-chip size="small" :color="getModelTypeColor(item.modelType)" variant="outlined">
                  {{ item.model }}
                </v-chip>
              </template>

              <!-- 进度 -->
              <template v-slot:[`item.progress`]="{ item }">
                <div class="d-flex align-center" style="min-width: 120px;">
                  <v-progress-linear :model-value="item.progress" :color="getProgressColor(item.progress)" height="6"
                    rounded class="mr-2">
                  </v-progress-linear>
                  <div class="text-caption">{{ item.progress }}%</div>
                </div>
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

              <!-- 最近更新时间 -->
              <template v-slot:[`item.updatedAt`]="{ item }">
                <div>
                  <div>{{ formatDate(item.updatedAt) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(item.updatedAt) }}
                  </div>
                </div>
              </template>

              <!-- 操作列 -->
              <template v-slot:[`item.actions`]="{ item }">
                <div class="d-flex gap-2">
                  <!-- 状态监视 -->
                  <v-btn v-if="item.status === 'running'" size="small" variant="text" color="primary" icon
                    @click="viewTaskMonitor(item)">
                    <v-tooltip activator="parent">状态监视</v-tooltip>
                    <v-icon>mdi-monitor-dashboard</v-icon>
                  </v-btn>

                  <!-- 结果查看 -->
                  <v-btn v-if="item.status === 'completed'" size="small" variant="text" color="success" icon
                    @click="viewTaskResult(item)">
                    <v-tooltip activator="parent">结果查看</v-tooltip>
                    <v-icon>mdi-chart-line</v-icon>
                  </v-btn>

                  <!-- 更多操作 -->
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn size="small" variant="text" v-bind="props" icon>
                        <v-tooltip activator="parent">更多操作</v-tooltip>
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item @click="updateTask(item)">
                        <template v-slot:prepend>
                          <v-icon>mdi-refresh</v-icon>
                        </template>
                        <v-list-item-title>更新</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="editTask(item)">
                        <template v-slot:prepend>
                          <v-icon>mdi-pencil</v-icon>
                        </template>
                        <v-list-item-title>编辑</v-list-item-title>
                      </v-list-item>
                      <v-divider></v-divider>
                      <v-list-item @click="deleteTask(item)" class="text-error">
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

    <!-- 任务信息编辑弹窗 -->
    <v-dialog v-model="showTaskDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-clipboard-plus</v-icon>
          {{ editingTask ? '编辑任务' : '新增任务' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="taskForm" v-model="taskFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="newTask.name" label="任务名称" :rules="[rules.required]"
                  variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="newTask.creator" label="任务创建人" :rules="[rules.required]"
                  variant="outlined"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="newTask.description" label="任务信息" variant="outlined" rows="3"></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="newTask.dataset" :items="availableDatasets" label="选用数据集" :rules="[rules.required]"
                  variant="outlined"></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="newTask.model" :items="availableModels" label="预测模型选择" variant="outlined"></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showTaskDialog = false">取消</v-btn>
          <v-btn color="primary" :disabled="!taskFormValid" @click="proceedToParameterSetting" :loading="saving">
            任务参数设置
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 任务参数设置弹窗 -->
    <v-dialog v-model="showParameterDialog" max-width="900px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-cog</v-icon>
          任务参数设置
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title class="text-subtitle-1">训练集划分</v-card-title>
                <v-card-text>
                  <v-slider v-model="parameters.trainRatio" label="训练集比例" min="0.6" max="0.9" step="0.05"
                    thumb-label="always">
                    <template v-slot:append>
                      <v-text-field v-model="parameters.trainRatio" type="number" style="width: 80px;"
                        variant="outlined" density="compact" hide-details></v-text-field>
                    </template>
                  </v-slider>
                  <v-slider v-model="parameters.valRatio" label="验证集比例" min="0.05" max="0.2" step="0.05"
                    thumb-label="always" class="mt-4">
                    <template v-slot:append>
                      <v-text-field v-model="parameters.valRatio" type="number" style="width: 80px;" variant="outlined"
                        density="compact" hide-details></v-text-field>
                    </template>
                  </v-slider>
                  <div class="text-caption mt-2">
                    测试集比例: {{ (1 - parameters.trainRatio - parameters.valRatio).toFixed(2) }}
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title class="text-subtitle-1">技术路线选择</v-card-title>
                <v-card-text>
                  <v-select v-model="parameters.algorithm" :items="algorithmOptions" label="算法选择"
                    variant="outlined"></v-select>
                  <v-text-field v-model="parameters.epochs" label="训练轮数" type="number" variant="outlined"
                    class="mt-3"></v-text-field>
                  <v-text-field v-model="parameters.batchSize" label="批次大小" type="number"
                    variant="outlined"></v-text-field>
                  <v-text-field v-model="parameters.learningRate" label="学习率" type="number" variant="outlined"
                    step="0.0001"></v-text-field>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showParameterDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveTask" :loading="saving">
            创建任务
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>
          确定要删除任务 "{{ taskToDelete?.name }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="confirmDelete" :loading="deleting">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

interface Task {
  id: string;
  name: string;
  description?: string;
  status: "pending" | "running" | "completed" | "failed";
  creator: string;
  dataset: string;
  model: string;
  modelType: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

const router = useRouter();

// 响应式数据
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const showTaskDialog = ref(false);
const showParameterDialog = ref(false);
const showDeleteDialog = ref(false);
const taskFormValid = ref(false);
const searchKeyword = ref("");
const statusFilter = ref("");
const sortBy = ref("createdAt");
const editingTask = ref<Task | null>(null);
const taskToDelete = ref<Task | null>(null);

// 表格列定义
const headers = [
  { title: "任务名称", key: "name", sortable: true, width: 200 },
  { title: "任务状态", key: "status", sortable: true, align: "center" as const },
  { title: "数据集", key: "dataset", sortable: true, align: "center" as const },
  { title: "预测模型", key: "model", sortable: true, align: "center" as const },
  { title: "进度", key: "progress", sortable: true, align: "center" as const },
  { title: "创建人", key: "creator", sortable: true, align: "center" as const },
  { title: "创建时间", key: "createdAt", sortable: true, align: "center" as const },
  { title: "最近更新", key: "updatedAt", sortable: true, align: "center" as const },
  { title: "操作", key: "actions", sortable: false, width: 150, align: "center" as const }
];

// 筛选选项
const statusOptions = [
  { title: "待开始", value: "pending" },
  { title: "运行中", value: "running" },
  { title: "已完成", value: "completed" },
  { title: "失败", value: "failed" }
];

const sortOptions = [
  { title: "创建时间", value: "createdAt" },
  { title: "更新时间", value: "updatedAt" },
  { title: "任务名称", value: "name" },
  { title: "进度", value: "progress" }
];

// 可用数据集和模型（从相应的管理页面获取）
const availableDatasets = ref([
  { title: "电力负荷数据集-01", value: "电力负荷数据集-01" },
  { title: "风力发电数据集-02", value: "风力发电数据集-02" },
  { title: "太阳能发电数据集-03", value: "太阳能发电数据集-03" },
  { title: "区域负荷数据集-04", value: "区域负荷数据集-04" }
]);

const availableModels = ref([
  { title: "LSTM", value: "LSTM" },
  { title: "Transformer", value: "Transformer" },
  { title: "XGBoost", value: "XGBoost" },
  { title: "Random Forest", value: "Random Forest" },
  { title: "GRU", value: "GRU" }
]);

const algorithmOptions = [
  { title: "Adam优化器", value: "adam" },
  { title: "SGD优化器", value: "sgd" },
  { title: "RMSprop优化器", value: "rmsprop" },
  { title: "AdaGrad优化器", value: "adagrad" }
];

// 任务数据
const tasks = ref<Task[]>([
  {
    id: "1",
    name: "电力负荷预测任务-01",
    description: "基于历史电力负荷数据进行未来负荷预测",
    status: "completed",
    creator: "张工程师",
    dataset: "电力负荷数据集-01",
    model: "LSTM",
    modelType: "RNN",
    progress: 100,
    createdAt: "2024-01-15T09:30:00Z",
    updatedAt: "2024-01-15T16:45:00Z"
  },
  {
    id: "2",
    name: "风力发电预测任务-02",
    description: "风电场发电功率预测分析",
    status: "running",
    creator: "李研究员",
    dataset: "风力发电数据集-02",
    model: "Transformer",
    modelType: "Attention",
    progress: 67,
    createdAt: "2024-01-20T14:15:00Z",
    updatedAt: "2024-01-22T10:30:00Z"
  },
  {
    id: "3",
    name: "太阳能发电预测任务-03",
    description: "光伏电站发电功率预测",
    status: "pending",
    creator: "王分析师",
    dataset: "太阳能发电数据集-03",
    model: "XGBoost",
    modelType: "Ensemble",
    progress: 0,
    createdAt: "2024-01-25T11:20:00Z",
    updatedAt: "2024-01-25T11:20:00Z"
  }
]);

// 新任务表单
const newTask = ref({
  name: "",
  description: "",
  creator: "",
  dataset: "",
  model: ""
});

// 任务参数
const parameters = ref({
  trainRatio: 0.7,
  valRatio: 0.15,
  algorithm: "adam",
  epochs: 100,
  batchSize: 32,
  learningRate: 0.001
});

// 表单验证规则
const rules = {
  required: (value: unknown) => !!value || "此字段必填"
};

// 计算属性
const filteredTasks = computed(() => {
  let filtered = tasks.value;

  // 按关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(task =>
      task.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (task.description || "").toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
  }

  // 按状态筛选
  if (statusFilter.value) {
    filtered = filtered.filter(task => task.status === statusFilter.value);
  }

  return filtered;
});

// 方法
const getStatusColor = (status: string) => {
  const colors = {
    pending: "warning",
    running: "info",
    completed: "success",
    failed: "error"
  };
  return colors[status as keyof typeof colors] || "default";
};

const getStatusIcon = (status: string) => {
  const icons = {
    pending: "mdi-clock-outline",
    running: "mdi-play-circle",
    completed: "mdi-check-circle",
    failed: "mdi-alert-circle"
  };
  return icons[status as keyof typeof icons] || "mdi-help-circle";
};

const getStatusText = (status: string) => {
  const texts = {
    pending: "待开始",
    running: "运行中",
    completed: "已完成",
    failed: "失败"
  };
  return texts[status as keyof typeof texts] || "未知";
};

const getModelTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    "RNN": "blue",
    "Attention": "purple",
    "Ensemble": "green",
    "Hybrid": "orange"
  };
  return colors[type] || "grey";
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "success";
  if (progress >= 50) return "primary";
  if (progress >= 20) return "warning";
  return "error";
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
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

const proceedToParameterSetting = () => {
  if (!taskFormValid.value) return;
  showTaskDialog.value = false;
  showParameterDialog.value = true;
};

const saveTask = async () => {
  saving.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newId = (tasks.value.length + 1).toString();
    const now = new Date().toISOString();

    tasks.value.unshift({
      id: newId,
      name: newTask.value.name,
      description: newTask.value.description,
      status: "pending",
      creator: newTask.value.creator,
      dataset: newTask.value.dataset,
      model: newTask.value.model,
      modelType: getModelType(newTask.value.model),
      progress: 0,
      createdAt: now,
      updatedAt: now
    });

    // 重置表单
    newTask.value = {
      name: "",
      description: "",
      creator: "",
      dataset: "",
      model: ""
    };

    showParameterDialog.value = false;
  } finally {
    saving.value = false;
  }
};

const getModelType = (modelName: string) => {
  const typeMap: { [key: string]: string } = {
    "LSTM": "RNN",
    "GRU": "RNN",
    "Transformer": "Attention",
    "XGBoost": "Ensemble",
    "Random Forest": "Ensemble"
  };
  return typeMap[modelName] || "Other";
};

const viewTaskMonitor = (task: Task) => {
  router.push({ name: "monitor", query: { taskId: task.id } });
};

const viewTaskResult = (task: Task) => {
  router.push({ name: "compare", query: { taskId: task.id } });
};

const updateTask = (task: Task) => {
  router.push({ name: "train", query: { taskId: task.id } });
};

const editTask = (task: Task) => {
  editingTask.value = task;
  newTask.value = {
    name: task.name,
    description: task.description || "",
    creator: task.creator,
    dataset: task.dataset,
    model: task.model
  };
  showTaskDialog.value = true;
};

const deleteTask = (task: Task) => {
  taskToDelete.value = task;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!taskToDelete.value) return;

  deleting.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const index = tasks.value.findIndex(t => t.id === taskToDelete.value!.id);
    if (index !== -1) {
      tasks.value.splice(index, 1);
    }

    showDeleteDialog.value = false;
    taskToDelete.value = null;
  } finally {
    deleting.value = false;
  }
};

onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.text-medium-emphasis {
  opacity: 0.7;
}
</style>
