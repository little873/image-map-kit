// index.js
// index.js - 地图页面
Page({
  data: {
    // 视口尺寸
    viewportWidth: 300,
    viewportHeight: 300,
    // 图片原始尺寸
    imageWidth: 0,
    imageHeight: 0,
    // Marker数据
    markers: [
      // 图片标记点
      { 
        id: 'pic-1', 
        x: 200, 
        y: 400, 
        type: 'image', 
        image: '../../image/1.jpeg',
        title: '位置一',
        description: '这是第一个标记点的详细描述信息，可以包含更多内容。',
        videoUrl: 'https://cos-power-app-offline-1251840830.cos.ap-beijing.myqcloud.com/temp/source/1.mp4'
      },
      { 
        id: 'pic-2', 
        x: 500, 
        y: 300, 
        type: 'image', 
        image: '../../image/2.jpeg',
        title: '位置二',
        description: '第二个标记点的描述，这里可以写一些相关的说明文字。',
        videoUrl: 'https://cos-power-app-offline-1251840830.cos.ap-beijing.myqcloud.com/temp/source/2.mp4'
      },
      { 
        id: 'pic-3', 
        x: 350, 
        y: 600, 
        type: 'image', 
        image: '../../image/3.jpeg',
        title: '位置三',
        description: '第三个标记点的详细信息，描述内容可以根据需要调整。',
        videoUrl: 'https://cos-power-app-offline-1251840830.cos.ap-beijing.myqcloud.com/temp/source/3.mp4'
      }
    ],
    // 弹窗状态
    showPopup: false,
    popupTitle: '',
    popupImage: '',
    popupDescription: '',
    popupVideoUrl: '',
    // 视频播放器状态
    showVideoPlayer: false,
    currentVideoUrl: ''
  },

  onLoad() {
    // 获取窗口信息（使用新的API）
    const windowInfo = wx.getWindowInfo();
    this.setData({
      viewportWidth: windowInfo.windowWidth,
      viewportHeight: windowInfo.windowHeight
    });
    
    // 初始化变量
    this._currentX = 0;
    this._currentY = 0;
    this._currentScale = 1;
    
    // 加载地图图片
    this.loadMapImage();
  },

  loadMapImage() {
    // 使用wx.getImageInfo获取图片信息
    wx.getImageInfo({
      src: '/map.jpg',
      success: (res) => {
        const imageWidth = res.width;
        const imageHeight = res.height;
        const viewportWidth = this.data.viewportWidth;
        const viewportHeight = this.data.viewportHeight;
        
        // 计算初始缩放比例，使图片充满整个屏幕
        // 取宽度和高度缩放比例中的较大值，确保图片覆盖整个屏幕
        const scaleX = viewportWidth / imageWidth;
        const scaleY = viewportHeight / imageHeight;
        const initialScale = Math.max(scaleX, scaleY);
        
        // 保存初始缩放比例，用于最小缩放限制
        this._initialScale = initialScale;
        
        this.setData({
          imageWidth: imageWidth,
          imageHeight: imageHeight,
          initialScale: initialScale, // 保存到data中，用于wxml
        }, () => {
          // 图片尺寸设置完成后，初始化movable-view的位置
          this.initMapView(initialScale);
        });
      },
      fail: (err) => {
        console.error('加载图片失败:', err);
        // 如果获取图片信息失败，使用默认尺寸
        const imageWidth = 1200;
        const imageHeight = 734;
        const viewportWidth = this.data.viewportWidth;
        const viewportHeight = this.data.viewportHeight;
        const scaleX = viewportWidth / imageWidth;
        const scaleY = viewportHeight / imageHeight;
        const initialScale = Math.max(scaleX, scaleY);
        
        // 保存初始缩放比例
        this._initialScale = initialScale;
        
        this.setData({
          imageWidth: imageWidth,
          imageHeight: imageHeight,
          initialScale: initialScale,
        }, () => {
          this.initMapView(initialScale);
        });
        
        wx.showToast({
          title: '地图加载中',
          icon: 'loading',
          duration: 2000
        });
      }
    });
  },

  // 初始化movable-view的位置
  initMapView(initialScale) {
    const mapView = this.selectComponent('#mapView');
    if (mapView) {
      const { viewportWidth, viewportHeight, imageWidth, imageHeight } = this.data;
      const scaledWidth = imageWidth * initialScale;
      const scaledHeight = imageHeight * initialScale;
      
      // 计算位置，使图片覆盖整个屏幕
      // 图片的中心与屏幕中心对齐
      let initialX = (viewportWidth - scaledWidth) / 2;
      let initialY = (viewportHeight - scaledHeight) / 2;
      
      // 确保图片完全覆盖屏幕
      // 如果图片在某个方向上比屏幕小，调整位置使其居中
      if (scaledWidth < viewportWidth) {
        initialX = (viewportWidth - scaledWidth) / 2;
      }
      if (scaledHeight < viewportHeight) {
        initialY = (viewportHeight - scaledHeight) / 2;
      }
      
      // 直接设置movable-view的属性
      mapView.setData({
        x: initialX,
        y: initialY,
        scale: initialScale
      });
      
      // 保存当前状态
      this._currentX = initialX;
      this._currentY = initialY;
      this._currentScale = initialScale;
    }
  },

  // movable-view变化事件
  onViewChange(e) {
    const detail = e.detail;
    const { viewportWidth, viewportHeight, imageWidth, imageHeight } = this.data;
    
    // 获取当前缩放比例，如果没有变化则使用之前的
    const currentScale = detail.scale !== undefined ? detail.scale : this._currentScale;
    
    // 计算边界限制
    const scaledWidth = imageWidth * currentScale;
    const scaledHeight = imageHeight * currentScale;
    
    // 计算允许的最大和最小位置
    // 确保图片始终覆盖整个屏幕
    let minX = viewportWidth - scaledWidth;
    let maxX = 0;
    let minY = viewportHeight - scaledHeight;
    let maxY = 0;
    
    // 如果图片在某个方向上比屏幕小，调整边界使其居中
    if (scaledWidth < viewportWidth) {
      minX = (viewportWidth - scaledWidth) / 2;
      maxX = minX;
    }
    if (scaledHeight < viewportHeight) {
      minY = (viewportHeight - scaledHeight) / 2;
      maxY = minY;
    }
    
    // 限制x和y在边界内
    let clampedX = Math.max(minX, Math.min(maxX, detail.x));
    let clampedY = Math.max(minY, Math.min(maxY, detail.y));
    
    // 如果位置被限制，需要更新movable-view的位置
    if (clampedX !== detail.x || clampedY !== detail.y) {
      const mapView = this.selectComponent('#mapView');
      if (mapView) {
        mapView.setData({
          x: clampedX,
          y: clampedY
        });
      }
    }
    
    // 保存当前状态
    this._currentX = clampedX !== detail.x ? clampedX : detail.x;
    this._currentY = clampedY !== detail.y ? clampedY : detail.y;
    this._currentScale = currentScale;
  },

  // Marker点击事件
  onMarkerTap(e) {
    const markerId = e.currentTarget.dataset.id;
    const marker = this.data.markers.find(m => m.id === markerId);
    
    if (marker) {
      this.setData({
        showPopup: true,
        popupTitle: marker.title || '标记点',
        popupImage: marker.image,
        popupDescription: marker.description || `坐标: (${marker.x}, ${marker.y})`,
        popupVideoUrl: marker.videoUrl || ''
      });
    }
  },

  // 观看视频
  watchVideo() {
    const videoUrl = this.data.popupVideoUrl;
    if (!videoUrl) {
      wx.showToast({
        title: '视频地址无效',
        icon: 'none'
      });
      return;
    }
    
    // 显示视频播放器
    this.setData({
      showVideoPlayer: true,
      currentVideoUrl: videoUrl
    });
    
    // 创建视频上下文并播放
    setTimeout(() => {
      const videoContext = wx.createVideoContext('popupVideo', this);
      if (videoContext) {
        videoContext.play();
      }
    }, 100);
  },

  // 关闭弹窗
  closePopup() {
    this.setData({
      showPopup: false,
      showVideoPlayer: false
    });
  },

  // 关闭视频播放器
  closeVideoPlayer() {
    // 停止视频播放
    const videoContext = wx.createVideoContext('popupVideo', this);
    if (videoContext) {
      videoContext.stop();
    }
    this.setData({
      showVideoPlayer: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 这个方法什么都不做，只是阻止事件冒泡
    return;
  },

  // 重置视图到初始状态
  resetView() {
    const { viewportWidth, viewportHeight, imageWidth, imageHeight } = this.data;
    
    if (imageWidth && imageHeight) {
      const scaleX = viewportWidth / imageWidth;
      const scaleY = viewportHeight / imageHeight;
      const initialScale = Math.max(scaleX, scaleY);
      
      // 计算缩放后的尺寸
      const scaledWidth = imageWidth * initialScale;
      const scaledHeight = imageHeight * initialScale;
      
      // 计算位置，使图片覆盖整个屏幕
      // 图片的中心与屏幕中心对齐
      let initialX = (viewportWidth - scaledWidth) / 2;
      let initialY = (viewportHeight - scaledHeight) / 2;
      
      // 确保图片完全覆盖屏幕
      if (scaledWidth < viewportWidth) {
        initialX = (viewportWidth - scaledWidth) / 2;
      }
      if (scaledHeight < viewportHeight) {
        initialY = (viewportHeight - scaledHeight) / 2;
      }
      
      // 直接操作movable-view组件
      const mapView = this.selectComponent('#mapView');
      if (mapView) {
        mapView.setData({
          x: initialX,
          y: initialY,
          scale: initialScale
        });
      }
      
      // 更新当前状态
      this._currentX = initialX;
      this._currentY = initialY;
      this._currentScale = initialScale;
    }
  }
})
