import { ref } from "vue";

// 用户状态管理
export interface User {
  username: string;
  role: "administrator" | "user" | "researcher";
  loginTime: Date;
}

// 全局用户状态
const currentUser = ref<User | null>(null);
const isAuthenticated = ref(false);

// 登录状态持久化
const STORAGE_KEY = "nari_user_session";

// 检查登录状态
const checkAuthStatus = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const userData = JSON.parse(stored);
      // 检查会话是否过期（24小时）
      const loginTime = new Date(userData.loginTime);
      const now = new Date();
      const diffHours = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        currentUser.value = userData;
        isAuthenticated.value = true;
        return true;
      } else {
        // 会话过期，清除存储
        logout();
      }
    } catch (error) {
      console.error("解析用户数据失败:", error);
      logout();
    }
  }
  return false;
};

// 登录
const login = (user: Omit<User, "loginTime">) => {
  console.log("Auth store login called with:", user); // 调试日志
  
  const userWithTime: User = {
    ...user,
    loginTime: new Date()
  };
  
  currentUser.value = userWithTime;
  isAuthenticated.value = true;
  
  console.log("User logged in, isAuthenticated:", isAuthenticated.value); // 调试日志
  
  // 保存到localStorage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userWithTime));
};

// 登出
const logout = () => {
  currentUser.value = null;
  isAuthenticated.value = false;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("rememberedUser"); // 也清除记住用户的信息
};

// 获取用户角色权限
const getUserPermissions = () => {
  if (!currentUser.value) return [];
  
  const rolePermissions = {
    administrator: ["read", "write", "delete", "manage_users", "export_models", "train_models"],
    researcher: ["read", "write", "export_models", "train_models"],
    user: ["read", "train_models"]
  };
  
  return rolePermissions[currentUser.value.role] || [];
};

// 检查是否有特定权限
const hasPermission = (permission: string) => {
  return getUserPermissions().includes(permission);
};

// 初始化时检查登录状态
checkAuthStatus();

export {
  currentUser,
  isAuthenticated,
  login,
  logout,
  checkAuthStatus,
  getUserPermissions,
  hasPermission
};