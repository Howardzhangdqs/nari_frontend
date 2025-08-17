<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card flat>
          <v-card-title class="d-flex align-center justify-space-between mb-3">
            <div>
              <v-icon class="mr-2" color="primary">mdi-brain</v-icon>
              模型管理
            </div>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showAddModelDialog = true">
              添加模型
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- 搜索和筛选 -->
            <v-row class="">
              <v-col cols="12" md="4">
                <v-text-field v-model="searchQuery" label="搜索模型" prepend-inner-icon="mdi-magnify" variant="outlined"
                  density="compact" clearable></v-text-field>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="filterType" :items="modelTypes" label="模型类型" variant="outlined" density="compact"
                  clearable></v-select>
              </v-col>
              <v-col cols="12" md="3">
                <v-select v-model="filterStatus" :items="statusOptions" label="状态" variant="outlined" density="compact"
                  clearable></v-select>
              </v-col>
              <v-col cols="12" md="2">
                <v-btn variant="outlined" @click="clearFilters" block>
                  清空筛选
                </v-btn>
              </v-col>
            </v-row>

            <!-- 模型列表 -->
            <v-data-table :headers="headers" :items="filteredModels" :loading="isLoading" class="elevation-1"
              :items-per-page="10" items-per-page-text="每页显示">
              <template v-slot:[`header.type`]>
                <div class="text-center">模型类型</div>
              </template>
              <template v-slot:[`header.usageCount`]>
                <div class="text-center">使用次数</div>
              </template>
              <template v-slot:[`header.status`]>
                <div class="text-center">状态</div>
              </template>
              <template v-slot:[`header.createdAt`]>
                <div class="text-center">创建时间</div>
              </template>
              <template v-slot:[`header.description`]>
                <div class="text-center">基本内容</div>
              </template>
              <template v-slot:[`header.actions`]>
                <div class="text-left fixed-right">操作</div>
              </template>

              <template v-slot:[`item.name`]="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" :color="getModelTypeColor(item.type)">mdi-brain</v-icon>
                  <div>
                    <div class="font-weight-medium w-max-content">{{ item.name }}</div>
                    <!-- <div class="text-caption text-medium-emphasis w-max-content">{{ item.description }}</div> -->
                  </div>
                </div>
              </template>

              <template v-slot:[`item.description`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <div class="text-truncate" style="max-width: 150px;">
                    <v-tooltip :text="item.description" location="top">
                      <template v-slot:activator="{ props }">
                        <span v-bind="props">{{ item.description }}</span>
                      </template>
                    </v-tooltip>
                  </div>
                </div>
              </template>

              <template v-slot:[`item.type`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small" :color="getModelTypeColor(item.type)">
                    {{ item.type }}
                  </v-chip>
                </div>
              </template>

              <template v-slot:[`item.usageCount`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small" color="primary" variant="outlined">
                    {{ item.usageCount }} 次
                  </v-chip>
                </div>
              </template>

              <template v-slot:[`item.status`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small"
                    :color="item.status === 'active' ? 'success' : item.status === 'training' ? 'warning' : 'error'">
                    {{ getStatusText(item.status) }}
                  </v-chip>
                </div>
              </template>

              <template v-slot:[`item.createdAt`]="{ item }">
                <div>
                  <div>{{ formatDate(item.createdAt) }}</div>
                </div>
              </template>

              <template v-slot:[`item.actions`]="{ item }">
                <div class="d-flex gap-1 fixed-right">
                  <v-btn size="small" variant="text" color="primary" icon @click="editModel(item)">
                    <v-tooltip activator="parent" text="编辑"></v-tooltip>
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn size="small" variant="text" color="info" icon @click="viewModel(item)">
                    <v-tooltip activator="parent" text="查看详情"></v-tooltip>
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                  <v-btn size="small" variant="text" color="success" icon @click="exportModel(item)">
                    <v-tooltip activator="parent" text="导出"></v-tooltip>
                    <v-icon>mdi-download</v-icon>
                  </v-btn>
                  <v-btn size="small" variant="text" color="error" icon @click="confirmDelete(item)"
                    :disabled="item.status === 'training'">
                    <v-tooltip activator="parent" text="删除"></v-tooltip>
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 添加/编辑模型对话框 -->
    <v-dialog v-model="showAddModelDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6">
          {{ editingModel ? '编辑模型' : '添加新模型' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="modelFormRef" v-model="isFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="modelForm.name" variant="outlined" :rules="[v => !!v || '请输入模型名称']" required>
                  <template v-slot:label>
                    <span class="text-error">*</span> 模型名称
                  </template>
                </v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="modelForm.description" variant="outlined" rows="3" :rules="[v => !!v || '请输入模型描述']"
                  required>
                  <template v-slot:label>
                    <span class="text-error">*</span> 模型描述
                  </template>
                </v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="modelForm.type" :items="modelTypes" variant="outlined"
                  :rules="[v => !!v || '请选择模型类型']" required>
                  <template v-slot:label>
                    <span class="text-error">*</span> 模型类型
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select v-model="modelForm.complexity" :items="complexityOptions" variant="outlined"
                  :rules="[v => !!v || '请选择复杂度']" required>
                  <template v-slot:label>
                    <span class="text-error">*</span> 复杂度
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="modelForm.framework" label="框架" variant="outlined"
                  placeholder="如: PyTorch, TensorFlow"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="modelForm.version" label="版本" variant="outlined"
                  placeholder="如: 1.0.0"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="modelForm.parameters" label="模型参数 (JSON格式)" variant="outlined" rows="4"
                  placeholder='{"hidden_size": 256, "num_layers": 3}'></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="closeDialog">取消</v-btn>
          <v-btn color="primary" @click="saveModel" :loading="isSaving" :disabled="!isFormValid">
            {{ editingModel ? '更新' : '添加' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 模型详情对话框 -->
    <v-dialog v-model="showDetailDialog" max-width="800">
      <v-card v-if="selectedModel">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" :color="getModelTypeColor(selectedModel.type)">mdi-brain</v-icon>
          {{ selectedModel.name }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>类型</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedModel.type }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>复杂度</v-list-item-title>
                  <v-list-item-subtitle>{{ getComplexityText(selectedModel.complexity) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>框架</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedModel.framework || '未指定' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>版本</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedModel.version || '未指定' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>状态</v-list-item-title>
                  <v-list-item-subtitle>{{ getStatusText(selectedModel.status) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>创建时间</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedModel.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-h6 mb-2">描述</div>
              <p class="text-body-2 mb-4">{{ selectedModel.description }}</p>

              <div class="text-h6 mb-2">参数配置</div>
              <v-code class="text-caption">
                {{ selectedModel.parameters || '{}' }}
              </v-code>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDetailDialog = false">关闭</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>
          确定要删除模型 "{{ modelToDelete?.name }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteModel" :loading="isDeleting">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 提示消息 -->
    <v-snackbar v-model="showMessage" :color="messageType" timeout="3000" location="top">
      {{ message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

// 接口定义
interface Model {
  id: string;
  name: string;
  description: string;
  type: string;
  complexity: "low" | "medium" | "high";
  framework?: string;
  version?: string;
  parameters?: string;
  status: "active" | "training" | "inactive";
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 响应式数据
const isLoading = ref(false);
const isSaving = ref(false);
const isDeleting = ref(false);
const searchQuery = ref("");
const filterType = ref("");
const filterStatus = ref("");
const showAddModelDialog = ref(false);
const showDetailDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedModel = ref<Model | null>(null);
const modelToDelete = ref<Model | null>(null);
const editingModel = ref<Model | null>(null);
const isFormValid = ref(false);

// 消息提示
const showMessage = ref(false);
const message = ref("");
const messageType = ref<"success" | "error" | "warning" | "info">("success");

// 表单数据
const modelForm = ref({
  name: "",
  description: "",
  type: "",
  complexity: "medium" as "low" | "medium" | "high",
  framework: "",
  version: "",
  parameters: ""
});

// 模型数据
const models = ref<Model[]>([
  {
    id: "1",
    name: "LSTM时序预测模型",
    description: "长短期记忆网络，适合时间序列预测任务，能够处理长序列依赖关系",
    type: "RNN",
    complexity: "medium",
    framework: "PyTorch",
    version: "1.0.0",
    parameters: "{\"hidden_size\": 128, \"num_layers\": 2, \"dropout\": 0.2}",
    status: "active",
    usageCount: 24,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15")
  },
  {
    id: "2",
    name: "Transformer注意力模型",
    description: "基于注意力机制的Transformer模型，处理长序列效果好，适用于复杂时序预测",
    type: "Attention",
    complexity: "high",
    framework: "TensorFlow",
    version: "2.1.0",
    parameters: "{\"d_model\": 512, \"nhead\": 8, \"num_layers\": 6}",
    status: "training",
    usageCount: 18,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-22")
  },
  {
    id: "3",
    name: "RandomForest集成模型",
    description: "随机森林集成学习算法，鲁棒性强，适合处理非线性时序数据",
    type: "Ensemble",
    complexity: "low",
    framework: "Scikit-learn",
    version: "1.5.0",
    parameters: "{\"n_estimators\": 100, \"max_depth\": 10, \"random_state\": 42}",
    status: "active",
    usageCount: 12,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10")
  },
  {
    id: "4",
    name: "XGBoost梯度提升模型",
    description: "梯度提升决策树算法，在时序预测任务中表现优异",
    type: "Ensemble",
    complexity: "medium",
    framework: "XGBoost",
    version: "1.7.0",
    parameters: "{\"max_depth\": 6, \"learning_rate\": 0.1, \"n_estimators\": 200}",
    status: "active",
    usageCount: 15,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12")
  },
  {
    id: "5",
    name: "GRU门控循环模型",
    description: "门控循环单元，轻量级RNN变体，训练速度快",
    type: "RNN",
    complexity: "medium",
    framework: "PyTorch",
    version: "1.2.0",
    parameters: "{\"hidden_size\": 64, \"num_layers\": 1, \"dropout\": 0.1}",
    status: "active",
    usageCount: 8,
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18")
  }
]);

// 表格配置
const headers = [
  { title: "模型名称", key: "name", sortable: true, width: 200 },
  { title: "", key: "type", sortable: true },
  { title: "基本内容", key: "description", sortable: false },
  { title: "", key: "createdAt", sortable: true },
  { title: "", key: "usageCount", sortable: true },
  { title: "", key: "status", sortable: true },
  { title: "操作", key: "actions", sortable: false, width: 200, align: "center" as const }
];

// 选项数据
const modelTypes = [
  { title: "RNN", value: "RNN" },
  { title: "CNN", value: "CNN" },
  { title: "Attention", value: "Attention" },
  { title: "Ensemble", value: "Ensemble" },
  { title: "Hybrid", value: "Hybrid" }
];

const complexityOptions = [
  { title: "低复杂度", value: "low" },
  { title: "中等复杂度", value: "medium" },
  { title: "高复杂度", value: "high" }
];

const statusOptions = [
  { title: "活跃", value: "active" },
  { title: "训练中", value: "training" },
  { title: "不活跃", value: "inactive" }
];

// 计算属性
const filteredModels = computed(() => {
  let filtered = models.value;

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(model =>
      model.name.toLowerCase().includes(query) ||
      model.description.toLowerCase().includes(query) ||
      model.type.toLowerCase().includes(query)
    );
  }

  // 类型过滤
  if (filterType.value) {
    filtered = filtered.filter(model => model.type === filterType.value);
  }

  // 状态过滤
  if (filterStatus.value) {
    filtered = filtered.filter(model => model.status === filterStatus.value);
  }

  return filtered;
});

// 工具函数
const getModelTypeColor = (type: string) => {
  const colors: { [key: string]: string } = {
    "RNN": "blue",
    "CNN": "green",
    "Attention": "purple",
    "Ensemble": "orange",
    "Hybrid": "teal"
  };
  return colors[type] || "grey";
};

const getComplexityText = (complexity: string) => {
  const texts: { [key: string]: string } = {
    "low": "低复杂度",
    "medium": "中等复杂度",
    "high": "高复杂度"
  };
  return texts[complexity] || complexity;
};

const getStatusText = (status: string) => {
  const texts: { [key: string]: string } = {
    "active": "活跃",
    "training": "训练中",
    "inactive": "不活跃"
  };
  return texts[status] || status;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("zh-CN") + " " + date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

// 方法
const clearFilters = () => {
  searchQuery.value = "";
  filterType.value = "";
  filterStatus.value = "";
};

const resetForm = () => {
  modelForm.value = {
    name: "",
    description: "",
    type: "",
    complexity: "medium",
    framework: "",
    version: "",
    parameters: ""
  };
  editingModel.value = null;
};

const closeDialog = () => {
  showAddModelDialog.value = false;
  resetForm();
};

const editModel = (model: Model) => {
  editingModel.value = model;
  modelForm.value = {
    name: model.name,
    description: model.description,
    type: model.type,
    complexity: model.complexity,
    framework: model.framework || "",
    version: model.version || "",
    parameters: model.parameters || ""
  };
  showAddModelDialog.value = true;
};

const viewModel = (model: Model) => {
  selectedModel.value = model;
  showDetailDialog.value = true;
};

const confirmDelete = (model: Model) => {
  modelToDelete.value = model;
  showDeleteDialog.value = true;
};

const saveModel = async () => {
  isSaving.value = true;

  try {
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (editingModel.value) {
      // 更新现有模型
      const index = models.value.findIndex(m => m.id === editingModel.value!.id);
      if (index !== -1) {
        models.value[index] = {
          ...models.value[index],
          ...modelForm.value,
          updatedAt: new Date()
        };
      }
      showMessage.value = true;
      message.value = "模型更新成功！";
    } else {
      // 添加新模型
      const newModel: Model = {
        id: Date.now().toString(),
        ...modelForm.value,
        status: "inactive",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      models.value.push(newModel);
      showMessage.value = true;
      message.value = "模型添加成功！";
    }

    messageType.value = "success";
    closeDialog();
  } catch (error) {
    showMessage.value = true;
    message.value = "操作失败，请重试";
    messageType.value = "error";
  } finally {
    isSaving.value = false;
  }
};

const deleteModel = async () => {
  if (!modelToDelete.value) return;

  isDeleting.value = true;

  try {
    // 模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 1000));

    const index = models.value.findIndex(m => m.id === modelToDelete.value!.id);
    if (index !== -1) {
      models.value.splice(index, 1);
    }

    showMessage.value = true;
    message.value = "模型删除成功！";
    messageType.value = "success";
    showDeleteDialog.value = false;
    modelToDelete.value = null;
  } catch (error) {
    showMessage.value = true;
    message.value = "删除失败，请重试";
    messageType.value = "error";
  } finally {
    isDeleting.value = false;
  }
};

const exportModel = (model: Model) => {
  // 模拟导出模型
  const exportData = {
    ...model,
    exportedAt: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${model.name}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showMessage.value = true;
  message.value = `模型 "${model.name}" 导出成功！`;
  messageType.value = "success";
};

// 生命周期
onMounted(() => {
  // 可以在这里加载模型数据
});
</script>

<style scoped>
.v-data-table {
  border-radius: 8px;
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
}
</style>
