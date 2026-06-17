const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    userInfo: null,
    myPosts: [],
    util: util
  },

  onLoad() {
    if (!app.checkLogin()) return;
  },

  onShow() {
    if (!app.globalData.isLoggedIn) return;
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadMyPosts();
  },

  async loadMyPosts() {
    const res = await api.getPosts({ pageSize: 100 });
    if (res.code === 0) {
      const myPosts = res.data.list.filter(
        item => item.user_id === app.globalData.userInfo.id
      );
      this.setData({ myPosts });
    }
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.token = '';
          app.globalData.userInfo = null;
          app.globalData.isLoggedIn = false;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
