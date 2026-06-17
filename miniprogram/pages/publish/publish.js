const api = require('../../utils/api');
const util = require('../../utils/util');
const app = getApp();

Page({
  data: {
    title: '',
    content: '',
    type: 'knowledge',
    visibility: 'public',
    visibilityIndex: 0,
    visibilityOptions: ['所有人可见', '仅老师可见', '仅学生可见', '指定用户可见'],
    visibleUsers: [],
    users: [],
    fileName: '',
    fileUrl: '',
    loading: false,
    userInfo: null,
    util: util
  },

  onLoad() {
    if (!app.checkLogin()) return;
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadUsers();
  },

  async loadUsers() {
    const res = await api.getUsers();
    if (res.code === 0) {
      this.setData({ users: res.data.filter(u => u.id !== app.globalData.userInfo.id) });
    }
  },

  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onContentInput(e) { this.setData({ content: e.detail.value }); },

  selectType(e) {
    this.setData({ type: e.currentTarget.dataset.type });
  },

  onVisibilityChange(e) {
    const idx = parseInt(e.detail.value);
    const values = ['public', 'teachers_only', 'students_only', 'specific'];
    this.setData({ visibilityIndex: idx, visibility: values[idx] });
  },

  toggleUser(e) {
    const uid = e.currentTarget.dataset.id;
    let arr = [...this.data.visibleUsers];
    const idx = arr.indexOf(uid);
    if (idx > -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(uid);
    }
    this.setData({ visibleUsers: arr });
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'all',
      success: async (res) => {
        const file = res.tempFiles[0];
        wx.showLoading({ title: '上传中...' });
        try {
          const result = await api.uploadFile(file.path);
          if (result.code === 0) {
            this.setData({
              fileName: result.data.name,
              fileUrl: result.data.url
            });
          } else {
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
        wx.hideLoading();
      }
    });
  },

  removeFile() {
    this.setData({ fileName: '', fileUrl: '' });
  },

  async handleSubmit() {
    const { title, content, type, visibility, visibleUsers, fileName, fileUrl } = this.data;
    if (!title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (visibility === 'specific' && visibleUsers.length === 0) {
      wx.showToast({ title: '请选择可见用户', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const data = {
        title: title.trim(),
        content: content.trim(),
        type,
        visibility,
        file_name: fileName,
        file_url: fileUrl,
        visibleUsers
      };
      const res = await api.createPost(data);
      if (res.code === 0) {
        wx.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
          this.resetForm();
        }, 800);
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    } catch (e) {
      wx.showToast({ title: '发布失败', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  resetForm() {
    this.setData({
      title: '', content: '', type: 'knowledge', visibility: 'public',
      visibilityIndex: 0, visibleUsers: [], fileName: '', fileUrl: ''
    });
  }
});
