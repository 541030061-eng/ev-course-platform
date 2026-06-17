const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    post: null,
    comments: [],
    commentText: '',
    postId: '',
    util: util
  },

  onLoad(options) {
    if (!app.checkLogin()) return;
    this.setData({ postId: options.id });
    this.loadDetail();
    this.loadComments();
  },

  async loadDetail() {
    const res = await api.getPostDetail(this.data.postId);
    if (res.code === 0) {
      this.setData({ post: res.data });
      wx.setNavigationBarTitle({ title: res.data.title.substring(0, 10) || '详情' });
    } else {
      wx.showToast({ title: res.msg, icon: 'none' });
      if (res.code === 403) {
        setTimeout(() => wx.navigateBack(), 1500);
      }
    }
  },

  async loadComments() {
    const res = await api.getComments(this.data.postId);
    if (res.code === 0) {
      this.setData({ comments: res.data });
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  async addComment() {
    const text = this.data.commentText.trim();
    if (!text) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    const res = await api.addComment({
      post_id: this.data.postId,
      content: text
    });
    if (res.code === 0) {
      this.setData({ commentText: '' });
      wx.showToast({ title: '评论成功', icon: 'success' });
      this.loadComments();
    } else {
      wx.showToast({ title: res.msg, icon: 'none' });
    }
  }
});
