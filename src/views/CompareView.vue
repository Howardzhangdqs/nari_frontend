<template>
  <div class="container">
    <header>
      <h1>Model Comparison</h1>
    </header>
    
    <section class="metrics-section">
      <h2>Performance Metrics</h2>
      <table class="metrics-table">
        <tr>
          <th>Model</th>
          <th>RMSE</th>
          <th>MAE</th>
          <th>R²</th>
        </tr>
        <tr v-for="metric in metrics" :key="metric.model">
          <td>{{ metric.model }}</td>
          <td>{{ metric.rmse }}</td>
          <td>{{ metric.mae }}</td>
          <td>{{ metric.r2 }}</td>
        </tr>
      </table>
    </section>
    
    <section class="visualizations-section">
      <h2>Visualizations</h2>
      <div class="chart-container">    
            <div ref="rmseChart" class="chart"></div>
        <div ref="maeR2Chart" class="chart"></div>
      </div>
    </section>
    
   
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'ModelComparison',
  setup() {
    const metrics = [
      {
        model: '线性回归',
        rmse: 0.62,
        mae: 0.78,
        r2: 0.85
      },
      {
        model: '决策树',
        rmse: 0.55,
        mae: 0.85,
        r2: 0.72
      },
      {
        model: '随机森林',
        rmse: 0.51,
        mae: 0.88,
        r2: 0.68
      },
      {
        model: 'LSTM',
        rmse: 0.48,
        mae: 0.90,
        r2: 0.65
      }
    ]
    
    return { metrics }
  },
  mounted() {
    this.initRMSEChart();
    this.initMAER2Chart();
  },
  methods: {
    initRMSEChart() {
      const rmseChart = echarts.init(this.$refs.rmseChart);
      const rmseOption = {
        title: {
          text: 'RMSE Comparison'
        },
        tooltip: {},
        xAxis: {
          data: this.metrics.map(metric => metric.model)
        },
        xAxis: {
          type: 'category',
          data: this.metrics.map(metric => metric.model),
          axisLabel: {
            length: 5,
            interval: 0,
            rotate: 0
          }
        },
        yAxis: {
          type: 'value',
          name: 'RMSE',
          min: 0,
          max: 1,
          interval: 0.1
        },
        series: [{
          name: 'RMSE',
          type: 'bar',
          data: this.metrics.map(metric => metric.rmse)
        }]
      };
      rmseChart.setOption(rmseOption);
    },
    initMAER2Chart() {
      const maeR2Chart = echarts.init(this.$refs.maeR2Chart);
      const maeR2Option = {
        title: {
          text: 'MAE vs. R²'
        },
        tooltip: {},
        xAxis: {
          data: ['MAE', 'R²']
        },
        yAxis: {},
        series: [{
          name: 'Values',
          type: 'bar',
          data: this.metrics.map(metric => [metric.mae, metric.r2])
        }]
      };
      maeR2Chart.setOption(maeR2Option);
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.metrics-section {
  margin-bottom: 30px;
}

.metrics-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.metrics-table th,
.metrics-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.metrics-table th {
  font-weight: 600;
  color: #666;
}

.visualizations-section {
  margin-bottom: 30px;
}

.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.chart {
  background-color: #fff;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  height: 500px;
  flex: 1;
  min-width: 200px;
}

.chart h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #444;
}
</style>
