<template>
  <div ref="root" class="cu-codebox-wrapper">
    <div
      class="cu-codebox"
      :class="{
        'is-disabled': disabled,
        'is-justify': justify,
      }"
      @click="focus"
    >
      <template v-if="Number(maxlength) > 0">
        <span
          v-for="i in num"
          :key="i"
          :class="[
            'cu-codebox-box',
            i === code.length + 1 && focused && 'is-active',
            code.charAt(i - 1) !== '' && 'is-filled',
            isErrorStyle && 'is-error',
          ]"
        >
          <template v-if="code.charAt(i - 1)">
            <template v-if="mask"><i class="cu-codebox-dot"></i></template>
            <template v-else>{{ code.charAt(i - 1) }}</template>
          </template>
          <template v-if="i === code.length + 1 && focused">
            <i class="cu-codebox-blink"></i>
          </template>
        </span>
      </template>
      <template v-else>
        <input
          v-if="mask"
          type="password"
          :maxlength="maxlength"
          :value="code"
          readonly
          disabled
          :class="['cu-codebox-holder', focused && 'is-active']"
        />
        <input
          v-else
          :type="inputType"
          :maxlength="maxlength"
          :value="code"
          readonly
          disabled
          :class="['cu-codebox-holder', focused && 'is-active']"
        />
      </template>
    </div>
    <slot></slot>
    <form v-show="system" action="" @submit="onSubmit">
      <input
        ref="input"
        :value="code"
        :type="inputType"
        :maxlength="maxlength"
        class="cu-codebox-input"
        @input="onInputChange"
        @focus="nativeFocus"
        @blur="nativeBlur"
      />
    </form>
    <CuNumberKeyboard
      v-show="!system"
      ref="keyboard"
      class="cu-codebox-keyboard"
      :type="Number(maxlength) > 0 ? 'simple' : 'professional'"
      :ok-text="okText"
      :disorder="disorder"
      :is-view="isView"
      :model-value="focused"
      @update:model-value="(val) => (focused = val)"
      @delete="onDelete"
      @enter="onEnter"
      @confirm="onConfirm"
    ></CuNumberKeyboard>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import CuNumberKeyboard from '../number-keyboard/NumberKeyboard.vue'

defineOptions({ name: 'cu-codebox' })

const props = withDefaults(
  defineProps<{
    modelValue?: string
    maxlength?: number | string
    autofocus?: boolean
    disabled?: boolean
    justify?: boolean
    mask?: boolean
    closable?: boolean
    /** 使用系统键盘 */
    system?: boolean
    okText?: string
    disorder?: boolean
    isView?: boolean
    inputType?: string
    isErrorStyle?: boolean
  }>(),
  {
    modelValue: '',
    maxlength: 4,
    autofocus: false,
    disabled: false,
    justify: false,
    mask: false,
    closable: true,
    system: false,
    okText: undefined,
    disorder: false,
    isView: false,
    inputType: 'tel',
    isErrorStyle: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit', code: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const keyboard = ref<InstanceType<typeof CuNumberKeyboard>>()

const code = ref('')
const focused = ref(props.autofocus)

const num = computed(() => Math.abs(parseInt(String(props.maxlength), 10)) || 1)
const maxLengthNum = computed(() => Number(props.maxlength))

watch(
  () => props.modelValue,
  (val) => {
    if (val !== code.value) {
      code.value = val
    }
  },
  { immediate: true },
)

onMounted(() => {
  if (props.closable) {
    document.addEventListener('click', handleOutClick)
  }
  if (!props.system && !props.isView && keyboard.value?.$el) {
    document.body.appendChild(keyboard.value.$el)
  }
})

onBeforeUnmount(() => {
  if (props.closable) {
    document.removeEventListener('click', handleOutClick)
  }
  if (focused.value) {
    blur()
  }
  if (!props.system && !props.isView && keyboard.value?.$el && keyboard.value.$el.parentNode) {
    keyboard.value.$el.parentNode.removeChild(keyboard.value.$el)
  }
})

function handleOutClick(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    focused.value = false
  }
}

function onInputChange(e: Event) {
  const value = (e.target as HTMLInputElement).value
  if (maxLengthNum.value < 0 || value.length <= maxLengthNum.value) {
    code.value = value
  }

  if (code.value.length === maxLengthNum.value) {
    emit('submit', code.value)
  }

  emit('update:modelValue', code.value)
}

function onSubmit(e: Event) {
  e.preventDefault()
  emit('submit', code.value)
}

function onEnter(val: string | number) {
  if ((maxLengthNum.value < 0 || code.value.length < maxLengthNum.value) && val !== '.') {
    code.value += val
  }

  if (code.value.length === maxLengthNum.value) {
    nextTick(() => {
      emit('submit', code.value)
    })
  }

  emit('update:modelValue', code.value)
}

function onDelete() {
  code.value = code.value.slice(0, code.value.length - 1)
  emit('update:modelValue', code.value)
}

function onConfirm() {
  emit('submit', code.value)
}

function blur() {
  focused.value = false
  if (props.system) {
    input.value?.blur()
  }
}

function focus() {
  if (props.disabled) {
    return
  }

  focused.value = true
  if (props.system) {
    input.value?.focus()
  }
}

function nativeBlur() {
  emit('blur')
}

function nativeFocus() {
  emit('focus')
}

defineExpose({ focus, blur })
</script>
