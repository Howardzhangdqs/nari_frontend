<template>
  <v-container fluid class="d-flex align-center justify-center" style="min-height: 70vh;">
    <v-card max-width="500" class="text-center pa-6">
      <v-icon color="primary" size="80" class="mb-4">mdi-lock</v-icon>
      <v-card-title class="text-h5 mb-2">需要登录</v-card-title>
      <v-card-text class="text-body-1 mb-4">
        请先登录以访问此功能。
      </v-card-text>
      <v-btn color="primary" @click="$emit('show-login')">
        返回登录
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
defineEmits<{
  "show-login": []
}>();
</script>