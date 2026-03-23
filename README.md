# Moly

Vue 3 + TypeScript + Vite，AI 工作流与虚拟试穿前端。

## 开发

### 1. 安装依赖

```bash
npm install
```

### 2. 启动认证服务（登录/注册/验证码）

```bash
npm run dev:server
```

保持此终端运行，端口 3001。未配置 SMTP 时，验证码会在接口返回的 `devCode` 中给出，注册页会显示。

### 3. 启动前端

```bash
npm run dev
```

浏览器打开 http://localhost:5173。首次使用请先「立即注册」获取账号，再登录。

### 4. 可选：真实发送验证码邮件

在项目根目录配置环境变量（或 `.env`）后重启 `dev:server`：

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=your_password
SMTP_FROM=your@email.com
```

详见 `server/README.md`。

## 构建

```bash
npm run build
```

## 设计说明

- 登录/注册：参考 DeepSeek，支持邮箱注册、验证码、密码登录。
- 整站配色：参考 Pic Copilot，浅色背景（#f5f6f8）、白卡片、蓝色主色（#2563eb）。
