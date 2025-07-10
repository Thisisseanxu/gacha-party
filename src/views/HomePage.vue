<template>
  <div class="home-container">
    <h1 class="title">织夜工具箱</h1>

    <div class="button-group">
      <router-link to="chouka" class="btn chouka-btn">
        <span>✨ 抽卡模拟器 ✨</span>
      </router-link>

      <router-link to="fenxi " class="btn analysis-btn">
        <span>📊 抽卡数据分析 📈</span>
      </router-link>
    </div>

    <div class="info-footer">
      <a href="https://github.com/Thisiseanxu/gacha-party" target="_blank" class="footer-link">
        <span>🌌 开源地址</span>
        <span class="icon">🔗</span>
      </a>

      <a href="https://qm.qq.com/cgi-bin/qm/qr?k=PD3VWuDfxO_hAVZQBreK1CjvWORTkNN2&jump_from=webapi&authKey=c4Sos3R4opf3VqerCwpPX+IOmwZUDm4hqkyT7qDGhta2fAhdUETlxFZ9wDrcRu1z"
        target="_blank" class="footer-link">
        <span>💬 加入Q群</span>
        <span class="icon">👥</span>
      </a>
    </div>
  </div>
</template>

<script setup>
// 可添加动画逻辑
</script>

<style scoped>
.home-container {
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #6a4ba8 0%, #8e5bef 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10px 30px rgba(106, 75, 168, 0.15);
  font-family: 'Poppins', sans-serif;
  color: #e0d4ff;
}

.title {
  font-size: 3rem;
  background: linear-gradient(45deg, #4c3b71, #5d3aa4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 4px rgba(106, 75, 168, 0.2);
  margin-bottom: 2rem;
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
  padding: 0 2rem;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.2rem 2.5rem;
  border-radius: 25px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
  background: linear-gradient(145deg, #9f7aea, #7d56d9);
  color: #fff;
  box-shadow: 0 4px 15px rgba(159, 122, 234, 0.3);
}

.chouka-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 20px rgba(159, 122, 234, 0.25);
}

.analysis-btn {
  box-shadow: 0 4px 15px rgba(125, 86, 217, 0.3);
}

.btn:hover {
  transform: translateY(-3px) scale(1.02);
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent);
  transition: 0.5s;
}

.btn:hover::before {
  left: 100%;
}

.icon {
  margin-left: 1rem;
  font-size: 1.5rem;
  transition: transform 0.3s ease;
  color: #ffd600;
}

.btn:hover .icon {
  transform: translateX(5px);
}

.info-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 2rem;
  margin: 2rem 0;
  padding: 1rem;
  background: rgba(106, 75, 168, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 15px;
  width: 100%;
  max-width: 600px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #e0d4ff;
  text-decoration: none;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.footer-link:hover {
  color: #ffd600;
  transform: translateY(-3px);
}
</style>
