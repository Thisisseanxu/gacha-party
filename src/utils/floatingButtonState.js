import { ref, computed } from 'vue'

const hiddenCount = ref(0)

export const hideFloatingButton = () => {
  hiddenCount.value++
}

export const showFloatingButton = () => {
  if (hiddenCount.value > 0) {
    hiddenCount.value--
  }
}

export const isFloatingButtonHidden = computed(() => hiddenCount.value > 0)
