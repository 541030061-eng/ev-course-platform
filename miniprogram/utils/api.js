const app = getApp();

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token');
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    };
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }
    wx.request({
      url: app.globalData.baseUrl + url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          app.globalData.isLoggedIn = false;
          wx.reLaunch({ url: '/pages/login/login' });
          return;
        }
        resolve(res.data);
      },
      fail(err) {
        wx.showToast({ title: '网络请求失败', icon: 'none' });
        reject(err);
      }
    });
  });
}

// 上传文件
function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token');
    wx.uploadFile({
      url: app.globalData.baseUrl + '/api/upload',
      filePath,
      name: 'file',
      header: {
        'Authorization': 'Bearer ' + token
      },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          resolve(data);
        } catch (e) {
          reject(e);
        }
      },
      fail(err) {
        wx.showToast({ title: '上传失败', icon: 'none' });
        reject(err);
      }
    });
  });
}

const api = {
  request,
  uploadFile,

  // 认证
  login: (data) => request('/api/auth/login', { method: 'POST', data }),
  register: (data) => request('/api/auth/register', { method: 'POST', data }),
  getMe: () => request('/api/auth/me'),
  getUsers: () => request('/api/auth/users'),

  // 帖子
  getPosts: (params = {}) => {
    const query = Object.keys(params).map(k => k + '=' + params[k]).join('&');
    return request('/api/posts' + (query ? '?' + query : ''));
  },
  getPostDetail: (id) => request('/api/posts/' + id),
  createPost: (data) => request('/api/posts', { method: 'POST', data }),
  deletePost: (id) => request('/api/posts/' + id, { method: 'DELETE' }),

  // 评论
  getComments: (postId) => request('/api/comments/' + postId),
  addComment: (data) => request('/api/comments', { method: 'POST', data }),
};

module.exports = api;
