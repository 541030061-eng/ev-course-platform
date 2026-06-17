const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    list: [],
    activeType: '',
    page: 1,
    pageSize: 20,
    loading: false,
    loadingMore: false,
    noMore: false,
    userInfo: null,
    util: util
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadPosts();
  },

  onShow() {
    if (!app.globalData.isLoggedIn) return;
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadPosts(true);
  },

  onPullDownRefresh() {
    this.loadPosts(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.noMore || this.data.loadingMore) return;
    this.setData({ loadingMore: true, page: this.data.page + 1 });
    this.loadPosts();
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ activeType: type, list: [], page: 1, noMore: false });
    this.loadPosts(true);
  },

  async loadPosts(reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const params = { page: this.data.page, pageSize: this.data.pageSize };
      if (this.data.activeType) params.type = this.data.activeType;
      const res = await api.getPosts(params);
      if (res.code === 0) {
        const newList = reset ? res.data.list : [...this.data.list, ...res.data.list];
        this.setData({
          list: newList,
          noMore: newList.length >= res.data.total,
          loading: false,
          loadingMore: false
        });
      }
    } catch (err) {
      this.setData({ loading: false, loadingMore: false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  deletePost(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: async (res) => {
        if (res.confirm) {
          const result = await api.deletePost(id);
          if (result.code === 0) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.setData({ list: this.data.list.filter(item => item.id !== id) });
          } else {
            wx.showToast({ title: result.msg, icon: 'none' });
          }
        }
      }
    });
  }
});
