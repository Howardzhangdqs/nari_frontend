<template>
  <v-stepper :items="['训练', 'Step 2', 'Step 3']">
    <template v-slot:[`item.1`]>
      <SectionOne />
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
import SectionOne from './TrainView/SectionOne.vue';
</script>
