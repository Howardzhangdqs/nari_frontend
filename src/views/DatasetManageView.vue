<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card variant="text">
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <v-icon class="mr-2">mdi-database</v-icon>
              数据集管理
            </div>
            <div class="d-flex gap-2">
              <v-btn color="secondary" prepend-icon="mdi-upload-multiple" @click="showBatchUploadDialog = true">
                批量新增
              </v-btn>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="showUploadDialog = true">
                上传数据集
              </v-btn>
            </div>
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
              <v-col cols="12" md="2">
                <v-btn variant="text" prepend-icon="mdi-refresh" @click="refreshData" class="mt-1">
                  刷新
                </v-btn>
              </v-col>
            </v-row>

            <!-- 数据集列表 -->
            <v-data-table :headers="headers" :items="filteredDatasets" :loading="loading"
              class="elevation-1 dataset-table special-table" ref="specialTable" id="dataset-manage-view-special-table"
              :data-scrolled="scrollLeft > 0" @scroll="handleScroll" items-per-page-text="每页显示">
              <template v-slot:[`header.dataInfo`]>
                <div class="text-center">数据基础信息</div>
              </template>
              <template v-slot:[`header.recordCount`]>
                <div class="text-center">数据条数</div>
              </template>
              <template v-slot:[`header.createdAt`]>
                <div class="text-center">创建时间</div>
              </template>
              <template v-slot:[`header.updateCount`]>
                <div class="text-center">更新次数</div>
              </template>
              <template v-slot:[`header.creator`]>
                <div class="text-center">创建人</div>
              </template>
              <template v-slot:[`header.actions`]>
                <div class="text-left fixed-right">操作</div>
              </template>

              <!-- 数据集名称 -->
              <template v-slot:[`item.name`]="{ item }">
                <div class="d-flex align-center">
                  <v-icon class="mr-2" color="primary">mdi-file-table</v-icon>
                  <div>
                    <div class="font-weight-medium w-max-content">{{ item.name }}</div>
                    <div class="text-caption text-medium-emphasis w-max-content">
                      {{ item.description || '暂无描述' }}
                    </div>
                  </div>
                </div>
              </template>

              <!-- 数据基础信息 -->
              <template v-slot:[`item.dataInfo`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <div class="text-body-2 text-truncate" style="max-width: 150px;">
                    <v-tooltip :text="item.dataInfo" location="top">
                      <template v-slot:activator="{ props }">
                        <span v-bind="props">{{ item.dataInfo }}</span>
                      </template>
                    </v-tooltip>
                  </div>
                </div>
              </template>

              <!-- 数据条数 -->
              <template v-slot:[`item.recordCount`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small" color="info" variant="outlined">
                    {{ item.recordCount.toLocaleString() }} 条
                  </v-chip>
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

              <!-- 更新次数 -->
              <template v-slot:[`item.updateCount`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <v-chip size="small" :color="item.updateCount > 0 ? 'success' : 'default'" variant="outlined">
                    {{ item.updateCount }} 次
                  </v-chip>
                </div>
              </template>

              <!-- 创建人 -->
              <template v-slot:[`item.creator`]="{ item }">
                <div class="d-flex align-center justify-center">
                  <div class="w-max-content">
                    {{ item.creator }}
                  </div>
                </div>
              </template>

              <!-- 操作列 -->
              <template v-slot:[`item.actions`]="{ item }">
                <div class="d-flex gap-1 fixed-right">
                  <!-- 新增按钮 -->
                  <v-btn size="small" variant="text" color="primary" icon @click="addDataset">
                    <v-tooltip activator="parent">新增数据集</v-tooltip>
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>

                  <!-- 更新按钮 -->
                  <v-btn size="small" variant="text" color="info" icon @click="updateDataset(item)">
                    <v-tooltip activator="parent">更新</v-tooltip>
                    <v-icon>mdi-refresh</v-icon>
                  </v-btn>

                  <!-- 编辑按钮 -->
                  <v-btn size="small" variant="text" color="primary" icon @click="editDataset(item)">
                    <v-tooltip activator="parent">编辑</v-tooltip>
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>

                  <!-- 删除按钮 -->
                  <v-btn size="small" variant="text" color="error" icon @click="deleteDataset(item)">
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

    <!-- 上传对话框 -->
    <v-dialog v-model="showUploadDialog" max-width="600px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-upload</v-icon>
          新增数据集
        </v-card-title>
        <v-card-text>
          <v-form ref="uploadForm" v-model="uploadFormValid">
            <v-text-field v-model="newDataset.name" :rules="[rules.required]" variant="outlined" class="mb-3">
              <template v-slot:label>
                <span class="text-error">*</span> 数据集名称
              </template>
            </v-text-field>

            <v-textarea v-model="newDataset.description" label="数据集描述" variant="outlined" rows="2"
              class="mb-3"></v-textarea>

            <v-text-field v-model="newDataset.dataInfo" :rules="[rules.required]" variant="outlined"
              placeholder="如：时序数据，包含负荷、温度、湿度等特征" class="mb-3">
              <template v-slot:label>
                <span class="text-error">*</span> 数据基础信息
              </template>
            </v-text-field>

            <v-text-field v-model="newDataset.creator" :rules="[rules.required]" variant="outlined" class="mb-3">
              <template v-slot:label>
                <span class="text-error">*</span> 创建人
              </template>
            </v-text-field>

            <v-file-input v-model="newDataset.file" accept=".csv,.xlsx,.json" :rules="[rules.required]"
              variant="outlined" show-size class="mb-3">
              <template v-slot:label>
                <span class="text-error">*</span> 选择数据文件
              </template>
            </v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showUploadDialog = false">取消</v-btn>
          <v-btn color="primary" :disabled="!uploadFormValid" @click="proceedToUpload" :loading="uploading">
            数据上传
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 批量新增数据集弹窗 -->
    <v-dialog v-model="showBatchUploadDialog" max-width="900px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-upload-multiple</v-icon>
          批量新增数据集
        </v-card-title>
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            请按照以下格式准备数据集信息：<br>
            数据集名称,数据集描述,数据基础信息,创建人<br>
            例如：电力负荷数据集-05,2024年电力负荷数据,时序数据，包含负荷、温度等特征,张工程师<br>
            <small>注：创建人字段可留空，留空时将使用当前登录用户的用户名</small>
          </v-alert>
          
          <v-tabs v-model="batchUploadTab" align-tabs="center">
            <v-tab value="file">CSV文件上传</v-tab>
            <v-tab value="text">CSV文本输入</v-tab>
          </v-tabs>

          <v-window v-model="batchUploadTab" class="mt-4">
            <v-window-item value="file">
              <v-card flat>
                <v-card-text>
                  <v-file-input 
                    v-model="batchUploadFile" 
                    accept=".csv" 
                    label="选择CSV文件" 
                    variant="outlined"
                    prepend-icon="mdi-file-delimited"
                    show-size
                    @change="handleFileUpload"
                  >
                  </v-file-input>
                  <div v-if="batchUploadPreview.length > 0" class="mt-4">
                    <div class="text-subtitle-2 mb-2">预览数据：</div>
                    <v-data-table
                      :headers="previewHeaders"
                      :items="batchUploadPreview"
                      density="compact"
                      class="elevation-1"
                      hide-default-footer
                    ></v-data-table>
                  </div>
                </v-card-text>
              </v-card>
            </v-window-item>

            <v-window-item value="text">
              <v-card flat>
                <v-card-text>
                  <v-textarea
                    v-model="batchUploadText"
                    label="粘贴CSV文本"
                    variant="outlined"
                    rows="10"
                    placeholder="数据集名称,数据集描述,数据基础信息,创建人（可留空）&#10;电力负荷数据集-05,2024年电力负荷数据,时序数据，包含负荷、温度等特征,张工程师"
                    @update:model-value="parseCSVText"
                  ></v-textarea>
                  <div v-if="batchUploadPreview.length > 0" class="mt-4">
                    <div class="text-subtitle-2 mb-2">预览数据：</div>
                    <v-data-table
                      :headers="previewHeaders"
                      :items="batchUploadPreview"
                      density="compact"
                      class="elevation-1"
                      hide-default-footer
                    ></v-data-table>
                  </div>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>

          <div v-if="batchUploadErrors.length > 0" class="mt-4">
            <v-alert type="error" variant="tonal" dense>
              <div class="text-subtitle-2 mb-2">数据验证错误：</div>
              <ul>
                <li v-for="(error, index) in batchUploadErrors" :key="index">{{ error }}</li>
              </ul>
            </v-alert>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="resetBatchUpload">取消</v-btn>
          <v-btn 
            color="primary" 
            :disabled="batchUploadPreview.length === 0 || batchUploadErrors.length > 0" 
            @click="confirmBatchUpload"
            :loading="batchUploading"
          >
            批量新增 ({{ batchUploadPreview.length }})
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 数据集上传弹窗 -->
    <v-dialog v-model="showDataUploadDialog" max-width="800px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-cloud-upload</v-icon>
          数据集上传
        </v-card-title>
        <v-card-text>
          <v-stepper v-model="uploadStep" alt-labels>
            <v-stepper-header>
              <v-stepper-item title="文件导入" value="1"></v-stepper-item>
              <v-divider></v-divider>
              <v-stepper-item title="数据库配置" value="2"></v-stepper-item>
            </v-stepper-header>

            <v-stepper-window>
              <v-stepper-window-item value="1">
                <v-card flat>
                  <v-card-text>
                    <div class="text-h6 mb-4">文件导入设置</div>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-select v-model="uploadConfig.fileFormat" :items="fileFormatOptions" label="文件格式"
                          variant="outlined"></v-select>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select v-model="uploadConfig.encoding" :items="encodingOptions" label="文件编码"
                          variant="outlined"></v-select>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field v-model="uploadConfig.separator" label="分隔符" variant="outlined"
                          placeholder="如: ,"></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-checkbox v-model="uploadConfig.hasHeader" label="包含表头"></v-checkbox>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-stepper-window-item>

              <v-stepper-window-item value="2">
                <v-card flat>
                  <v-card-text>
                    <div class="text-h6 mb-4">数据库配置</div>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field v-model="uploadConfig.tableName" variant="outlined" :rules="[rules.required]">
                          <template v-slot:label>
                            <span class="text-error">*</span> 表名
                          </template>
                        </v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-select v-model="uploadConfig.database" :items="databaseOptions" label="目标数据库"
                          variant="outlined"></v-select>
                      </v-col>
                      <v-col cols="12">
                        <v-textarea v-model="uploadConfig.description" label="数据表描述" variant="outlined"
                          rows="2"></v-textarea>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDataUploadDialog = false">取消</v-btn>
          <v-btn v-if="uploadStep < 2" @click="uploadStep++" color="primary">下一步</v-btn>
          <v-btn v-else @click="finalizeUpload" color="primary" :loading="uploading">
            完成上传
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">确认删除</v-card-title>
        <v-card-text>
          确定要删除数据集 "{{ datasetToDelete?.name }}" 吗？此操作不可撤销。
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";

interface Dataset {
  id: string
  name: string
  description?: string
  dataInfo: string
  recordCount: number
  createdAt: string
  updateCount: number
  creator: string
  trainingStatus: "pending" | "training" | "completed" | "failed"
  trainingStartedAt?: string
  completedAt?: string
  fileSize: number
}

const router = useRouter();

// 当前用户信息
const currentUser = ref("admin"); // TODO: 从登录状态获取用户名

// 响应式数据
const loading = ref(false);
const scrollLeft = ref(100);
const showUploadDialog = ref(false);
const showBatchUploadDialog = ref(false);
const showDataUploadDialog = ref(false);
const showDeleteDialog = ref(false);
const uploading = ref(false);
const batchUploading = ref(false);
const deleting = ref(false);
const uploadFormValid = ref(false);
const searchKeyword = ref("");
const statusFilter = ref("");
const uploadStep = ref(1);
const batchUploadTab = ref("file");
const datasetToDelete = ref<Dataset | null>(null);
const specialTable = ref<HTMLDivElement | null>(null);
const batchUploadFile = ref<File[]>([]);
const batchUploadText = ref("");
const batchUploadPreview = ref<any[]>([]);
const batchUploadErrors = ref<string[]>([]);

type HeaderAlign = "center" | "end" | "start" | undefined;

// 表格列定义
const headers = [
  { title: "数据集名称", key: "name", sortable: true, width: 200 },
  { title: "", key: "dataInfo", sortable: false },
  { title: "", key: "recordCount", sortable: true },
  { title: "", key: "createdAt", sortable: true },
  { title: "", key: "updateCount", sortable: true },
  { title: "", key: "creator", sortable: true },
  { title: "操作", key: "actions", sortable: false, width: 250, align: "center" as const }
];

// 预览表格列定义
const previewHeaders = [
  { title: "数据集名称", key: "name", sortable: false },
  { title: "数据集描述", key: "description", sortable: false },
  { title: "数据基础信息", key: "dataInfo", sortable: false },
  { title: "创建人", key: "creator", sortable: false }
];

// 筛选选项
const statusOptions = [
  { title: "待训练", value: "pending" },
  { title: "训练中", value: "training" },
  { title: "已完成", value: "completed" },
  { title: "训练失败", value: "failed" }
];

// 模拟数据
const datasets = ref<Dataset[]>([
  {
    id: "1",
    name: "电力负荷数据集-01",
    description: "2023年全年电力负荷数据，包含温度、湿度等特征",
    dataInfo: "时序数据，包含负荷、温度、湿度、风速等15个特征",
    recordCount: 8760,
    createdAt: "2024-01-15T09:30:00Z",
    updateCount: 3,
    creator: "张工程师",
    trainingStatus: "completed",
    trainingStartedAt: "2024-01-15T10:00:00Z",
    completedAt: "2024-01-15T14:30:00Z",
    fileSize: 25600000
  },
  {
    id: "2",
    name: "风力发电数据集-02",
    description: "某风电场2023年发电功率数据",
    dataInfo: "风电功率数据，包含风速、风向、气压等12个特征",
    recordCount: 5256,
    createdAt: "2024-01-20T14:15:00Z",
    updateCount: 1,
    creator: "李研究员",
    trainingStatus: "training",
    trainingStartedAt: "2024-01-20T15:00:00Z",
    fileSize: 15800000
  },
  {
    id: "3",
    name: "太阳能发电数据集-03",
    description: "光伏电站发电功率及气象数据",
    dataInfo: "光伏发电数据，包含辐照度、温度、云量等10个特征",
    recordCount: 12045,
    createdAt: "2024-01-25T11:20:00Z",
    updateCount: 0,
    creator: "王分析师",
    trainingStatus: "pending",
    fileSize: 32100000
  },
  {
    id: "4",
    name: "区域负荷数据集-04",
    description: "某地区用电负荷及经济指标数据",
    dataInfo: "区域负荷数据，包含用电量、GDP、人口等8个特征",
    recordCount: 6570,
    createdAt: "2024-01-18T16:45:00Z",
    updateCount: 2,
    creator: "赵专家",
    trainingStatus: "failed",
    trainingStartedAt: "2024-01-18T17:00:00Z",
    fileSize: 18900000
  }
]);

// 新数据集表单
const newDataset = ref({
  name: "",
  description: "",
  dataInfo: "",
  creator: "",
  file: [] as File[]
});

// 监听对话框打开，设置默认创建人
watch(showUploadDialog, (newVal) => {
  if (newVal) {
    newDataset.value.creator = currentUser.value;
  }
});

// 上传配置
const uploadConfig = ref({
  fileFormat: "csv",
  encoding: "utf-8",
  separator: ",",
  hasHeader: true,
  tableName: "",
  database: "timeseries_db",
  description: ""
});

// 配置选项
const fileFormatOptions = [
  { title: "CSV", value: "csv" },
  { title: "Excel", value: "xlsx" },
  { title: "JSON", value: "json" }
];

const encodingOptions = [
  { title: "UTF-8", value: "utf-8" },
  { title: "GBK", value: "gbk" },
  { title: "ASCII", value: "ascii" }
];

const databaseOptions = [
  { title: "时序数据库", value: "timeseries_db" },
  { title: "分析数据库", value: "analytics_db" },
  { title: "历史数据库", value: "historical_db" }
];

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
const handleScroll = () => {
  const scrollContainer = document.querySelector("#dataset-manage-view-special-table.special-table .v-table__wrapper");
  if (scrollContainer) {
    scrollLeft.value = scrollContainer.scrollWidth - scrollContainer.clientWidth - scrollContainer.scrollLeft;
    console.log(scrollLeft.value);
  }
};

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
  setTimeout(() => {
    loading.value = false;
    handleScroll();
  }, 1000);
};

const addDataset = () => {
  showUploadDialog.value = true;
};

const proceedToUpload = () => {
  if (!uploadFormValid.value) return;

  // 添加新数据集到列表（待编辑状态）
  const newId = (datasets.value.length + 1).toString();
  const now = new Date().toISOString();

  datasets.value.unshift({
    id: newId,
    name: newDataset.value.name,
    description: newDataset.value.description,
    dataInfo: newDataset.value.dataInfo,
    recordCount: 0, // 待上传确定
    createdAt: now,
    updateCount: 0,
    creator: newDataset.value.creator,
    trainingStatus: "pending",
    fileSize: newDataset.value.file[0]?.size || 0
  });

  // 关闭第一个弹窗，打开上传弹窗
  showUploadDialog.value = false;
  showDataUploadDialog.value = true;
  uploadStep.value = 1;
};

const finalizeUpload = async () => {
  uploading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 更新最新添加的数据集记录数
    if (datasets.value.length > 0) {
      datasets.value[0].recordCount = Math.floor(Math.random() * 10000) + 1000;
    }

    // 重置表单
    newDataset.value = {
      name: "",
      description: "",
      dataInfo: "",
      creator: "",
      file: []
    };

    uploadConfig.value = {
      fileFormat: "csv",
      encoding: "utf-8",
      separator: ",",
      hasHeader: true,
      tableName: "",
      database: "timeseries_db",
      description: ""
    };

    showDataUploadDialog.value = false;
  } finally {
    uploading.value = false;
  }
};

const updateDataset = (dataset: Dataset) => {
  // 跳转到数据上传页面进行更新
  router.push({ name: "data", query: { datasetId: dataset.id, mode: "update" } });
};

const editDataset = (dataset: Dataset) => {
  // 打开编辑弹窗，预填充数据
  newDataset.value = {
    name: dataset.name,
    description: dataset.description || "",
    dataInfo: dataset.dataInfo,
    creator: dataset.creator,
    file: []
  };
  showUploadDialog.value = true;
};

const deleteDataset = (dataset: Dataset) => {
  datasetToDelete.value = dataset;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!datasetToDelete.value) return;

  deleting.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const index = datasets.value.findIndex(d => d.id === datasetToDelete.value!.id);
    if (index !== -1) {
      datasets.value.splice(index, 1);
    }

    showDeleteDialog.value = false;
    datasetToDelete.value = null;
  } finally {
    deleting.value = false;
  }
};

// 批量上传方法
const handleFileUpload = (event: any) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    parseCSVContent(content);
  };
  reader.readAsText(file);
};

const parseCSVText = () => {
  if (!batchUploadText.value.trim()) {
    batchUploadPreview.value = [];
    return;
  }
  parseCSVContent(batchUploadText.value);
};

const parseCSVContent = (content: string) => {
  const lines = content.trim().split('\n');
  const data = [];
  const errors = [];

  // 跳过表头（如果有）
  const startIndex = lines[0].includes('数据集名称') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(part => part.trim().replace(/^"|"$/g, ''));
    
    if (parts.length !== 4) {
      errors.push(`第 ${i + 1} 行：数据格式不正确，需要4个字段`);
      continue;
    }

    const [name, description, dataInfo, creator] = parts;
    
    // 验证必填字段
    if (!name) errors.push(`第 ${i + 1} 行：数据集名称不能为空`);
    if (!dataInfo) errors.push(`第 ${i + 1} 行：数据基础信息不能为空`);
    // 创建人可以为空，为空时使用当前用户

    // 检查重名
    if (datasets.value.some(d => d.name === name)) {
      errors.push(`第 ${i + 1} 行：数据集名称 "${name}" 已存在`);
    }

    data.push({
      name,
      description: description || '',
      dataInfo,
      creator: creator || currentUser.value // 如果创建人为空则使用当前用户
    });
  }

  batchUploadPreview.value = data;
  batchUploadErrors.value = errors;
};

const confirmBatchUpload = async () => {
  batchUploading.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const now = new Date().toISOString();
    const newDatasets = batchUploadPreview.value.map((item, index) => ({
      id: (datasets.value.length + index + 1).toString(),
      name: item.name,
      description: item.description,
      dataInfo: item.dataInfo,
      recordCount: 0, // 待上传
      createdAt: now,
      updateCount: 0,
      creator: item.creator,
      trainingStatus: "pending" as const,
      fileSize: 0
    }));

    datasets.value.unshift(...newDatasets);
    resetBatchUpload();
  } finally {
    batchUploading.value = false;
  }
};

const resetBatchUpload = () => {
  showBatchUploadDialog.value = false;
  batchUploadFile.value = [];
  batchUploadText.value = '';
  batchUploadPreview.value = [];
  batchUploadErrors.value = [];
  batchUploadTab.value = 'file';
};

onMounted(() => {
  if (specialTable.value) {
    console.log(specialTable.value);
    document.querySelector("#dataset-manage-view-special-table.special-table .v-table__wrapper")?.addEventListener("scroll", handleScroll);
  }
  handleScroll();

  // 添加resize事件监听器
  window.addEventListener("resize", handleScroll);

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
.dataset-table[data-scrolled="true"] th:has(.fixed-right)::before,
.dataset-table[data-scrolled="true"] td:has(.fixed-right)::before {
  opacity: 1;
}
</style>
