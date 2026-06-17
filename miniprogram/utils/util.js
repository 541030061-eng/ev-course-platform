function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(/-/g, '/'));
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 172800000) return '昨天';
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return month + '月' + day + '日';
}

function typeLabel(type) {
  const map = { knowledge: '知识点', homework: '作业', discussion: '讨论' };
  return map[type] || type;
}

function roleLabel(role) {
  const map = { teacher: '老师', student: '学生' };
  return map[role] || role;
}

function visibilityLabel(v) {
  const map = {
    public: '所有人可见',
    teachers_only: '仅老师可见',
    students_only: '仅学生可见',
    specific: '指定用户可见'
  };
  return map[v] || v;
}

module.exports = { formatTime, typeLabel, roleLabel, visibilityLabel };
