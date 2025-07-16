<template>
  <div class="container">
    <header>
      <h1>Prediction Results</h1>
    </header>
    
    <section class="time-series-section">
      <h2>Prediction vs. Actual</h2>
      <div class="time-series-comparison">
        <div ref="timeSeriesChart" class="chart"></div>
      </div>
    </section>
    
    <section class="error-analysis-section">
      <h2>Error Analysis</h2>
      <div class="error-metrics">
        <div>
          <label>Mean Error</label>
          <div class="value">0.05</div>
        </div>
        <div>
          <label>Max Error</label>
          <div class="value">0.20</div>
        </div>
        <div>
          <label>MAPE</label>
          <div class="value">5.0%</div>
        </div>
      </div>
      <button @click="exportResults">Export Prediction Results</button>
    </section>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'PredictionResults',
  mounted() {
    this.initTimeSeriesChart();
  },
  methods: {
    initTimeSeriesChart() {
      const chart = echarts.init(this.$refs.timeSeriesChart);
      const option = {
        title: {
          text: 'Time Series Comparison',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['Jan', 'Feb', 'Mar', 'Apr']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Prediction',
            type: 'line',
            data: [1, 2, 3, 4],
            smooth: true
          },
          {
            name: 'Actual',
            type: 'line',
            data: [2, 1, 4, 3],
            smooth: true
          }
        ]
      };
      chart.setOption(option);
    },
    exportResults() {
      alert('Export Prediction Results');
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1, h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.time-series-section {
  margin-bottom: 40px;
}

.time-series-comparison {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 4px;
}

.chart {
  width: 100%;
  height: 300px;
}

.error-analysis-section {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 4px;
}

.error-metrics {
  margin-bottom: 20px;
}

.error-metrics div {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  background-color: #4dc8ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #40b0e0;
}
</style>
