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
              <v-col cols="12" md="2">
                <v-btn variant="text" prepend-icon="mdi-refresh" @click="refreshData" class="mt-1">
                  刷新
                </v-btn>
              </v-col>
            </v-row>

            <!-- 任务列表 -->
            <v-data-table :headers="headers" :items="filteredTasks" :loading="loading"
              class="elevation-1 special-table" ref="specialTable"
              id="task-manage-view-special-table" :data-scrolled="scrollLeft > 0" @scroll="handleScroll" items-per-page-text="每页显示">
              <template v-slot:[`header.status`]>
                <div class="text-center">任务状态</div>
              </template>
              <template v-slot:[`header.dataset`]>
                <div class="text-center">数据集</div>
              </template>
              <template v-slot:[`header.model`]>
                <div class="text-center">预测模型</div>
              </template>
              <template v-slot:[`header.progress`]>
                <div class="text-center">进度</div>
              </template>
              <template v-slot:[`header.creator`]>
                <div class="text-center">创建人</div>
              </template>
              <template v-slot:[`header.createdAt`]>
                <div class="text-center">创建时间</div>
              </template>
              <template v-slot:[`header.updatedAt`]>
                <div class="text-center">最近更新</div>
              </template>
              <template v-slot:[`header.actions`]>
                <div class="text-left fixed-right">操作</div>
              </template>

              <!-- 任务名称 -->
              <template v-slot:[`item.name`]="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-clipboard-text</v-icon>
                  <div>
                    <div class="font-weight-medium w-max-content">{{ item.name }}</div>
                    <div class="text-caption text-medium-emphasis w-max-content">
                      {{ item.description || '暂无描述' }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 任务状态 -->
              <template v-slot:[`item.status`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip :color="getStatusColor(item.status)" size="small">
                    <v-icon start :icon="getStatusIcon(item.status)"></v-icon>
                    {{ getStatusText(item.status) }}
                  </v-chip>
                </div>
              </template>

              <!-- 数据集 -->
              <template v-slot:[`item.dataset`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small" color="info" variant="outlined">
                    {{ item.dataset }}
                  </v-chip>
                </div>
              </template>

              <!-- 预测模型 -->
              <template v-slot:[`item.model`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small" :color="getModelTypeColor(item.modelType)" variant="outlined">
                    {{ item.model }}
                  </v-chip>
                </div>
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
              <template v-slot:[`item.creator`]="{ item }">
                <div class="w-max-content">
                  {{ item.creator }}
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
                <div class="d-flex gap-1 fixed-right">
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

                  <!-- 更新按钮 -->
                  <v-btn size="small" variant="text" color="info" icon @click="updateTask(item)">
                    <v-tooltip activator="parent">更新</v-tooltip>
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>

                  <!-- 编辑按钮 -->
                  <v-btn size="small" variant="text" color="primary" icon @click="editTask(item)">
                    <v-tooltip activator="parent">编辑</v-tooltip>
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>

                  <!-- 删除按钮 -->
                  <v-btn size="small" variant="text" color="error" icon @click="deleteTask(item)">
                    <v-tooltip activator="parent">删除</v-tooltip>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
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
                <v-text-field v-model="newTask.name" :rules="[rules.required]" variant="outlined">
                  <template v-slot:label>
                    <span class="text-error">*</span> 任务名称
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="newTask.creator" :rules="[rules.required]" variant="outlined">
                  <template v-slot:label>
                    <span class="text-error">*</span> 任务创建人
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="newTask.description" label="任务信息" variant="outlined" rows="3"></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="newTask.dataset" :items="availableDatasets" :rules="[rules.required]"
                  variant="outlined">
                  <template v-slot:label>
                    <span class="text-error">*</span> 选用数据集
                  </template>
                </v-select>
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
            <v-col cols="12">
              <v-card>
                <v-card-title class="text-subtitle-1">参数预设</v-card-title>
                <v-card-text>
                  <v-select v-model="selectedPreset" :items="presetOptions" label="选择参数预设" 
                    variant="outlined" clearable @update:model-value="applyPreset">
                    <template v-slot:append>
                      <v-btn size="small" icon variant="text" @click="openPresetManagement" v-if="isAdmin">
                        <v-tooltip activator="parent">管理预设</v-tooltip>
                        <v-icon>mdi-cog</v-icon>
                      </v-btn>
                    </template>
                  </v-select>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title class="text-subtitle-1">数据集划分</v-card-title>
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
                <v-card-title class="text-subtitle-1">训练参数配置</v-card-title>
                <v-card-text>
                  <v-select v-model="parameters.algorithm" :items="algorithmOptions" label="优化算法"
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

    <!-- 参数预设管理弹窗 -->
    <v-dialog v-model="showPresetManagement" max-width="700px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-tune-variant</v-icon>
          参数预设管理
        </v-card-title>
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12">
              <v-btn color="primary" prepend-icon="mdi-plus" @click="addNewPreset">
                新增预设
              </v-btn>
            </v-col>
          </v-row>
          <v-data-table :headers="presetHeaders" :items="presetData" :loading="presetLoading">
            <template v-slot:[`item.actions`]="{ item }">
              <div class="d-flex gap-1">
                <v-btn size="small" variant="text" color="primary" icon @click="editPreset(item)">
                  <v-tooltip activator="parent">编辑</v-tooltip>
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn size="small" variant="text" color="error" icon @click="deletePreset(item)">
                  <v-tooltip activator="parent">删除</v-tooltip>
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPresetManagement = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 新增/编辑预设弹窗 -->
    <v-dialog v-model="showPresetDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-tune</v-icon>
          {{ editingPreset ? '编辑预设' : '新增预设' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="presetForm" v-model="presetFormValid">
            <v-text-field v-model="currentPreset.name" :rules="[rules.required]" variant="outlined">
              <template v-slot:label>
                <span class="text-error">*</span> 预设名称
              </template>
            </v-text-field>
            <v-text-field v-model="currentPreset.epochs" label="训练轮数" type="number" variant="outlined"></v-text-field>
            <v-text-field v-model="currentPreset.batchSize" label="批次大小" type="number" variant="outlined"></v-text-field>
            <v-text-field v-model="currentPreset.learningRate" label="学习率" type="number" variant="outlined" step="0.0001"></v-text-field>
            <v-select v-model="currentPreset.algorithm" :items="algorithmOptions" label="优化算法" variant="outlined"></v-select>
            <v-slider v-model="currentPreset.trainRatio" label="训练集比例" min="0.6" max="0.9" step="0.05" thumb-label="always"></v-slider>
            <v-slider v-model="currentPreset.valRatio" label="验证集比例" min="0.05" max="0.2" step="0.05" thumb-label="always"></v-slider>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showPresetDialog = false">取消</v-btn>
          <v-btn color="primary" :disabled="!presetFormValid" @click="savePreset" :loading="savingPreset">
            保存
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
const scrollLeft = ref(100);
const saving = ref(false);
const deleting = ref(false);
const savingPreset = ref(false);
const presetLoading = ref(false);
const showTaskDialog = ref(false);
const showParameterDialog = ref(false);
const showDeleteDialog = ref(false);
const showPresetManagement = ref(false);
const showPresetDialog = ref(false);
const taskFormValid = ref(false);
const presetFormValid = ref(false);
const searchKeyword = ref("");
const statusFilter = ref("");
const editingTask = ref<Task | null>(null);
const taskToDelete = ref<Task | null>(null);
const specialTable = ref<HTMLDivElement | null>(null);
const selectedPreset = ref("");
const editingPreset = ref(false);
const isAdmin = ref(true); // TODO: 从用户权限系统获取

// 表格列定义
const headers = [
  { title: "任务名称", key: "name", sortable: true, width: 200 },
  { title: "", key: "status", sortable: true },
  { title: "", key: "dataset", sortable: true },
  { title: "", key: "model", sortable: true },
  { title: "", key: "progress", sortable: true },
  { title: "", key: "creator", sortable: true },
  { title: "", key: "createdAt", sortable: true },
  { title: "", key: "updatedAt", sortable: true },
  { title: "操作", key: "actions", sortable: false, width: 280, align: "center" as const }
];

// 预设管理表格列定义
const presetHeaders = [
  { title: "预设名称", key: "name", sortable: true },
  { title: "训练轮数", key: "epochs", sortable: true },
  { title: "批次大小", key: "batchSize", sortable: true },
  { title: "学习率", key: "learningRate", sortable: true },
  { title: "优化算法", key: "algorithm", sortable: true },
  { title: "训练集比例", key: "trainRatio", sortable: true },
  { title: "验证集比例", key: "valRatio", sortable: true },
  { title: "操作", key: "actions", sortable: false, width: 100 }
];

// 筛选选项
const statusOptions = [
  { title: "待开始", value: "pending" },
  { title: "运行中", value: "running" },
  { title: "已完成", value: "completed" },
  { title: "失败", value: "failed" }
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

// 参数预设数据
const presetData = ref([
  {
    id: "1",
    name: "XGBoost最佳参数",
    epochs: 300,
    batchSize: 32,
    learningRate: 0.3,
    algorithm: "adam",
    trainRatio: 0.8,
    valRatio: 0.1
  },
  {
    id: "2",
    name: "Transformer最佳参数",
    epochs: 100,
    batchSize: 16,
    learningRate: 0.0001,
    algorithm: "adam",
    trainRatio: 0.85,
    valRatio: 0.1
  },
  {
    id: "3",
    name: "LSTM最佳参数",
    epochs: 150,
    batchSize: 32,
    learningRate: 0.001,
    algorithm: "adam",
    trainRatio: 0.7,
    valRatio: 0.15
  },
  {
    id: "4",
    name: "Random Forest最佳参数",
    epochs: 200,
    batchSize: 64,
    learningRate: 0.01,
    algorithm: "adam",
    trainRatio: 0.75,
    valRatio: 0.15
  },
  {
    id: "5",
    name: "GRU最佳参数",
    epochs: 120,
    batchSize: 32,
    learningRate: 0.001,
    algorithm: "rmsprop",
    trainRatio: 0.7,
    valRatio: 0.15
  },
  {
    id: "6",
    name: "快速验证模式",
    epochs: 30,
    batchSize: 128,
    learningRate: 0.01,
    algorithm: "sgd",
    trainRatio: 0.6,
    valRatio: 0.2
  }
]);

// 当前预设表单
const currentPreset = ref({
  id: "",
  name: "",
  epochs: 100,
  batchSize: 32,
  learningRate: 0.001,
  algorithm: "adam",
  trainRatio: 0.7,
  valRatio: 0.15
});

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

// 预设选项
const presetOptions = computed(() => {
  return presetData.value.map(preset => ({
    title: preset.name,
    value: preset.id
  }));
});

// 方法
const handleScroll = () => {
  const scrollContainer = document.querySelector("#task-manage-view-special-table.special-table .v-table__wrapper");
  if (scrollContainer) {
    scrollLeft.value = scrollContainer.scrollWidth - scrollContainer.clientWidth - scrollContainer.scrollLeft;
    console.log(scrollLeft.value);
  }
};

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
    handleScroll();
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

// 预设管理方法
const applyPreset = (presetId: string | null) => {
  if (!presetId) return;
  
  const preset = presetData.value.find(p => p.id === presetId);
  if (preset) {
    parameters.value = {
      ...parameters.value,
      epochs: preset.epochs,
      batchSize: preset.batchSize,
      learningRate: preset.learningRate,
      algorithm: preset.algorithm,
      trainRatio: preset.trainRatio,
      valRatio: preset.valRatio
    };
  }
};

const openPresetManagement = () => {
  showParameterDialog.value = false;
  showPresetManagement.value = true;
};

const addNewPreset = () => {
  resetPresetForm();
  editingPreset.value = false;
  showPresetDialog.value = true;
};

const editPreset = (preset: any) => {
  editingPreset.value = true;
  currentPreset.value = { ...preset };
  showPresetDialog.value = true;
};

const savePreset = async () => {
  savingPreset.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (editingPreset.value) {
      // 更新现有预设
      const index = presetData.value.findIndex(p => p.id === currentPreset.value.id);
      if (index !== -1) {
        presetData.value[index] = { ...currentPreset.value };
      }
    } else {
      // 新增预设
      const newId = (presetData.value.length + 1).toString();
      presetData.value.push({
        ...currentPreset.value,
        id: newId
      });
    }
    
    showPresetDialog.value = false;
    resetPresetForm();
  } finally {
    savingPreset.value = false;
  }
};

const deletePreset = async (preset: any) => {
  const index = presetData.value.findIndex(p => p.id === preset.id);
  if (index !== -1) {
    presetData.value.splice(index, 1);
  }
};

const resetPresetForm = () => {
  currentPreset.value = {
    id: "",
    name: "",
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    algorithm: "adam",
    trainRatio: 0.7,
    valRatio: 0.15
  };
  editingPreset.value = false;
};

onMounted(() => {
  if (specialTable.value) {
    console.log(specialTable.value);
    document.querySelector("#task-manage-view-special-table.special-table .v-table__wrapper")?.addEventListener("scroll", handleScroll);
  }
  handleScroll();

  // 添加resize事件监听器
  window.addEventListener("resize", handleScroll);

  refreshData();
});
</script>

<style scoped>
.text-medium-emphasis {
  opacity: 0.7;
}
</style>

<style>
/* 将样式应用到包含 .fixed-right 元素的父单元格（表头/表格单元格） */
th:has(.fixed-right),
td:has(.fixed-right) {
  position: sticky;
  right: 0;
  top: 0;
  background-color: #ffffff;
  z-index: 1;
  padding-right: 8px;
  overflow: visible;
  /* 允许伪元素溢出显示渐变 */
}

/* 在固定列左侧添加从淡到深的渐变（左侧由淡变深） */
th:has(.fixed-right)::before,
td:has(.fixed-right)::before {
  content: "";
  position: absolute;
  left: -24px;
  /* 渐变区域宽度，可调整 */
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
  z-index: 2;
  /* 从左到右由透明（淡）渐变到微暗（深），可根据主题调整颜色/透明度 */
  background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(0, 0, 0, 0.06));
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* 当有横向滚动时显示渐变 */
.v-data-table[data-scrolled="true"] th:has(.fixed-right)::before,
.v-data-table[data-scrolled="true"] td:has(.fixed-right)::before {
  opacity: 1;
}
</style>
