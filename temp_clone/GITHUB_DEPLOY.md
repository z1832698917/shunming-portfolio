# 顺明的作品集 - GitHub部署指南

## 快速部署步骤

### 第一步：创建GitHub仓库

1. 打开 https://github.com/new
2. 仓库名称填写：`shunming-portfolio` （或你喜欢的名字）
3. 选择 **Public**（公开）
4. 勾选 **Add a README file**
5. 点击 **Create repository**

### 第二步：上传文件

#### 方法A：通过网页上传（推荐新手）

1. 在新创建的仓库页面，点击 **"uploading an existing file"**
2. 将 `portfolio_project` 文件夹中的所有文件拖入上传区域
3. 提交信息填写：`Initial commit`
4. 点击 **Commit changes**

#### 方法B：使用Git命令行

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/shunming-portfolio.git
cd shunming-portfolio

# 2. 复制所有文件到仓库文件夹
# 将 portfolio_project 中的文件复制到这里

# 3. 提交并推送
git add .
git commit -m "Initial commit"
git push origin main
```

### 第三步：启用GitHub Pages

1. 在仓库页面，点击 **Settings**（设置）
2. 左侧菜单点击 **Pages**
3. **Source** 部分选择 **Deploy from a branch**
4. **Branch** 选择 **main**，文件夹选择 **/(root)**
5. 点击 **Save**

### 第四步：访问网站

- 等待1-2分钟
- 访问地址：`https://YOUR_USERNAME.github.io/shunming-portfolio`
- （将 YOUR_USERNAME 替换为你的GitHub用户名）

---

## 文件清单

上传时需要包含以下文件：

```
📁 根目录/
├── 📄 index.html              (主展示页)
├── 📄 README.md               (项目说明)
├── 📁 css/
│   └── 📄 style.css          (样式文件)
├── 📁 js/
│   ├── 📄 main.js            (交互逻辑)
│   └── 📄 data.js            (作品数据)
└── 📁 admin/
    ├── 📄 index.html         (管理后台)
    ├── 📁 css/
    │   └── 📄 admin.css
    └── 📁 js/
        └── 📄 admin.js
```

---

## 自定义域名（可选）

如果想使用自己的域名：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容填写你的域名，如：`portfolio.shunming.com`
3. 在域名DNS设置中添加CNAME记录指向 `YOUR_USERNAME.github.io`

---

## 更新网站

修改文件后重新上传即可，GitHub Pages会自动重新部署。

---

## 需要帮助？

- GitHub Pages文档：https://pages.github.com/
- 常见问题：https://docs.github.com/en/pages
