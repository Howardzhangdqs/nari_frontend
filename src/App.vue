<script setup lang="ts">
import { ref, watch } from "vue";
import router from "./router";
import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import LoginView from "./components/LoginView.vue";
import { currentUser, isAuthenticated, login, logout } from "./stores/auth";

const getPageFromRoute = (route: RouteLocationNormalizedLoadedGeneric) => {
  return route.name || "home";
};

const section_selected = ref([getPageFromRoute(router.currentRoute.value)]);

// 监听路由变化，切换顶栏选中项
watch(
  () => router.currentRoute.value.name,
  (newName) => {
    if (newName && section_selected.value[0] !== newName) {
      section_selected.value = [newName];
    }
  }
);

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
      <!-- 顶栏导航 -->
      <v-app-bar style="user-select: none;" color="info">
        <template v-slot:prepend>
          <img src="/nuist-logo.png" style="height: 35px; margin: 0px 0px 0px 16px;" />
        </template>

        <v-app-bar-title>发电功率与电力负荷预测平台</v-app-bar-title>

        <!-- 导航菜单 -->
        <v-tabs v-model="section_selected[0]" align-tabs="center" color="white">
          <v-tab value="home" @click="router.push('/')">首页</v-tab>
          <v-tab value="datasets" @click="router.push('/datasets')">数据集管理</v-tab>
          <v-tab value="tasks" @click="router.push('/tasks')">任务管理</v-tab>
          <v-tab value="models" @click="router.push('/models')">模型管理</v-tab>
          <v-tab value="admin" @click="router.push('/admin')"
            v-if="currentUser?.role === 'administrator'">管理员控制台</v-tab>
        </v-tabs>

        <template v-slot:append>

          <!-- 用户信息 -->
          <div class="d-flex align-center mx-4">
            <v-avatar color="white" size="32" class="mr-2">
              <v-icon color="primary">mdi-account</v-icon>
            </v-avatar>
            <div class="text-white">
              <div class="text-body-2">{{ currentUser?.username }}</div>
              <div class="text-caption">{{ getRoleDisplayName(currentUser?.role) }}</div>
            </div>
          </div>

          <v-btn @click="handleLogout" variant="text" color="white">
            <v-icon>mdi-logout</v-icon>
            退出
          </v-btn>
        </template>
      </v-app-bar>

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
  </div>
</template>
<style scoped>
.main-container {
  position: relative;
}

:deep(.v-app-bar.primary) {
  background-color: rgb(4, 151, 216) !important;
}
</style>
