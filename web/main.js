(function() {
  'use strict';

  // 状态
  const state = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    imageWidth: 0,
    imageHeight: 0,
    viewportWidth: 0,
    viewportHeight: 0,
    // 触摸状态
    isDragging: false,
    lastX: 0,
    lastY: 0,
    initialDistance: 0,
    initialScale: 1,
    initialTranslateX: 0,
    initialTranslateY: 0
  };

  // DOM 元素
  const viewport = document.getElementById('viewport');
  const mapContainer = document.getElementById('map-container');
  const mapImage = document.getElementById('map-image');

  // 常量
  let MIN_SCALE = 1; // 最小缩放，将在初始化时设置为cover模式的比例
  const MAX_SCALE = 3.0;

  // 初始化
  function init() {
    // 等待图片加载完成
    if (mapImage.complete) {
      setupMap();
    } else {
      mapImage.onload = setupMap;
    }
  }

  // 设置地图尺寸
  function setupMap() {
    state.imageWidth = mapImage.naturalWidth;
    state.imageHeight = mapImage.naturalHeight;
    state.viewportWidth = viewport.clientWidth;
    state.viewportHeight = viewport.clientHeight;

    // 设置图片尺寸
    mapImage.style.width = state.imageWidth + 'px';
    mapImage.style.height = state.imageHeight + 'px';

    // 计算初始缩放（cover 模式：铺满屏幕，保持宽高比）
    const scaleX = state.viewportWidth / state.imageWidth;
    const scaleY = state.viewportHeight / state.imageHeight;
    state.scale = Math.max(scaleX, scaleY);
    
    // 设置最小缩放为cover模式的比例，确保图片始终覆盖屏幕
    MIN_SCALE = state.scale;

    // 居中显示
    state.translateX = (state.viewportWidth - state.imageWidth * state.scale) / 2;
    state.translateY = (state.viewportHeight - state.imageHeight * state.scale) / 2;

    // 设置背景色为地图主色调（深色）
    viewport.style.backgroundColor = '#1a1a2e';

    updateTransform();
    bindEvents();
  }

  // 更新 transform
  function updateTransform() {
    mapContainer.style.transform = 
      `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
  }

  // 边界限制函数
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // 计算两点间距离
  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 绑定事件
  function bindEvents() {
    // 触摸事件
    mapContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // 鼠标事件（桌面调试用）
    mapContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 滚轮缩放（桌面调试用）
    mapContainer.addEventListener('wheel', handleWheel, { passive: false });
  }

  // ========== 触摸处理 ==========

  function handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // 单指拖拽
      state.isDragging = true;
      state.lastX = e.touches[0].clientX;
      state.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // 双指缩放
      state.isDragging = false;
      state.initialDistance = getDistance(e.touches);
      state.initialScale = state.scale;
      state.initialTranslateX = state.translateX;
      state.initialTranslateY = state.translateY;
    }
  }

  function handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && state.isDragging) {
      // 单指拖拽
      const deltaX = e.touches[0].clientX - state.lastX;
      const deltaY = e.touches[0].clientY - state.lastY;
      
      state.translateX += deltaX;
      state.translateY += deltaY;
      
      // 边界限制
      const scaledWidth = state.imageWidth * state.scale;
      const scaledHeight = state.imageHeight * state.scale;
      
      // X 方向限制
      if (scaledWidth > state.viewportWidth) {
        state.translateX = clamp(state.translateX, state.viewportWidth - scaledWidth, 0);
      } else {
        state.translateX = (state.viewportWidth - scaledWidth) / 2;
      }
      
      // Y 方向限制
      if (scaledHeight > state.viewportHeight) {
        state.translateY = clamp(state.translateY, state.viewportHeight - scaledHeight, 0);
      } else {
        state.translateY = (state.viewportHeight - scaledHeight) / 2;
      }
      
      state.lastX = e.touches[0].clientX;
      state.lastY = e.touches[0].clientY;
      
      updateTransform();
    } else if (e.touches.length === 2) {
      // 双指缩放
      const currentDistance = getDistance(e.touches);
      const scaleFactor = currentDistance / state.initialDistance;
      
      let newScale = state.initialScale * scaleFactor;
      newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
      
      // 计算缩放后的偏移量（保持双指中心点）
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      const scaleRatio = newScale / state.initialScale;
      state.translateX = centerX - (centerX - state.initialTranslateX) * scaleRatio;
      state.translateY = centerY - (centerY - state.initialTranslateY) * scaleRatio;
      state.scale = newScale;
      
      // 边界限制
      const scaledWidth = state.imageWidth * state.scale;
      const scaledHeight = state.imageHeight * state.scale;
      
      // X 方向限制
      if (scaledWidth > state.viewportWidth) {
        state.translateX = clamp(state.translateX, state.viewportWidth - scaledWidth, 0);
      } else {
        state.translateX = (state.viewportWidth - scaledWidth) / 2;
      }
      
      // Y 方向限制
      if (scaledHeight > state.viewportHeight) {
        state.translateY = clamp(state.translateY, state.viewportHeight - scaledHeight, 0);
      } else {
        state.translateY = (state.viewportHeight - scaledHeight) / 2;
      }
      
      updateTransform();
    }
  }

  function handleTouchEnd(e) {
    state.isDragging = false;
  }

  // ========== 鼠标处理（桌面调试） ==========

  function handleMouseDown(e) {
    state.isDragging = true;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }

  function handleMouseMove(e) {
    if (!state.isDragging) return;
    
    const deltaX = e.clientX - state.lastX;
    const deltaY = e.clientY - state.lastY;
    
    state.translateX += deltaX;
    state.translateY += deltaY;
    
    // 边界限制
    const scaledWidth = state.imageWidth * state.scale;
    const scaledHeight = state.imageHeight * state.scale;
    
    // X 方向限制
    if (scaledWidth > state.viewportWidth) {
      state.translateX = clamp(state.translateX, state.viewportWidth - scaledWidth, 0);
    } else {
      state.translateX = (state.viewportWidth - scaledWidth) / 2;
    }
    
    // Y 方向限制
    if (scaledHeight > state.viewportHeight) {
      state.translateY = clamp(state.translateY, state.viewportHeight - scaledHeight, 0);
    } else {
      state.translateY = (state.viewportHeight - scaledHeight) / 2;
    }
    
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    
    updateTransform();
  }

  function handleMouseUp() {
    state.isDragging = false;
  }

  function handleWheel(e) {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    let newScale = state.scale * delta;
    newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    
    const scaleRatio = newScale / state.scale;
    state.translateX += (e.clientX - state.translateX) * (1 - scaleRatio);
    state.translateY += (e.clientY - state.translateY) * (1 - scaleRatio);
    state.scale = newScale;
    
    // 边界限制
    const scaledWidth = state.imageWidth * state.scale;
    const scaledHeight = state.imageHeight * state.scale;
    
    // X 方向限制
    if (scaledWidth > state.viewportWidth) {
      state.translateX = clamp(state.translateX, state.viewportWidth - scaledWidth, 0);
    } else {
      state.translateX = (state.viewportWidth - scaledWidth) / 2;
    }
    
    // Y 方向限制
    if (scaledHeight > state.viewportHeight) {
      state.translateY = clamp(state.translateY, state.viewportHeight - scaledHeight, 0);
    } else {
      state.translateY = (state.viewportHeight - scaledHeight) / 2;
    }
    
    updateTransform();
  }

  // 启动
  init();
})();
