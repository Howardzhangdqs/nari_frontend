<template>
  <v-container>
    <v-row>
      <v-col cols="12" sm="12">
        <v-card title="国电南瑞科技股份有限公司" subtitle="XXXX训练与预测平台">
          <v-card-text class="bg-surface-light pt-4">
            这里是简介。Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ratione debitis quis est labore
            voluptatibus!
            Eaque
            cupiditate minima, at placeat totam, magni doloremque veniam neque porro libero rerum unde voluptatem!
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="12">
        <div style="display: flex; flex-direction: column; align-items: stretch;">
          <div class="text-h6 mb-1" style="line-height: 20px">服务状态</div>
          <hr />
        </div>
      </v-col>
    </v-row>
    <v-row>

      <v-col cols="12" sm="4">
        <v-card title="训练中">
          <v-card-text class="bg-surface-light pt-4">
            XGBoost、LightGBM、AdaBoost 等 4 个模型正在训练。
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="12">
        <div style="display: flex; flex-direction: column; align-items: stretch;">
          <div class="text-h6 mb-1" style="line-height: 20px">训练摘要</div>
          <hr />
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" sm="4">
        <TrainSummary model="XGBoost" :time="52" :accuracy="0.712389" dataset="CIFAR-10" :progress="54" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="LightGBM" :time="27" :accuracy="0.712389" dataset="CIFAR-10" :progress="78" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="ResMTN" :time="153" :accuracy="0.712389" dataset="CIFAR-10" :progress="42" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="AdaBoost" :time="31" :accuracy="0.712389" dataset="CIFAR-10" :progress="12" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="Transformer" :time="12807" :accuracy="0.9123412" dataset="CIFAR-10" :finished="true" />
      </v-col>

      <v-col cols="12" sm="4">
        <TrainSummary model="MLP" :time="12" :accuracy="0.5412" dataset="CIFAR-10" :finished="true" />
      </v-col>

    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
import TrainSummary from '../components/TrainSummary.vue';
</script>
