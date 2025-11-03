<template>
  <Pie :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PieController,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // 导入标签插件

// 注册 Chart.js 核心组件、插件
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PieController, // 注册 PieController
  ChartDataLabels // 注册标签插件
);

// 接收父组件传入的数据和配置
defineProps({
  chartData: {
    type: Object,
    required: true,
  },
});

// Chart.js 的配置项
const chartOptions = ({
  responsive: true,
  maintainAspectRatio: true, // 保持宽高比
  plugins: {
    // 禁用 Chart.js 自带的图例
    legend: {
      display: false,
    },
    // 配置 datalabels 插件
    datalabels: {
      // 格式化标签文本
      formatter: (value, context) => {
        // value 代表当前项目的数值
        // 使用context计算所有项目的总和数值
        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        const percentage = (value / total) * 100;

        // 如果百分比小于 5%，则不显示标签，避免拥挤
        if (percentage < 5) {
          return '';
        }
        return percentage.toFixed(2) + '%';
      },
      color: '#FFFFFF', // 标签文本颜色
      font: {
        weight: 'bold',
        size: 14,
      },
      // 在文本外层加一点描边，使其在任何背景色上都清晰
      textStrokeColor: 'rgba(0, 0, 0, 0.6)',
      textStrokeWidth: 2,
    },
    // 鼠标悬浮提示
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = context.raw || 0;

          // 计算总和
          const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
          const percentage = (value / total) * 100;

          // 组合结果，如："SSR: 50次 (10.00%)"
          return `${label}: ${value}次 (${percentage.toFixed(2)}%)`;
        }
      }
    }
  },
});
</script>
