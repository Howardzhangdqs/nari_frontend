<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref, watch, onMounted } from "vue";
import router from "./router";

const getPageFromRoute = (route) => {
  // 取路由name，若无则默认home
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
</script>

<template>
  <v-container>
    <v-layout>
      <v-navigation-drawer style="user-select: none;">
        <v-list>
          <v-tooltip text="平台Logo及名称">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props">
                <img src="/nari-logo.png" style="width: 100%" />
                XXXX预测平台
              </v-list-item>
            </template>
          </v-tooltip>
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
  </v-container>
</template>

<style scoped></style>
