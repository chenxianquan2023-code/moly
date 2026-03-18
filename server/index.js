/**
 * Moly 认证 API 服务（验证码、注册、登录、手机扫码上传）
 * 运行: node server/index.js  (默认端口 3001)
 * 开发时 Vite 会代理 /api -> http://localhost:3001（见 vite.config.ts）
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { appendFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createTransport } from 'nodemailer';
import { WebSocketServer } from 'ws';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, 'uploads');
try { mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// 手机扫码上传：token -> { expiresAt }
const uploadTokens = new Map();
const UPLOAD_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 分钟

// token -> WebSocket 客户端（用于通知上传完成）
const uploadWsClients = new Map();

const storage = multer.memoryStorage();
const uploadMw = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// POST /api/upload/create-token  返回 { token }
app.post('/api/upload/create-token', (req, res) => {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  uploadTokens.set(token, { expiresAt: Date.now() + UPLOAD_TOKEN_TTL_MS });
  res.json({ token });
});

// POST /api/upload  multipart: token, file
app.post('/api/upload', uploadMw.single('file'), (req, res) => {
  const token = (req.body?.token || req.query?.token || '').trim();
  const file = req.file;
  if (!token || !file) {
    return res.status(400).json({ success: false, message: '缺少 token 或文件' });
  }
  const meta = uploadTokens.get(token);
  if (!meta || meta.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: 'token 无效或已过期' });
  }
  if (!file.mimetype?.startsWith('image/')) {
    return res.status(400).json({ success: false, message: '仅支持图片上传' });
  }
  const ext = (file.originalname?.split('.').pop() || 'png').replace(/[^a-z0-9]/gi, '');
  const filename = `${token}_${Date.now()}.${ext || 'png'}`;
  const filepath = join(UPLOAD_DIR, filename);
  try {
    writeFileSync(filepath, file.buffer);
  } catch (e) {
    return res.status(500).json({ success: false, message: '写入文件失败' });
  }
  uploadTokens.delete(token);
  const fileUrl = `/api/upload/files/${filename}`;
  // 通知 WebSocket 客户端
  const ws = uploadWsClients.get(token);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'upload_complete', url: fileUrl }));
  }
  res.json({ success: true, url: fileUrl });
});

// 静态文件：上传后的图片
app.use('/api/upload/files', express.static(UPLOAD_DIR));

// 内存存储：验证码 (key -> { code, expiresAt })  key 为 email 或 phone:countryCode+number
const codes = new Map();
// 内存存储：用户 (account 小写 -> { password, email?, phone?, countryCode? })
const users = new Map();
// 忘记密码：token -> { email, expiresAt }
const resetTokens = new Map();
const RESET_TTL_MS = 30 * 60 * 1000; // 30 分钟

const CODE_TTL_MS = 5 * 60 * 1000; // 5 分钟

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 可选：配置 SMTP 后真正发邮件。未配置时仅控制台输出并在响应中返回 devCode 便于开发
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER;

async function sendEmail(to, subject, text) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('[Auth] 未配置 SMTP，跳过发送。邮件内容:', { to, subject, text });
    return { sent: false };
  }
  const transporter = createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_PORT === '465',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  await transporter.sendMail({
    from: SMTP_FROM,
    to,
    subject,
    text,
  });
  return { sent: true };
}

// 可选：配置短信通道。未配置时仅控制台输出，接口返回 devCode 便于开发
const SMS_WEBHOOK_URL = process.env.SMS_WEBHOOK_URL;
const SMS_WEBHOOK_AUTH = process.env.SMS_WEBHOOK_AUTH;

async function sendSms(phone, countryCode, code) {
  if (!SMS_WEBHOOK_URL) {
    console.log('[Auth] 未配置短信，跳过发送。手机验证码:', { phone: `${countryCode}***`, code });
    return { sent: false };
  }
  try {
    const res = await fetch(SMS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SMS_WEBHOOK_AUTH ? { Authorization: SMS_WEBHOOK_AUTH } : {}),
      },
      body: JSON.stringify({
        phone: String(phone).replace(/\D/g, ''),
        countryCode: String(countryCode).replace(/\D/g, '') || '86',
        code,
        text: `您的 Moly 验证码是：${code}，5 分钟内有效。如非本人操作请忽略。`,
      }),
    });
    if (!res.ok) {
      console.error('[Auth] 短信 webhook 返回非 2xx:', res.status, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error('[Auth] 发送短信失败:', err.message);
    return { sent: false };
  }
}

// POST /api/auth/send-code   body: { email } 或 { phone, countryCode }（同时存在时优先用 phone）
app.post('/api/auth/send-code', async (req, res) => {
  const rawBody = req.body || {};
  console.log('[Auth] send-code req.body:', JSON.stringify(rawBody), 'keys:', Object.keys(rawBody));
  try {
    appendFileSync(
      '/Users/aix/omni-gen/.cursor/debug-efb394.log',
      JSON.stringify({ sessionId: 'efb394', hypothesisId: 'H5', location: 'server:send-code:entry', data: { body: rawBody, keys: Object.keys(rawBody) }, timestamp: Date.now() }) + '\n'
    );
  } catch (_) {}
  fetch('http://127.0.0.1:7540/ingest/d97822f3-40b2-4c53-b46c-84dbb07e685e', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'efb394' },
    body: JSON.stringify({
      sessionId: 'efb394',
      runId: 'pre-fix-3',
      hypothesisId: 'H5',
      location: 'server/index.js:send-code:entry',
      message: 'send-code raw req.body',
      data: { body: rawBody, keys: Object.keys(rawBody) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  const { email, phone, countryCode } = rawBody;
  let key;
  if (phone && countryCode) {
    const p = String(phone).replace(/\D/g, '');
    // #region agent log
    fetch('http://127.0.0.1:7540/ingest/d97822f3-40b2-4c53-b46c-84dbb07e685e', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'efb394',
      },
      body: JSON.stringify({
        sessionId: 'efb394',
        runId: 'pre-fix-2',
        hypothesisId: 'H4',
        location: 'server/index.js:send-code',
        message: 'send-code body for phone',
        data: { rawPhone: phone, normalized: p, countryCode },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log
    if (p.length < 10) {
      return res.status(400).json({ success: false, message: '请输入正确的手机号' });
    }
    key = `phone:${String(countryCode).replace(/\D/g, '')}${p}`;
  } else if (email) {
    const trimmed = String(email).trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return res.status(400).json({ success: false, message: '请输入正确的邮箱' });
    }
    key = trimmed;
  } else {
    return res.status(400).json({ success: false, message: '请提供邮箱或手机号' });
  }
  const code = randomCode();
  codes.set(key, { code, expiresAt: Date.now() + CODE_TTL_MS });
  if (key.includes('@')) {
    const text = `您的 Moly 验证码是：${code}，5 分钟内有效。如非本人操作请忽略。`;
    await sendEmail(key, 'Moly 验证码', text);
  } else {
    const p = String(rawBody.phone || '').replace(/\D/g, '');
    const cc = String(rawBody.countryCode || '86').replace(/\D/g, '') || '86';
    const smsResult = await sendSms(p, cc, code);
    if (!smsResult.sent) {
      console.log('[Auth] 手机验证码（未配置短信或发送失败）:', { key, code });
    }
  }
  const devCode = key.includes('@') ? (!SMTP_USER ? code : undefined) : (!SMS_WEBHOOK_URL ? code : undefined);
  return res.json({ success: true, message: '验证码已发送', devCode });
});

// POST /api/auth/register   body: { email, password, code } 或 { phone, countryCode, password, code }
app.post('/api/auth/register', (req, res) => {
  const { email, phone, countryCode, password, code } = req.body || {};
  let key;
  let userPayload;
  if (email) {
    const trimmed = String(email).trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return res.status(400).json({ success: false, message: '请输入正确的邮箱' });
    }
    key = trimmed;
    userPayload = { password: String(password), email: trimmed };
  } else if (phone && countryCode) {
    const p = String(phone).replace(/\D/g, '');
    if (p.length < 10) return res.status(400).json({ success: false, message: '请输入正确的手机号' });
    key = `phone:${String(countryCode).replace(/\D/g, '')}${p}`;
    const pw = String(password || '').trim();
    userPayload = { password: pw.length >= 6 ? pw : randomCode() + Date.now(), phone: key, countryCode: String(countryCode) };
  } else {
    return res.status(400).json({ success: false, message: '请提供邮箱或手机号' });
  }
  if (!key.includes('phone') && (!password || String(password).length < 6)) {
    return res.status(400).json({ success: false, message: '密码至少 6 位' });
  }
  const stored = codes.get(key);
  if (!stored || stored.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
  }
  if (stored.code !== String(code).trim()) {
    return res.status(400).json({ success: false, message: '验证码错误' });
  }
  codes.delete(key);
  if (users.has(key)) {
    return res.status(400).json({ success: false, message: '该账号已注册，请直接登录' });
  }
  users.set(key, userPayload);
  return res.json({ success: true, message: '注册成功' });
});

// POST /api/auth/login   body: { account, password }
app.post('/api/auth/login', (req, res) => {
  const { account, password } = req.body || {};
  const acc = String(account || '').trim();
  const pw = String(password || '');
  if (!acc || !pw) {
    return res.status(400).json({ success: false, message: '请输入账号和密码' });
  }
  const key = acc.includes('@') ? acc.toLowerCase() : (acc.startsWith('+') ? `phone:${acc.replace(/\D/g, '')}` : acc);
  const user = users.get(key) || users.get(acc);
  if (!user || user.password !== pw) {
    return res.status(401).json({ success: false, message: '账号或密码错误' });
  }
  return res.json({
    success: true,
    user: { email: user.email || null, phone: user.phone || (key.startsWith('phone:') ? key : null) },
  });
});

// POST /api/auth/login-by-code   body: { account, code }  account 为邮箱或 +国家码+手机号
app.post('/api/auth/login-by-code', (req, res) => {
  const { account, code } = req.body || {};
  const acc = String(account || '').trim();
  const c = String(code || '').trim();
  if (!acc || !c || !/^\d{6}$/.test(c)) {
    return res.status(400).json({ success: false, message: '请输入账号和验证码' });
  }
  const key = acc.includes('@') ? acc.toLowerCase() : `phone:${acc.replace(/\D/g, '')}`;
  const stored = codes.get(key);
  if (!stored || stored.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
  }
  if (stored.code !== c) {
    return res.status(401).json({ success: false, message: '验证码错误' });
  }
  codes.delete(key);
  let user = users.get(key);
  if (!user) {
    if (key.startsWith('phone:')) {
      users.set(key, { password: randomCode() + Date.now(), email: null, phone: key });
      user = users.get(key);
    } else {
      return res.status(404).json({ success: false, message: '该账号未注册，请先注册' });
    }
  }
  return res.json({
    success: true,
    user: { email: user.email || null, phone: user.phone || (key.startsWith('phone:') ? key : null) },
  });
});

// POST /api/auth/forgot-password   body: { email }
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const trimmed = String(email || '').trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return res.status(400).json({ success: false, message: '请输入正确的邮箱' });
  }
  if (!users.has(trimmed)) {
    return res.status(404).json({ success: false, message: '该邮箱未注册' });
  }
  const token = randomCode() + Date.now().toString(36);
  resetTokens.set(token, { email: trimmed, expiresAt: Date.now() + RESET_TTL_MS });
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
  const link = `${baseUrl}/reset-password?token=${token}`;
  const text = `您正在重置 Moly 密码，请点击链接完成重置（30分钟内有效）：\n${link}\n如非本人操作请忽略。`;
  await sendEmail(trimmed, 'Moly 重置密码', text);
  return res.json({ success: true, message: '重置链接已发送至您的邮箱' });
});

// POST /api/auth/reset-password   body: { token, newPassword }
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ success: false, message: '参数无效或密码至少6位' });
  }
  const stored = resetTokens.get(token);
  if (!stored || stored.expiresAt < Date.now()) {
    return res.status(400).json({ success: false, message: '链接已过期，请重新申请' });
  }
  resetTokens.delete(token);
  const user = users.get(stored.email);
  if (!user) return res.status(400).json({ success: false, message: '用户不存在' });
  user.password = String(newPassword);
  return res.json({ success: true, message: '密码已重置' });
});

// ============================================================
// Amazon 商品页面抓取 — Jina Reader（Markdown 模式）
// ============================================================

const AMAZON_MARKET_DOMAINS = {
  us: 'https://www.amazon.com',
  uk: 'https://www.amazon.co.uk',
  de: 'https://www.amazon.de',
  jp: 'https://www.amazon.co.jp',
  ca: 'https://www.amazon.ca',
};

// POST /api/amazon/fetch-markdown   body: { asin, market? }
app.post('/api/amazon/fetch-markdown', async (req, res) => {
  const { asin, market } = req.body || {};
  if (!asin || !/^[A-Z0-9]{10}$/i.test(String(asin).trim())) {
    return res.status(400).json({ success: false, message: '无效的 ASIN' });
  }

  const cleanAsin = String(asin).trim().toUpperCase();
  const domain = AMAZON_MARKET_DOMAINS[market] || AMAZON_MARKET_DOMAINS.us;
  const amazonUrl = `${domain}/dp/${cleanAsin}`;
  const jinaUrl = `https://r.jina.ai/${amazonUrl}`;

  console.log(`[Jina] Fetching markdown for: ${amazonUrl}`);

  try {
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/markdown',
        'X-Return-Format': 'markdown',
        'X-Timeout': '30',
      },
      signal: AbortSignal.timeout(35000),
    });

    if (!response.ok) {
      console.error(`[Jina] HTTP ${response.status} for ${cleanAsin}`);
      return res.json({
        success: false,
        message: `Jina Reader 返回 HTTP ${response.status}`,
      });
    }

    const markdown = await response.text();

    if (!markdown || markdown.length < 100) {
      return res.json({
        success: false,
        message: '获取到的页面内容过少，该 ASIN 可能不存在',
      });
    }

    console.log(`[Jina] Got ${markdown.length} chars of markdown for ${cleanAsin}`);

    return res.json({
      success: true,
      asin: cleanAsin,
      url: amazonUrl,
      markdown,
    });
  } catch (err) {
    console.error(`[Jina] Fetch error for ${cleanAsin}:`, err.message);
    return res.json({
      success: false,
      message: `Jina Reader 抓取失败: ${err.message}`,
    });
  }
});

// ============================================================
// Amazon 商品页面抓取（真实数据 — 旧版 HTML 解析，保留兼容）
// ============================================================

const AMAZON_DOMAINS = {
  us: 'https://www.amazon.com',
  uk: 'https://www.amazon.co.uk',
  de: 'https://www.amazon.de',
  jp: 'https://www.amazon.co.jp',
  ca: 'https://www.amazon.ca',
};

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function extractTextBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';
  const afterStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, afterStart);
  if (endIdx === -1) return '';
  return html.substring(afterStart, endIdx);
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseAmazonHtml(html) {
  const result = {
    title: '',
    bulletPoints: [],
    description: '',
    price: '',
    rating: '',
    reviewCount: '',
    imageUrls: [],
    brand: '',
    category: '',
  };

  // Title: <span id="productTitle"
  const titleBlock = extractTextBetween(html, 'id="productTitle"', '</span>');
  if (titleBlock) {
    result.title = stripHtml(titleBlock.substring(titleBlock.indexOf('>') + 1));
  }

  // Bullet points: <div id="feature-bullets"
  const bulletsBlock = extractTextBetween(html, 'id="feature-bullets"', '</div>');
  if (bulletsBlock) {
    const bulletMatches = bulletsBlock.match(/<span class="a-list-item"[^>]*>([\s\S]*?)<\/span>/gi) || [];
    result.bulletPoints = bulletMatches
      .map(b => stripHtml(b))
      .filter(b => b.length > 5 && !b.includes('Make sure this fits') && !b.includes('Click here'));
  }

  // Description: <div id="productDescription"
  const descBlock = extractTextBetween(html, 'id="productDescription"', '</div>');
  if (descBlock) {
    const descInner = extractTextBetween(descBlock, '<p>', '</p>') || descBlock;
    result.description = stripHtml(descInner);
  }

  // Price
  const priceMatch = html.match(/class="a-price-whole"[^>]*>([^<]+)/);
  const priceFraction = html.match(/class="a-price-fraction"[^>]*>([^<]+)/);
  if (priceMatch) {
    result.price = '$' + priceMatch[1].replace(/[^0-9.,]/g, '') + (priceFraction ? priceFraction[1] : '');
  }

  // Rating
  const ratingMatch = html.match(/(\d+\.?\d*)\s*out of\s*5\s*star/i);
  if (ratingMatch) result.rating = ratingMatch[1];

  // Review count
  const reviewMatch = html.match(/(\d[\d,]*)\s*(?:global\s*)?rating/i);
  if (reviewMatch) result.reviewCount = reviewMatch[1];

  // Brand
  const brandMatch = html.match(/(?:id="bylineInfo"[^>]*>.*?|Visit the\s+)([^<]+?)\s*(?:Store|store)/i);
  if (brandMatch) result.brand = stripHtml(brandMatch[1]);
  if (!result.brand) {
    const brandAlt = html.match(/Brand<\/td>\s*<td[^>]*>\s*<span[^>]*>([^<]+)/i);
    if (brandAlt) result.brand = stripHtml(brandAlt[1]);
  }

  // Images from JavaScript data
  const imageDataMatch = html.match(/'colorImages'\s*:\s*\{\s*'initial'\s*:\s*(\[[\s\S]*?\])\s*\}/);
  if (imageDataMatch) {
    try {
      const imgArray = JSON.parse(imageDataMatch[1].replace(/'/g, '"'));
      result.imageUrls = imgArray
        .map(img => img.hiRes || img.large || img.main || '')
        .filter(url => url && url.startsWith('http'))
        .slice(0, 7);
    } catch (_) {}
  }
  if (!result.imageUrls.length) {
    const imgMatches = html.match(/https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%-]+\.jpg/g) || [];
    result.imageUrls = [...new Set(imgMatches)].slice(0, 7);
  }

  return result;
}

// POST /api/amazon/fetch-listing   body: { asin, market? }
app.post('/api/amazon/fetch-listing', async (req, res) => {
  const { asin, market } = req.body || {};
  if (!asin || !/^[A-Z0-9]{10}$/i.test(String(asin).trim())) {
    return res.status(400).json({ success: false, message: '无效的 ASIN' });
  }

  const cleanAsin = String(asin).trim().toUpperCase();
  const domain = AMAZON_DOMAINS[market] || AMAZON_DOMAINS.us;
  const url = `${domain}/dp/${cleanAsin}`;

  console.log(`[Amazon] Fetching: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`[Amazon] HTTP ${response.status} for ${cleanAsin}`);
      return res.json({
        success: false,
        message: `Amazon 返回 HTTP ${response.status}，可能需要验证码或该 ASIN 不存在`,
        listing: null,
      });
    }

    const html = await response.text();

    if (html.includes('captcha') || html.includes('Type the characters you see in this image')) {
      console.warn(`[Amazon] CAPTCHA triggered for ${cleanAsin}`);
      return res.json({
        success: false,
        message: 'Amazon 触发了验证码防护，请稍后重试或手动输入商品信息',
        listing: null,
      });
    }

    const listing = parseAmazonHtml(html);

    if (!listing.title) {
      return res.json({
        success: false,
        message: '未能解析到商品标题，该 ASIN 可能不存在或页面结构已变化',
        listing: null,
      });
    }

    console.log(`[Amazon] Parsed: "${listing.title.substring(0, 60)}..." | ${listing.bulletPoints.length} bullets | ${listing.imageUrls.length} images`);

    return res.json({
      success: true,
      listing: {
        asin: cleanAsin,
        url,
        ...listing,
      },
    });
  } catch (err) {
    console.error(`[Amazon] Fetch error for ${cleanAsin}:`, err.message);
    return res.json({
      success: false,
      message: `抓取失败: ${err.message}`,
      listing: null,
    });
  }
});

// 生产环境：托管前端打包后的静态文件
const distPath = join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production' && existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(distPath, 'index.html'));
    }
  });
  console.log('[Moly] 生产模式：已托管前端静态文件');
}

const server = app.listen(PORT, () => {
  console.log(`[Moly Auth] API running at http://localhost:${PORT}`);
  if (!SMTP_USER) {
    console.log('[Moly Auth] 未配置 SMTP，验证码将仅在接口响应中返回（devCode）');
  }
  console.log('[Moly Auth] 进程保持运行中，按 Ctrl+C 可停止');
});

// WebSocket：手机扫码上传完成通知
const wss = new WebSocketServer({ server, path: '/api/ws/upload' });
wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token') || '';
  if (!token) {
    ws.close(4000, 'missing token');
    return;
  }
  uploadWsClients.set(token, ws);
  ws.on('close', () => uploadWsClients.delete(token));
  ws.on('error', () => uploadWsClients.delete(token));
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Moly Auth] 端口 ${PORT} 已被占用，请关闭占用该端口的程序或设置 AUTH_PORT=其他端口 后重试`);
  } else {
    console.error('[Moly Auth] 启动失败:', err.message);
  }
  process.exit(1);
});
