<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref, watch, onMounted, computed } from "vue"; // 添加 computed
import router from "./router";
import { useDisplay } from "vuetify"; // 添加响应式显示工具

const { mdAndUp } = useDisplay(); // 获取响应式屏幕尺寸信息

const getPageFromRoute = (route) => {
  return route.name || "home";
};

const section_selected = ref([getPageFromRoute(router.currentRoute.value)]);
let section_selected_past = section_selected.value[0];

// 监听左侧list变化，切换路由
watch(section_selected, () => {
  if (section_selected.value.length === 0) {
    section_selected.value = [section_selected_past];
  } else {
    section_selected_past = section_selected.value[0];
    if (router.currentRoute.value.name !== section_selected.value[0]) {
      router.push({ name: section_selected.value[0] });
    }
  }
});

// 监听路由变化，切换左侧list
watch(
  () => router.currentRoute.value.name,
  (newName) => {
    if (newName && section_selected.value[0] !== newName) {
      section_selected.value = [newName];
    }
  }
);

// 修改为响应式控制，默认在大屏上展开
const section_opened = ref(mdAndUp.value);

// 添加悬浮按钮显示状态
const showFloatButton = computed(() => !section_opened.value);

// 响应屏幕尺寸变化
watch(mdAndUp, (newValue) => {
  section_opened.value = newValue;
});

// 点击悬浮按钮打开抽屉
const openDrawer = () => {
  section_opened.value = true;
};
</script>

<template>
  <v-container class="main-container">
    <v-layout>
      <v-navigation-drawer style="user-select: none;" v-model="section_opened" :permanent="mdAndUp"
        :temporary="!mdAndUp">
        <v-list>
          <!-- <v-tooltip text="平台Logo及名称">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props">
                <img src="/nari-logo.png" style="width: 100%" />
                XXXX预测平台
              </v-list-item>
            </template>
          </v-tooltip> -->
        </v-list>

        <v-divider></v-divider>

        <v-container>
          <v-list color="primary" v-model:selected="section_selected">
            <v-tooltip text="系统总览、服务状态、训练摘要等">
              <template v-slot:activator="{ props }">
                <v-list-item title="首页" value="home" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="line-md:home" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
            <!-- <v-tooltip text="特征选择、处理等">
              <template v-slot:activator="{ props }">
                <v-list-item title="特征工程" value="feature" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="bx:wrench" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip> -->
            <v-tooltip text="上传原始数据文件">
              <template v-slot:activator="{ props }">
                <v-list-item title="数据上传" value="data" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="majesticons:data-line" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip text="配置并训练模型">
              <template v-slot:activator="{ props }">
                <v-list-item title="模型训练" value="train" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="humbleicons:ai" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip text="对比不同模型效果">
              <template v-slot:activator="{ props }">
                <v-list-item title="模型对比" value="compare" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="material-symbols:text-compare-rounded" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip text="使用模型进行预测">
              <template v-slot:activator="{ props }">
                <v-list-item title="预测" value="predict" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="octicon:ai-model-16" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-container>
      </v-navigation-drawer>

      <v-main>
        <v-container>
          <router-view v-slot="{ Component }">
            <transition>
              <keep-alive>
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </v-container>
      </v-main>
    </v-layout>

    <v-fab-transition>
      <v-btn v-show="showFloatButton" class="float-button" color="primary" fab @click="openDrawer" icon="mdi-menu">
      </v-btn>
    </v-fab-transition>
  </v-container>
</template>
<style scoped>
.main-container {
  position: relative;
}

.float-button {
  position: fixed;
  left: 16px;
  bottom: 16px;
  z-index: 999;
  transition: all 0.3s ease;
}
</style>
