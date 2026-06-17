App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:3000',
    isLoggedIn: false
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    } else {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },

  checkLogin() {
    if (!this.globalData.isLoggedIn) {
      wx.reLaunch({ url: '/pages/login/login' });
      return false;
    }
    return true;
  }
});
