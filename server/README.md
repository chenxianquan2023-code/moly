# 认证服务（验证码、登录、注册）

## 启动

```bash
# 在项目根目录
npm run dev:server
```

默认端口 `3001`。前端开发时 Vite 会将 `/api` 代理到该服务。

## 验证码与配置

### 邮件验证码（SMTP）

- **不配置**：不会发邮件，接口返回 `devCode`，前端可显示「验证码（演示）：xxxxxx」便于开发。
- **配置后**：会真实发送邮件。设置环境变量（或在项目根目录 `.env` 中，由启动方式注入）：

| 变量 | 说明 |
|------|------|
| `SMTP_HOST` | 发件服务器，如 `smtp.163.com`、`smtp.qq.com` |
| `SMTP_PORT` | 端口，一般 `465`（SSL）或 `587` |
| `SMTP_USER` | 发件邮箱 |
| `SMTP_PASS` | 邮箱密码或**授权码**（163/QQ 等需在邮箱设置里开启 SMTP 并生成授权码） |
| `SMTP_FROM` | 可选，发件人地址，默认用 `SMTP_USER` |

示例（163）：在 163 邮箱「设置 → POP3/SMTP」开启服务并生成授权码，然后：

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your@163.com
SMTP_PASS=你的授权码
```

### 短信验证码

- **不配置**：不会发短信，接口返回 `devCode`，仅适合开发。
- **配置方式**：通过 **Webhook** 对接任意短信服务商。

设置环境变量：

| 变量 | 说明 |
|------|------|
| `SMS_WEBHOOK_URL` | 你的后端或云函数 URL，本服务会向该地址 **POST** 发送 `{ phone, countryCode, code, text }` |
| `SMS_WEBHOOK_AUTH` | 可选，如 `Bearer your-secret`，会放在请求头 `Authorization` |

你的 Webhook 收到请求后，再调用阿里云/腾讯云/Twilio 等短信 API 把 `code` 或 `text` 发到用户手机。

示例（阿里云）：在阿里云开通「短信服务」，申请签名和「验证码」模板，得到 AccessKey、签名名、模板 ID 等；在你的服务器或云函数里写一个接口（如 `POST /send-sms`），收到 body 后调阿里云 SendSms，然后把该接口的完整 URL 配成 `SMS_WEBHOOK_URL` 即可。

更多变量说明见 `server/env.example`。

## 接口

- `POST /api/auth/send-code`  body: `{ "email": "xxx@xx.com" }`
- `POST /api/auth/register`  body: `{ "email", "password", "code" }`
- `POST /api/auth/login`     body: `{ "account": "邮箱或手机号", "password" }`

用户数据与验证码当前存在内存中，重启服务会清空。
