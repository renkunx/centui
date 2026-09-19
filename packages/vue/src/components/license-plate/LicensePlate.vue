<template>
  <div class="md-license-plate">
    <!-- 分离模式 -->
    <div v-if="modeShow === 'division'">
      <div class="md-license-plate-input-container division">
        <MdLicensePlateInput :key-array="keyArray" :selected-index="selectedIndex" @key-mapping="keyMapping" />
      </div>
      <div v-if="showDivisionKeyboard" class="md-license-plate-keyboard-container division">
        <MdLicensePlateKeyboard :keyboard="dyKeyboard" @enter="onEnter" @delete="onDelete" @confirm="onConfirm" />
      </div>
    </div>
    <!-- 弹窗模式 -->
    <div v-if="modeShow === 'popUp'">
      <MdPopup :model-value="showPopUp" :has-mask="true" position="bottom" :mask-closable="false">
        <MdPopupTitleBar
          only-close
          large-radius
          :title="title"
          :describe="subtitle"
          title-align="left"
          @cancel="$emit('hide')"
        ></MdPopupTitleBar>
        <div class="md-popup-content">
          <div class="md-license-plate-input-container popUp">
            <MdLicensePlateInput :key-array="keyArray" :selected-index="selectedIndex" @key-mapping="keyMapping" />
          </div>
          <div class="md-license-plate-keyboard-container popUp">
            <MdLicensePlateKeyboard :keyboard="dyKeyboard" @enter="onEnter" @delete="onDelete" @confirm="onConfirm" />
          </div>
        </div>
      </MdPopup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import MdPopup from '../popup/Popup.vue'
import MdPopupTitleBar from '../popup/PopupTitleBar.vue'
import MdLicensePlateInput from './LicensePlateInput.vue'
import MdLicensePlateKeyboard, { type LicenseKeyItem } from './LicensePlateKeyboard.vue'

defineOptions({ name: 'md-license-plate' })

const props = withDefaults(
  defineProps<{
    /** 省份简写 */
    shortcuts?: string[]
    modeShow?: 'division' | 'popUp'
    showPopUp?: boolean
    title?: string
    subtitle?: string
    defaultValue?: string
    /** 顺序填写时不可乱序点击 */
    disorderClick?: boolean
  }>(),
  {
    shortcuts: () => [
      '京', '津', '渝', '沪', '冀', '晋', '辽', '吉', '黑', '苏',
      '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘', '粤', '琼',
      '川', '贵', '云', '陕', '甘', '青', '蒙', '桂', '宁', '新', '藏',
    ],
    modeShow: 'division',
    showPopUp: false,
    title: '请输入车牌号码',
    subtitle: '',
    defaultValue: '',
    disorderClick: true,
  },
)

const emit = defineEmits<{
  (e: 'confirm', value: string): void
  (e: 'hide'): void
  (e: 'sd-keyboard', id: string): void
  (e: 'hd-keyboard', value: string): void
}>()

// 字母键盘数据（I/O 不可用）
const letterData: LicenseKeyItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => ({
  value: letter,
  disabled: letter === 'I' || letter === 'O',
}))

const numbers: LicenseKeyItem[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(value => ({
  value,
  disabled: false,
}))

const keyArray = ref<string[]>(['', '', '', '', '', '', '', ''])
const selectedIndex = ref(0)
const showDivisionKeyboard = ref(false)

const dyKeyboard = computed(() => {
  let mixedKeyboard: LicenseKeyItem[] = []
  let keyboardType: number

  // 省市键盘（第一位）
  if (selectedIndex.value === 0) {
    keyboardType = 1
  } else {
    keyboardType = 2

    // 拼接功能键
    const letters = JSON.parse(JSON.stringify(letterData)) as LicenseKeyItem[]
    // 删除键
    letters.splice(19, 0, { type: 'delete', disabled: false })
    // 确定键
    letters.push({ type: 'confirm', text: '确定', disabled: false })

    // 数字键（第二位禁用数字）
    let nums = numbers
    if (selectedIndex.value === 1) {
      nums = numbers.map(item => ({ value: item.value, disabled: true }))
    }

    mixedKeyboard = nums.concat(letters)
  }

  return {
    shortcuts: props.shortcuts,
    mixedKeyboard,
    keyboardType,
  }
})

const keyArrayCopy = computed(() =>
  keyArray.value.map(item => (item ? item : ' ')),
)

watch(
  () => props.defaultValue,
  newVal => {
    if (newVal !== '') {
      const defaultValueArray = newVal.split('')
      const copy = JSON.parse(JSON.stringify(keyArray.value)) as string[]
      copy.forEach((_, index) => {
        copy[index] = defaultValueArray[index] ?? ''
      })
      keyArray.value = copy
    }
  },
  { immediate: true },
)

function keyMapping(index: number) {
  if (!showDivisionKeyboard.value) {
    showDivisionKeyboard.value = true
  }
  // 顺序填写，不可无序点击
  if (!props.disorderClick && !keyArray.value[index + 1] && !keyArray.value[index - 1] && index > 0) {
    return
  }
  selectedIndex.value = index
}

function onEnter(value: string | number | undefined) {
  keyArray.value[selectedIndex.value] = String(value ?? '')

  // 最后一个键位：隐藏键盘并确认
  if (selectedIndex.value === keyArray.value.length - 1) {
    onConfirm()
  } else {
    selectedIndex.value = selectedIndex.value + 1
  }
}

function onDelete() {
  keyArray.value[selectedIndex.value] = ''

  if (selectedIndex.value <= 0) {
    if (props.modeShow === 'division') {
      showDivisionKeyboard.value = false
    }
  } else {
    selectedIndex.value = selectedIndex.value - 1
  }
}

function onConfirm() {
  if (props.modeShow === 'division') {
    showDivisionKeyboard.value = false
  }
  emit('confirm', keyArrayCopy.value.join(''))
}
</script>
