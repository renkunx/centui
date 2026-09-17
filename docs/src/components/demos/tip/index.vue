<script setup lang="ts">
import { MdTip, MdButton } from 'mand-mobile'
import DemoCanvas from '../../DemoCanvas.vue'

const scenes = ['四个方向', '图标', '填充模式']
const code = `<MdTip placement="top" content="上方提示">
  <MdButton type="primary">上</MdButton>
</MdTip>`
</script>

<template>
  <DemoCanvas mode="stage" :scenes="scenes" :code="code">
    <template #scene-0>
      <div class="tip-area">
        <div class="tip-line">
          <MdTip placement="top" content="上方提示">
            <MdButton type="primary" round>上</MdButton>
          </MdTip>
          <MdTip placement="bottom" content="下方提示">
            <MdButton type="primary" round>下</MdButton>
          </MdTip>
        </div>
        <div class="tip-line">
          <MdTip placement="left" content="左侧提示">
            <MdButton type="primary" round>左</MdButton>
          </MdTip>
          <MdTip placement="right" content="右侧提示">
            <MdButton type="primary" round>右</MdButton>
          </MdTip>
        </div>
        <div class="tip-note">点击按钮触发气泡，可点击右上角关闭</div>
      </div>
    </template>
    <template #scene-1>
      <div class="tip-area">
        <MdTip icon="sound" content="投资有风险，入市需谨慎" />
        <MdTip icon="info-solid" content="该功能需要开启定位权限" placement="right">
          <MdButton type="warning" round>带图标的提示</MdButton>
        </MdTip>
      </div>
    </template>
    <template #scene-2>
      <div class="tip-area">
        <MdTip fill content="填充模式：气泡宽度与触发元素一致，适合表单校验提示" placement="bottom">
          <div class="fake-input">请输入正确的手机号</div>
        </MdTip>
      </div>
    </template>
  </DemoCanvas>
</template>

<style scoped>
.tip-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 28px;
  padding: 24px 14px;
}
.tip-line {
  display: flex;
  gap: 18px;
}
.tip-note {
  font-size: 12px;
  color: #999;
}
.fake-input {
  width: 240px;
  height: 40px;
  line-height: 40px;
  padding: 0 12px;
  font-size: 13px;
  color: #f5222d;
  border: 1px solid #f5222d;
  border-radius: 6px;
  background: #fff;
  box-sizing: border-box;
}
</style>