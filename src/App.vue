<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref, watch, onMounted, computed } from "vue";
import router from "./router";
import { useDisplay } from "vuetify";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import LoginView from "./components/LoginView.vue";
import { currentUser, isAuthenticated, login, logout } from "./stores/auth";

const { mdAndUp } = useDisplay();

const getPageFromRoute = (route: RouteLocationNormalizedLoadedGeneric) => {
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

// 处理登录成功
const handleLoginSuccess = (user: { username: string; role: "administrator" | "researcher" | "user" }) => {
  console.log("App received login success event:", user); // 调试日志
  login(user);
};

// 处理登出
const handleLogout = () => {
  logout();
  // 跳转到首页
  router.push("/");
};

// 获取角色显示名称
const getRoleDisplayName = (role?: string) => {
  const roleNames = {
    administrator: "管理员",
    researcher: "研究员",
    user: "普通用户"
  };
  return roleNames[role as keyof typeof roleNames] || "未知角色";
};
</script>

<template>
  <!-- 未登录时显示登录页面 -->
  <LoginView v-if="!isAuthenticated" @login-success="handleLoginSuccess" />

  <!-- 已登录时显示主应用界面 -->
  <div v-else class="main-container">
    <v-layout>
      <v-navigation-drawer style="user-select: none;" v-model="section_opened" :permanent="mdAndUp"
        :temporary="!mdAndUp">
        <v-list>
          <v-list-item>
            <img src="/nuist-logo.png" style="width: 100%" />
            发电功率与电力负荷预测平台
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <!-- 用户信息 -->
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar color="primary" size="32">
                <v-icon>mdi-account</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ currentUser?.username }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ getRoleDisplayName(currentUser?.role)
            }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn v-if="currentUser?.role === 'administrator'" size="small" @click="router.push('/admin')"
                variant="text" icon class="mr-1">
                <v-tooltip activator="parent" text="管理员控制台"></v-tooltip>
                <v-icon size="20">mdi-shield-account</v-icon>
              </v-btn>
              <v-btn size="small" @click="handleLogout" variant="text" icon>
                <v-tooltip activator="parent" text="退出登录"></v-tooltip>
                <v-icon size="20">mdi-logout</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-container>
          <v-list color="primary" v-model:selected="section_selected">
            <v-tooltip text="模型概况和任务概况">
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
            <v-tooltip text="数据集信息展示、新增、编辑和删除">
              <template v-slot:activator="{ props }">
                <v-list-item title="数据集管理" value="datasets" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="material-symbols:database" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip text="任务管理、创建和监控">
              <template v-slot:activator="{ props }">
                <v-list-item title="任务管理" value="tasks" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="mdi-clipboard-list" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip text="模型信息展示和管理">
              <template v-slot:activator="{ props }">
                <v-list-item title="模型管理" value="models" rounded="xl" v-bind="props">
                  <template #prepend>
                    <v-icon>
                      <Icon icon="mdi-brain" />
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-container>
      </v-navigation-drawer>

      <v-main>
        <router-view v-slot="{ Component }">
          <transition name="fade">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </v-main>
    </v-layout>

    <v-fab-transition>
      <v-btn class="float-button" color="primary" fab @click="openDrawer" v-show="showFloatButton" icon>
        <v-icon>mdi-menu</v-icon>
      </v-btn>
    </v-fab-transition>
  </div>
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
