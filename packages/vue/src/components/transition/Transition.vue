<template>
  <Transition><slot /></Transition>
</template>

<script setup lang="ts">
// v2 为 functional h('transition') 透传；Vue3 转发内置 Transition，
// name 等 transition 属性经 attrs 透传（单根继承）
defineOptions({ name: 'cu-transition', inheritAttrs: false })
</script>
