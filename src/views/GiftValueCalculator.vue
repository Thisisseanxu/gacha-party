<template>
  <div class="background">
    <div class="calculator-container">
      <h2 class="title">我该不该氪？</h2>
      <p class="description">本计算器的基础比例以首充双倍为100%，即 1 rmb = 20 炫彩水晶</p>

      <div class="input-grid">
        <div class="input-group">
          <label for="price">礼包价格 (RMB)</label>
          <input id="price" type="number" v-model.number="price" placeholder="例如：100" />
        </div>
        <div class="input-group">
          <label for="premium-currency">炫彩水晶数量</label>
          <input
            id="premium-currency"
            type="number"
            v-model.number="premiumCurrency"
            placeholder="例如：1000"
          />
        </div>
        <div class="input-group">
          <label for="standard-currency">水晶数量</label>
          <input
            id="standard-currency"
            type="number"
            v-model.number="standardCurrency"
            placeholder="例如：1000"
          />
        </div>
        <div class="input-group">
          <label for="gacha-tokens">扭蛋数量</label>
          <input
            id="gacha-tokens"
            type="number"
            v-model.number="gachaTokens"
            placeholder="例如：20"
          />
        </div>
        <div class="input-group">
          <label for="token-value">扭蛋价值（水晶）</label>
          <input id="token-value" type="number" v-model.number="tokenValue" />
        </div>
        <div class="input-group">
          <label for="premium-rate">炫彩水晶价值多少个水晶</label>
          <input id="premium-rate" type="number" v-model.number="premiumToStandardRate" />
        </div>
      </div>

      <button @click="calculateValue" class="calculate-button">开始计算</button>

      <div v-if="result !== null" class="result-section">
        <p>计算完毕！</p>
        <div class="result-value">
          礼包价值为首充双倍的：<span>{{ result.toFixed(2) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// --- 输入绑定 ---
const price = ref(null)
const premiumCurrency = ref(null)
const standardCurrency = ref(null)
const gachaTokens = ref(null)
const tokenValue = ref(100)
const premiumToStandardRate = ref(1.2)

// --- 结果 ---
const result = ref(null)

// --- 计算逻辑 ---
const calculateValue = () => {
  if (!price.value || price.value <= 0) {
    alert('请输入有效的礼包价格！')
    result.value = null
    return
  }

  const premiumValueInStandard = (premiumCurrency.value || 0) * premiumToStandardRate.value
  const tokensValueInStandard = (gachaTokens.value || 0) * tokenValue.value
  const totalStandardCurrency =
    premiumValueInStandard + (standardCurrency.value || 0) + tokensValueInStandard

  const baseValue = price.value * 20 * premiumToStandardRate.value

  if (baseValue === 0) {
    result.value = 0
    return
  }

  result.value = (totalStandardCurrency / baseValue) * 100
}

</script>

<style scoped>
.background {
  padding: 2rem;
  min-height: 100vh;
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.calculator-container {
  background-color: var(--color-background-content);
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.title {
  font-size: 1.8rem;
  text-align: center;
  margin: 0;
}

.description {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  text-align: center;
  margin: 0;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 1rem;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: var(--color-brand-primary);
}

.calculate-button {
  padding: 1rem;
  border: none;
  border-radius: 8px;
  background-color: var(--color-brand-primary);
  color: #111;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calculate-button:hover {
  background-color: var(--color-brand-hover);
}

.result-section {
  margin-top: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border-primary);
  text-align: center;
}

.result-section p {
  font-size: 1.2rem;
  color: var(--color-text-secondary);
}

.result-value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-top: 0.5rem;
}

.result-value span {
  color: var(--color-text-highlight);
  font-size: 2.5rem;
  margin-left: 0.5rem;
}
</style>
