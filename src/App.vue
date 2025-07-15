<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref, watch } from "vue";
import router from "./router";

const page = location.hash.split("#")[1].split("/")[1];

console.log(page);

const section_selected = ref([page || "home"]);
let section_selected_past = section_selected.value[0];

watch(section_selected, () => {
  if (section_selected.value.length == 0) {
    section_selected.value = [section_selected_past];
  } else {
    section_selected_past = section_selected.value[0];
  }

  router.push({
    name: section_selected.value[0],
  });
});
</script>

<template>
  <v-container>
    <v-layout>
      <v-navigation-drawer style="user-select: none;">
        <v-list>
          <v-list-item>
            <img src="/nari-logo.png" style="width: 100%" />
            XXXX预测平台
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-container>
          <v-list color="primary" v-model:selected="section_selected">
            <v-list-item title="首页" value="home" rounded="xl">
              <template #prepend>
                <v-icon>
                  <Icon icon="line-md:home" />
                </v-icon>
              </template>
            </v-list-item>
            <v-list-item title="特征工程" value="feature" rounded="xl">
              <template #prepend>
                <v-icon>
                  <Icon icon="bx:wrench" />
                </v-icon>
              </template>
            </v-list-item>
            <v-list-item title="数据上传" value="data" rounded="xl">
              <template #prepend>
                <v-icon>
                  <Icon icon="majesticons:data-line" />
                </v-icon>
              </template>
            </v-list-item>
            <v-list-item title="模型训练" value="train" rounded="xl">
              <template #prepend>
                <v-icon>
                  <Icon icon="humbleicons:ai" />
                </v-icon>
              </template>
            </v-list-item>
            <v-list-item title="模型对比" value="compare" rounded="xl">
              <template #prepend>
                <v-icon>
                  <Icon icon="material-symbols:text-compare-rounded" />
                </v-icon>
              </template>
            </v-list-item>
            <v-list-item title="预测" value="predict" rounded="xl">
              <template #prepend>
                <v-icon>
                  <Icon icon="octicon:ai-model-16" />
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-container>
      </v-navigation-drawer>

      <v-main>
        <v-container>
          <router-view>
          </router-view>
        </v-container>
      </v-main>
    </v-layout>
  </v-container>
</template>

<style scoped></style>
