/* legacy/components/dialog/demo 对译（生成器产物，TODO 见 wxml 尾注释） */
const {Dialog} = require('../../../../dist/components/dialog/index')
const {Toast} = require('../../../../dist/components/toast/index')
Page({
  data: {
  "basicDialog": {
    "open": false,
    "btns": [
      {
        "text": "取消"
      },
      {
        "text": "确认操作"
      }
    ]
  },
  "iconDialog": {
    "open": false,
    "btns": [
      {
        "text": "确认操作"
      }
    ]
  },
  "warnDialog": {
    "open": false,
    "btns": [
      {
        "text": "取消"
      },
      {
        "text": "警示操作",
        "warning": true
      }
    ]
  },
  "asyncDialog": {
    "open": false,
    "btns": [
      {
        "text": "开始搜索",
        "icon": "search"
      }
    ]
  },
  "actDialog": {
    "open": false,
    "btns": [
      {
        "text": "操作一",
        "type": "danger"
      },
      {
        "text": "操作二",
        "disabled": true
      },
      {
        "text": "操作三"
      }
    ]
  },
  "slotDialog": {
    "open": false,
    "btns": [
      {
        "text": "好的"
      }
    ]
  }
},
  onBasicConfirm() {
      Toast({
        content: '你点击了确认',
      })
      this.basicDialog.open = false
    },
  onBasicCancel() {
      Toast({
        content: '你点击了取消',
      })
      this.basicDialog.open = false
    },
  onIconConfirm() {
      Toast({
        content: '你点击了确认',
      })
      this.iconDialog.open = false
    },
  onActConfirm() {
      this.actDialog.open = false
    },
  onAsyncConfirm(btn) {
      this.$set(btn, 'loading', true)
      this.$set(btn, 'text', '搜索中')
      setTimeout(() => {
        this.asyncDialog.open = false
        this.$set(btn, 'loading', false)
        this.$set(btn, 'text', '开始搜索')
        Toast({
          content: '搜索成功',
        })
      }, 1500)
    },
  alert() {
      Dialog.alert({

        content: '您正在进行非法操作',
        cancelText: '取消',
        confirmText: '确定',
        onConfirm: () => console.log('[Dialog.alert] confirm clicked'),
      })
    },
  confirm() {
      Dialog.confirm({

        content: '请确认是否进行操作',
        confirmText: '确定',
        onConfirm: () => console.log('[Dialog.confirm] confirm clicked'),
      })
    },
  succeedConfirm() {
      Dialog.succeed({

        content: '恭喜您成功完成操作',
        confirmText: '确定',
        onConfirm: () => console.log('[Dialog.succeed] confirm clicked'),
      })
    },
  failedConfirm() {
      Dialog.failed({

        content: '操作失败，请稍后重试',
        confirmText: '确定',
        onConfirm: () => console.log('[Dialog.failed] confirm clicked'),
      })
    },
  noop() {},
})
