<template>
  <article class="tendency-profile" :class="`tone-${tone}`">
    <h3>{{ title }}</h3>
    <div class="axis-list">
      <div v-for="axis in axes" :key="axis.key" class="axis-row">
        <div class="axis-labels">
          <span>{{ axis.negative }}</span>
          <strong>{{ formatScore(scores[axis.key]) }}</strong>
          <span>{{ axis.positive }}</span>
        </div>
        <div class="axis-track">
          <span
            class="axis-fill"
            :class="{ negative: Number(scores[axis.key]) < 0 }"
            :style="fillStyle(scores[axis.key], axis)"
          ></span>
          <span class="axis-center"></span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { tendencyPosition } from '@/utils/personalityMatch.js'
import { themeVar } from '@/utils/themeColor.js'

defineProps({
  title: { type: String, required: true },
  scores: { type: Object, required: true },
  axes: { type: Array, required: true },
  tone: { type: String, default: 'player' },
})

function formatScore(value) {
  const number = Math.round(Number(value) || 0)
  return number > 0 ? `+${number}` : String(number)
}

function fillStyle(value, axis) {
  const position = tendencyPosition(value)
  const dimensions =
    Number(value) < 0
      ? { left: `${position}%`, width: `${50 - position}%` }
      : { left: '50%', width: `${position - 50}%` }

  return {
    ...dimensions,
    backgroundColor: themeVar(`personality.${axis.id}`, themeVar('brand.primary')),
  }
}
</script>

<style scoped>
.tendency-profile {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--color-border-primary);
  border-radius: 16px;
  background: var(--color-background-light);
}

h3 {
  margin: 0 0 20px;
  font-size: 1rem;
}

.axis-list {
  display: grid;
  gap: 20px;
}

.axis-labels {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
}

.axis-labels span:first-child {
  text-align: left;
}

.axis-labels span:last-child {
  text-align: right;
}

.axis-labels strong {
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.axis-track {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: var(--color-background-lighter);
}

.axis-center {
  position: absolute;
  top: -3px;
  bottom: -3px;
  left: 50%;
  width: 1px;
  background: var(--color-text-tertiary);
}

.axis-fill {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: 0 999px 999px 0;
}

.axis-fill.negative {
  border-radius: 999px 0 0 999px;
  opacity: 0.72;
}
</style>
