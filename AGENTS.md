# AGENTS.md

本项目是一个 **基于静态图片的地图系统**，同时包含：
- H5（web）实现
- 微信小程序（miniprogram）实现

目标是实现类似高德 / Google 地图的交互效果：
**图片可缩放、可拖拽，并在指定坐标上渲染 Marker 点**。

本文件用于指导 **AI 编程代理 / CLI 工具（如 aider、cursor、continue、opencode 等）**
在本项目中的代码生成、修改与协作行为。

---

## 1. 项目目录结构

```
.
├── AGENTS.md            # AI / CLI 协作规范（本文件）
├── miniprogram/         # 微信小程序代码
├── web/                 # H5 地图代码
└── map.jpg              # 地图底图（原始坐标基准）
```

### 目录职责说明

- `web/`
  - H5 实现（HTML / CSS / JavaScript）
  - 运行环境：浏览器 / WebView / 公众号
  - 使用 DOM + CSS transform 实现缩放和平移

- `miniprogram/`
  - 微信小程序实现
  - 优先使用官方组件（`movable-area` / `movable-view`）

- `map.jpg`
  - **唯一的地图坐标基准**
  - 所有 Marker 坐标均基于该图片的原始像素尺寸
  - 不允许出现多个坐标体系

---

## 2. 核心原则：坐标系统（非常重要）

### 黄金法则

> **所有 Marker 的坐标，必须使用 map.jpg 的原始像素坐标。**

### Marker 数据结构示例

```js
{
  id: "marker-1",
  x: 320, // 原始图片像素 X
  y: 580  // 原始图片像素 Y
}
```

### 明确禁止

- ❌ 存储屏幕坐标
- ❌ 存储缩放后的坐标
- ❌ 因不同端而维护不同坐标体系

---

## 3. 统一的 Transform 模型（H5 / 小程序一致）

所有实现必须遵循以下逻辑模型：

- `scale`：当前缩放比例
- `translateX`：当前 X 方向平移
- `translateY`：当前 Y 方向平移

### Marker → 屏幕坐标计算公式

```
screenX = marker.x * scale + translateX
screenY = marker.y * scale + translateY
```

### Transform 规则

- transform 必须作用在 **单一父容器**
- marker 必须是该容器的子元素
- transform-origin 必须是 `0 0`

---

## 4. H5（web）实现规范

### 推荐技术

- 原生 `touchstart / touchmove / touchend`
- CSS `transform: translate() scale()`
- GPU 加速（避免频繁修改 top / left）

### DOM 结构推荐

```html
<div id="viewport">
  <div id="map">
    <img src="../map.jpg" />
    <!-- markers -->
  </div>
</div>
```

- `#map` 负责 transform
- marker 使用 `position: absolute`
- marker 坐标 = 原图像素坐标

### 禁止行为

- ❌ 默认使用 Canvas
- ❌ marker 单独做 transform
- ❌ 每一帧手动重新计算 marker 坐标

---

## 5. 小程序实现规范（miniprogram）

### 推荐组件

- `movable-area`
- `movable-view`（开启 `scale`）

### 规则

- marker 必须是 `movable-view` 的子节点
- marker 的 left / top 使用原图像素坐标
- 使用组件属性限制最小 / 最大缩放

### 避免

- ❌ 手动实现手势（除非必要）
- ❌ 不必要的 Canvas 绘制

---

## 6. 通用约束

### 缩放限制

- 必须设置最小缩放（如 `0.5`）
- 必须设置最大缩放（如 `3.0`）

### 性能约束

- H5 DOM Marker 数量建议 < 500
- 优先使用 transform，避免触发布局
- 不要在 move 过程中频繁 setState

---

## 7. 可扩展能力（允许 AI 实现）

在不破坏坐标系统的前提下，AI 可以实现：

- Marker 点击 / 长按
- Marker 信息弹窗
- 动态新增 / 删除 Marker
- 屏幕坐标 ↔ 地图坐标转换
- 拖拽边界限制
- Marker 视觉大小固定（不随缩放变化）

---

## 8. 明确禁止的行为

- ❌ 重构或替换坐标体系
- ❌ 存储 transform 后的坐标
- ❌ 同时混用 DOM + Canvas（除非明确要求）
- ❌ 引入重量级第三方渲染库

---

## 9. 默认假设

在没有额外说明的情况下，默认：

- 地图底图只有 `map.jpg`
- 页面只存在一个地图实例
- 以移动端交互为主
- 性能目标优先于视觉特效

---

## 10. AI / CLI 工具行为规范

- 优先输出简洁、可维护代码
- 关键数学 / transform 逻辑必须写注释
- 不引入多余抽象
- 结构性调整前需说明原因

---

## 11. 边界

- **始终执行**:
    - 保持代码干净和模块化，易于理解和维护。
    - 在用户确认主要任务完成后，在 MEMO.md 中更新项目进展。
- **操作前请确认**:
    - 在大幅度修改现有源代码之前（即修改超过 3 个源文件）。
    - 修改 IDEA 项目设置。
- **永远不要**:
    - 在单个迭代中提交多个主要任务。
    - 使用 cat 来创建或编辑文件。

---

文件结束
