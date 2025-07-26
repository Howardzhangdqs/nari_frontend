<template>
  <v-container fluid class="login-container">
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card class="elevation-8 pa-6">
          <v-card-title class="text-center mb-6">
            <div class="text-h4 font-weight-bold text-primary">
              发电功率与电力负荷预测平台
            </div>
            <div class="text-subtitle-1 text-medium-emphasis mt-2">
              南京信息工程大学
            </div>
          </v-card-title>

          <v-form ref="loginFormRef">
            <v-text-field v-model="loginForm.username" label="用户名" prepend-inner-icon="mdi-account" variant="outlined"
              :rules="[v => !!v || '请输入用户名']" class="mb-4" autofocus></v-text-field>

            <v-text-field v-model="loginForm.password" label="密码" prepend-inner-icon="mdi-lock"
              :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
              @click:append-inner="showPassword = !showPassword" variant="outlined" :rules="[v => !!v || '请输入密码']"
              class="mb-4" @keyup.enter="handleLogin"></v-text-field>

            <v-checkbox v-model="rememberMe" label="记住我" color="primary" class="mb-4"></v-checkbox>

            <v-btn color="primary" size="large" block :loading="isLoading" class="mb-4" @click="handleLogin">
              登录
            </v-btn>
          </v-form>

          <v-divider class="my-4"></v-divider>

          <div class="text-center">
            <v-btn variant="text" color="primary" size="small" @click="showForgotPassword = true">
              忘记密码？
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 忘记密码对话框 -->
    <v-dialog v-model="showForgotPassword" max-width="400">
      <v-card>
        <v-card-title class="text-h6">重置密码</v-card-title>
        <v-card-text>
          <v-text-field v-model="resetEmail" label="邮箱地址" prepend-inner-icon="mdi-email" variant="outlined"
            :rules="[v => !!v || '请输入邮箱地址', v => /.+@.+\..+/.test(v) || '请输入有效的邮箱地址']"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showForgotPassword = false">取消</v-btn>
          <v-btn color="primary" @click="handleResetPassword" :loading="isResetting">
            发送重置链接
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 登录失败提示 -->
    <v-snackbar v-model="showError" color="error" timeout="3000" location="top">
      {{ errorMessage }}
    </v-snackbar>

    <!-- 成功提示 -->
    <v-snackbar v-model="showSuccess" color="success" timeout="3000" location="top">
      {{ successMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";

// 表单数据
const loginForm = ref({
  username: "",
  password: ""
});

const resetEmail = ref("");
const showPassword = ref(false);
const rememberMe = ref(false);
const isLoading = ref(false);
const isResetting = ref(false);
const showForgotPassword = ref(false);
const showError = ref(false);
const showSuccess = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// 表单引用
const loginFormRef = ref();

// 发送登录成功事件
const emit = defineEmits<{
  loginSuccess: [user: { username: string; role: string }]
}>();

// 处理登录
const handleLogin = async () => {
  console.log("Login button clicked"); // 调试日志
  console.log("Form data:", loginForm.value); // 调试日志

  // 检查表单引用是否存在，如果不存在则跳过验证
  let isValid = true;
  if (loginFormRef.value) {
    const { valid } = await loginFormRef.value.validate();
    isValid = valid;
    console.log("Form validation result:", valid); // 调试日志
  }

  // 如果表单无效且有表单引用，则返回
  if (!isValid && loginFormRef.value) {
    console.log("Form validation failed, returning"); // 调试日志
    return;
  }

  console.log("Starting login process"); // 调试日志
  isLoading.value = true;

  try {
    // 模拟登录请求
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 简单的用户验证逻辑
    const validUsers = [
      { username: "admin", password: "admin123", role: "administrator" },
      { username: "user", password: "user123", role: "user" },
      { username: "researcher", password: "research123", role: "researcher" }
    ];

    const user = validUsers.find(u =>
      u.username === loginForm.value.username &&
      u.password === loginForm.value.password
    );

    console.log("User found:", user); // 调试日志

    if (user) {
      successMessage.value = `欢迎回来，${user.username}！`;
      showSuccess.value = true;

      // 如果选择记住我，存储到localStorage
      if (rememberMe.value) {
        localStorage.setItem("rememberedUser", user.username);
      }

      // 延迟一下再发送登录成功事件
      setTimeout(() => {
        console.log("Emitting login success event:", user); // 调试日志
        emit("loginSuccess", { username: user.username, role: user.role });
      }, 1000);
    } else {
      errorMessage.value = "用户名或密码错误";
      showError.value = true;
    }
  } catch (error) {
    console.error("Login error:", error); // 调试日志
    errorMessage.value = "登录失败，请稍后重试";
    showError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// 处理密码重置
const handleResetPassword = async () => {
  if (!resetEmail.value || !/.+@.+\..+/.test(resetEmail.value)) {
    errorMessage.value = "请输入有效的邮箱地址";
    showError.value = true;
    return;
  }

  isResetting.value = true;

  try {
    // 模拟发送重置邮件
    await new Promise(resolve => setTimeout(resolve, 2000));

    successMessage.value = "密码重置链接已发送到您的邮箱";
    showSuccess.value = true;
    showForgotPassword.value = false;
    resetEmail.value = "";
  } catch (error) {
    errorMessage.value = "发送失败，请稍后重试";
    showError.value = true;
  } finally {
    isResetting.value = false;
  }
};

// 组件挂载时检查是否有记住的用户
import { onMounted } from "vue";
onMounted(() => {
  const rememberedUser = localStorage.getItem("rememberedUser");
  if (rememberedUser) {
    loginForm.value.username = rememberedUser;
    rememberMe.value = true;
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  display: flex;
  align-items: center;
  justify-content: center;
}

.v-card {
  border-radius: 16px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.fill-height {
  min-height: 100vh;
}
</style>
