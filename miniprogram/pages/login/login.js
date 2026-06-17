const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    activeTab: 'login',
    username: '',
    password: '',
    role: 'student',
    loading: false
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },

  selectRole(e) {
    this.setData({ role: e.currentTarget.dataset.role });
  },

  async handleSubmit() {
    const { activeTab, username, password, role } = this.data;
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (activeTab === 'register' && !role) {
      wx.showToast({ title: '请选择身份', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const fn = activeTab === 'login' ? api.login : api.register;
      const params = activeTab === 'login'
        ? { username: username.trim(), password }
        : { username: username.trim(), password, role };

      const res = await fn(params);
      if (res.code === 0) {
        wx.setStorageSync('token', res.data.token);
        wx.setStorageSync('userInfo', res.data.user);
        app.globalData.token = res.data.token;
        app.globalData.userInfo = res.data.user;
        app.globalData.isLoggedIn = true;

        wx.showToast({ title: activeTab === 'login' ? '登录成功' : '注册成功', icon: 'success' });
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 800);
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
    this.setData({ loading: false });
  }
});
