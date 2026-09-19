<template>
  <div class="md-result">
    <div class="md-result-image">
      <img :src="actualImgUrl" :class="!imgUrl && type" />
    </div>
    <div v-if="actualText" class="md-result-text">{{ actualText }}</div>
    <div v-if="actualSubText" class="md-result-subtext">{{ actualSubText }}</div>
    <div v-if="buttons.length" class="md-result-buttons">
      <MdButton
        v-for="(button, index) of buttons"
        :key="index"
        :type="button.type"
        :plain="button.plain === undefined || button.plain"
        :round="button.round"
        :inactive="button.inactive"
        :loading="button.loading"
        :icon="button.icon"
        :icon-svg="button.iconSvg"
        size="small"
        inline
        @click="button.handler?.()"
      >
        {{ button.text }}
      </MdButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@mand-mobile/core'
import MdButton from '../button/Button.vue'

defineOptions({ name: 'md-result-page' })

export interface ResultPageButton {
  text?: string
  type?: string
  plain?: boolean
  round?: boolean
  inactive?: boolean
  loading?: boolean
  icon?: string
  iconSvg?: boolean
  handler?: () => void
}

const props = withDefaults(
  defineProps<{
    /** empty | network | lost 等内置类型（决定默认图与默认文案） */
    type?: string
    imgUrl?: string
    text?: string
    subtext?: string
    buttons?: ResultPageButton[]
  }>(),
  { type: 'empty', imgUrl: '', text: '', subtext: '', buttons: () => [] },
)

const actualImgUrl = computed(() => {
  const pre = '//manhattan.didistatic.com/static/manhattan/mand-mobile/result-page/2.1/'
  return props.imgUrl || `${pre}${props.type}.png`
})

const actualText = computed(
  () =>
    props.text ||
    {
      // 网络连接异常
      network: t('md.result_page.networkError'),
      // 暂无信息
      empty: t('md.result_page.noInformation'),
    }[props.type as 'network' | 'empty'] ||
    '',
)

const actualSubText = computed(
  () =>
    props.subtext ||
    {
      // 您要访问的页面已丢失
      lost: t('md.result_page.lostWay'),
    }[props.type as 'lost'] ||
    '',
)
</script>
