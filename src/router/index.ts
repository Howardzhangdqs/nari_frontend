import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/compare",
      name: "compare",
      component: () => import("../views/CompareView.vue"),
    },
    {
      path: "/feature",
      name: "feature",
      component: () => import("../views/FeatureView.vue"),
    },
    {
      path: "/data",
      name: "data",
      component: () => import("../views/DataView.vue"),
    },
    {
      path: "/train",
      name: "train",
      component: () => import("../views/TrainView.vue"),
    },
    {
      path: "/predict",
      name: "predict",
      component: () => import("../views/PredictView.vue"),
    },
  ],
});

export default router;
