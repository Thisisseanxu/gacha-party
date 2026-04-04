<script setup>
import { onMounted, onUnmounted } from 'vue'
import { hideFloatingButton, showFloatingButton } from '@/utils/floatingButtonState.js'

onMounted(() => {
  hideFloatingButton()
})

onUnmounted(() => {
  showFloatingButton()
})
</script>
