# A+ 向导 (aplus-wizard) 功能优化分析报告

基于对 `APlusWizardView.vue`、`APlusInputForm.vue`、`aplus` store 及 `aplus.service.ts` 的完整阅读，以下是可优化点汇总。

---

## 一、代码质量

### 1. 未使用的函数 `styleVariant`

**位置**: `APlusWizardView.vue` 第 660-666 行

**问题**: `styleVariant` 已定义但未被任何地方调用，属于死代码。

```ts
function styleVariant(template: typeof templateId.value, variantName: string, extra: string): string {
  const base = editablePrompt.value?.trim() || ...
  return base + `\n\n【风格变体：${variantName}】\n${extra}\n`
}
```

**建议**: 删除该函数；若未来需要风格变体功能，再补充完整实现与调用。

---

### 2. `watch` 依赖写法可简化

**位置**: `APlusWizardView.vue` 第 482-500 行

**问题**: `buildAnalysisFingerprint()` 在 `watch` 依赖数组中被直接调用，每次都会重新执行。更合理的做法是使用 `computed` 或显式依赖。

```ts
// 当前写法
watch(
  () => [step.value, templateId.value, moduleCount.value, buildAnalysisFingerprint()] as const,
  ...
)
```

**建议**: 将指纹计算提取为 `computed`，并依赖该 computed：

```ts
const currentAnalysisFingerprint = computed(() => buildAnalysisFingerprint())

watch(
  () => [step.value, currentAnalysisFingerprint.value] as const,
  ([newStep, fp]) => { ... }
)
```

---

### 3. `APlusInputForm` 缺少 `modelValue` 型 `v-model`

**位置**: `APlusInputForm.vue`

**问题**: 对 `aspectRatio`、`qualityTier` 使用 `v-model:aspect-ratio` / `v-model:quality-tier`，但 `defineProps` 未标记 `required`，且父组件用 `ref` 而非显式绑定。

**建议**: 确认是否需要默认值；若组件可独立使用，可保持当前可选 props。

---

## 二、UX/可用性

### 4. Step 1 与 Step 2 的「必填」提示不够具体

**位置**: Step 1 下一步时 `handleStep1Next`；Step 2 分析时 `runAnalysis` 的 `message.warning`。

**现状**: 已有 `step1Missing`，但文案较为通用。

**建议**: 使用 `step1Missing` 明确提示缺少项，例如：`请先补全：${step1Missing.value.join('、')}`，并保持与 `handleStep1Next` 中的逻辑一致。

---

### 5. Step 2 模板选项缺少说明

**位置**: `APlusWizardView.vue` 第 51-57 行

**现状**: 模板选项仅有 value，无 label：

```html
<option value="default">默认</option>
<option value="brand_story_first">品牌故事优先</option>
...
```

**建议**: 添加简短说明，帮助用户理解差异，例如：

```html
<option value="brand_story_first">品牌故事优先：先讲品牌与信任，再讲功能</option>
```

---

### 6. 分析/生成过程缺少取消

**现状**: `runAnalysis`、`runGenerate` 一旦开始无法中途取消。

**建议**: 对长时间操作增加「取消」按钮，并在 service 层支持 AbortController，以便中断请求。

---

### 7. 图片上传的 Blob URL 未释放

**位置**: `APlusInputForm.vue` 第 248-254 行

**问题**: `URL.createObjectURL(files[i])` 创建的 Blob URL 在移除图片或重置表单时未调用 `URL.revokeObjectURL()`，可能造成内存泄漏。

**建议**: 在移除图片或清空表单时调用 `URL.revokeObjectURL(url)`。

---

## 三、逻辑与边界

### 8. Step 2 中 `moduleCount` 与 `visualPlan.modules` 不同步

**位置**: Step 2 模块规划编辑区

**问题**: 用户可手动新增/删除模块，使 `aplus.visualPlan.modules.length` 与 `moduleCount` 不一致，但生成时以 `moduleCount` 为准，可能导致规划与生成不匹配。

**建议**: 在 `handleStep2Next` 或进入 Step 3 时，调用 `aplus.resizeVisualPlanModules(moduleCount.value)`，保证模块数与 `moduleCount` 一致；或改为以 `visualPlan.modules.length` 为真实模块数，并同步更新 `moduleCount`。

---

### 9. 从 Listing 入口时的数据覆盖

**位置**: `onMounted` 第 588-621 行

**问题**: `from=listing` 时调用 `aplus.resetWizardInput({ market, language })` 会清空商品信息，随后 `prefillWizardInput` 再回填。若用户曾在当前会话中编辑过 wizard 表单，可能被意外覆盖。

**建议**: 在 `resetWizardInput` 前增加一次确认，或仅在「从未编辑过」的情况下重置，避免误覆盖用户输入。

---

## 四、性能

### 10. `wizardInput` 每次变更都写入 localStorage

**位置**: `aplus` store 的 `updateWizardInput`、`touchWizardField`

**问题**: 输入时每次按键都会触发 `saveWizardInput`，频繁写入 localStorage 可能影响性能。

**建议**: 使用防抖（如 500ms）延迟保存，或仅在失焦、切换步骤时保存。

---

### 11. Step 3 图片列表未做虚拟滚动

**位置**: `APlusWizardView.vue` 的 `gallery-grid`

**现状**: 模块数通常 3–7 个，当前实现可接受。

**建议**: 若未来模块数可能很大，可考虑虚拟列表以优化渲染。

---

## 五、无障碍与体验

### 12. 灯箱未设置 `aria` 与焦点管理

**位置**: `APlusWizardView.vue` 第 268-281 行

**现状**: 已有 `tabindex="-1"` 与 `@keydown`，支持 Esc、左右键。

**建议**: 增加 `role="dialog"`、`aria-modal="true"`、`aria-label`，并在打开时 `focus()` 灯箱容器，关闭时恢复原焦点。

---

### 13. 表单校验反馈可加强

**位置**: `APlusInputForm.vue`

**现状**: 必填项仅通过 placeholder 和 hint 提示。

**建议**: 在失焦或提交时对必填项显示内联错误提示（如红框、错误文案），提升填写准确性。

---

## 六、可维护性

### 14. 模板选项硬编码

**位置**: `APlusWizardView.vue` 第 51-57 行

**建议**: 抽到配置常量（如 `APLUS_TEMPLATE_OPTIONS`），便于统一维护和扩展。

---

### 15. 错误处理不统一

**位置**: `runAnalysis`、`runGenerate` 的 catch 块

**现状**: 部分用 `message.error`，部分用 `analysisError.value`，部分直接 `console.error`。

**建议**: 统一错误展示策略：用户可见的用 `message` / `analysisError`，调试信息用 `console.error`，并考虑集中错误上报。

---

## 七、总结与优先级

| 优先级 | 项目 | 类型 |
|-------|------|------|
| 高 | 删除 `styleVariant` 死代码 | 代码质量 |
| 高 | Blob URL 未释放导致内存泄漏 | 逻辑/性能 |
| 高 | `moduleCount` 与 `visualPlan.modules` 不同步 | 逻辑 |
| 中 | watch 依赖改用 computed | 代码质量 |
| 中 | wizardInput 保存做防抖 | 性能 |
| 中 | Step 2 模板选项增加说明 | UX |
| 中 | 灯箱无障碍属性 | 无障碍 |
| 低 | 其他 UX、配置抽取、错误处理 | 可维护性 |

建议优先处理：死代码删除、Blob URL 释放、模块数同步；其余按业务节奏逐步实施。
