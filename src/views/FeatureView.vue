<template>
  <v-stepper :items="['特征工程', 'Step 2', 'Step 3']">
    <template v-slot:[`item.1`]>
    </template>

    <template v-slot:[`item.2`]>
      <v-card title="Step Two" flat>...</v-card>
    </template>

    <template v-slot:[`item.3`]>
      <v-card title="Step Three" flat>...</v-card>
    </template>
  </v-stepper>
</template>

<script lang="ts" setup>
</script>
