import type { EChartsType } from "echarts";
import router from "./router/index";
import { watch } from "vue";

const chart_list: EChartsType[] = [];


const registChart = (chart: EChartsType) => {
  chart_list.push(chart);

  // console.log("Chart registered:", chart);
};

const excuteResize = () => {

  chart_list.forEach((chart) => {
    if (chart && chart.resize) {
      chart.resize();
    }
  });
};

window.addEventListener("resize", excuteResize);

window.addEventListener("load", () => {


  watch(router.currentRoute, () => {
    console.log("Route changed, resizing charts...");
    setTimeout(excuteResize, 1000);
    excuteResize();
  });

  // setInterval(excuteResize, 1000);
});

export { registChart, excuteResize };
