import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import CompareView from "../views/CompareView.vue";
import FeatureView from "../views/FeatureView.vue";
import DataView from "../views/DataView.vue";
import TrainView from "../views/TrainView.vue";
import MonitorView from "../views/MonitorView.vue";
import ModelManageView from "../views/ModelManageView.vue";
import PredictView from "../views/PredictView.vue";

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
      component: CompareView,
    },
    {
      path: "/feature",
      name: "feature",
      component: FeatureView,
    },
    {
      path: "/data",
      name: "data",
      component: DataView,
    },
    {
      path: "/train",
      name: "train",
      component: TrainView,
    },
    {
      path: "/monitor",
      name: "monitor",
      component: MonitorView,
    },
    {
      path: "/models",
      name: "models",
      component: ModelManageView,
    },
    {
      path: "/predict",
      name: "predict",
      component: PredictView,
    },
  ],
});

export default router;
