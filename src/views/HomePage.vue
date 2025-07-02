
<template>
  <div class="home-container">
    <h1>欢迎来到抽卡模拟器</h1>
    
    <div class="button-group">
      <router-link to="/chouka" class="btn">抽卡模拟器</router-link>
 <!--     <router-link to="/analysis" class="btn">抽卡数据分析</router-link> -->
    </div>

    <div class="info-footer">
      <a href="https://github.com/your-repo" target="_blank">开源地址</a>
      <a href="https://qm.qq.com/group/your-group" target="_blank">交流QQ群</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewHomePage'
}
</script>

<style scoped>
/* 全局样式示例 */
.btn {
  display: inline-block;
  padding: 8px 16px;
  margin: 4px;
  border-radius: 4px;
  text-decoration: none;
  color: #fff;
}

.btn:first-child {
  background-color: #4CAF50; /* 模拟器绿色 */
}

.btn:last-child {
  background-color: #2196F3; /* 分析蓝色 */
}
</style>