const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');
const nodemailer = require('nodemailer');

// 初始化fetch
let fetch;
try {
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
    console.log('使用Node.js内置fetch');
  } else {
    try {
      const nodeFetch = require('node-fetch');
      fetch = nodeFetch.default || nodeFetch;
      console.log('使用node-fetch包');
    } catch (esmError) {
      console.warn('node-fetch导入失败，尝试使用替代方案:', esmError.message);
      fetch = async (url, options = {}) => ({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: 'Fetch不可用，请确保Node.js版本≥18或安装了兼容的fetch库',
          suggestion: 'npm install node-fetch@2 或升级Node.js到18+版本'
        })
      });
    }
  }
} catch (error) {
  console.error('初始化fetch时发生严重错误:', error);
  fetch = async () => ({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ error: '系统内部错误' })
  });
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 配置CORS - 特别处理Vercel部署的跨域问题
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  // 添加你的Vercel前端域名
  `https://${process.env.VERCEL_PROJECT_SLUG}.vercel.app`,
  `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 
    ? (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
          callback(null, true);
        } else {
          callback(new Error('不允许的跨域请求'));
        }
      }
    : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 处理预检请求
app.options('*', cors());

app.use(express.json({ limit: '1mb' }));

// 静态文件服务 - 仅在开发环境需要
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname)));
  app.use('/images_shanshan', express.static(path.join(__dirname, 'images_shanshan')));
}

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Chat API - 使用中间层转发请求
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 不能为空' });
    }

    // 优先使用智谱AI
    const zhipuKey = process.env.ZHIPU_API_KEY;
    if (zhipuKey) {
      console.log('调用智谱AI服务');
      try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zhipuKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: process.env.ZHIPU_MODEL || 'glm-4.6',
            messages,
            temperature: 0.6,
            max_tokens: 1024
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('智谱AI调用失败:', data);
          return res.status(response.status).json({ 
            error: data?.error || 'Zhipu 调用失败',
            status: response.status
          });
        }
        
        const content = data?.choices?.[0]?.message?.content || '';
        return res.json({ reply: content });
      } catch (zhipuError) {
        console.error('智谱AI请求异常:', zhipuError);
        return res.status(500).json({
          error: '智谱AI服务调用异常',
          details: process.env.NODE_ENV === 'development' ? zhipuError.message : undefined
        });
      }
    }

    // 回退到OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: '未配置 AI API 密钥' });
    }

    const client = new OpenAI({ apiKey: openaiKey });

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 400,
    });

    const content = completion.choices?.[0]?.message?.content || '';
    res.json({ reply: content });
  } catch (err) {
    console.error('Chat API error:', err);
    res.status(500).json({ 
      error: 'AI 服务异常',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 邮件发送配置
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production' // 生产环境严格验证
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 20000,
  debug: process.env.NODE_ENV !== 'production'
});

// 测试邮件接口
app.get('/api/test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: '生产环境禁用此接口' });
  }
  
  try {
    const testMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: '测试邮件 - 服务器配置测试',
      text: '这是一封测试邮件，用于验证服务器的邮件发送功能是否正常工作。',
      html: '<p>这是一封测试邮件，用于验证服务器的邮件发送功能是否正常工作。</p>'
    };

    const info = await transporter.sendMail(testMailOptions);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    res.status(500).json({
      error: '测试邮件发送失败',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
});

// 联系表单提交接口
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: '所有字段都是必需的' });
    }

    // 发送给接收者
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: `来自${name}的新消息`,
      html: `
        <h3>新的联系消息</h3>
        <p><strong>发件人:</strong> ${name}</p>
        <p><strong>邮箱:</strong> ${email}</p>
        <p><strong>消息:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    
    // 发送确认邮件给发件人
    const confirmationMailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: '感谢您的联系',
      html: `
        <h3>感谢您的留言，${name}！</h3>
        <p>我已收到您的消息，会尽快回复您。</p>
        <p>您的消息内容:</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p>此致<br>冯珊珊</p>
      `
    };

    await transporter.sendMail(confirmationMailOptions);

    res.json({ success: true, message: '消息发送成功！' });
  } catch (error) {
    console.error('邮件发送失败:', error);
    res.status(500).json({ 
      error: '消息发送失败，请稍后再试',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Vercel要求的导出
module.exports = app;