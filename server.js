const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { OpenAI } = require('openai');
const nodemailer = require('nodemailer');

// 初始化fetch - 采用兼容多种Node.js版本的健壮方案
let fetch;
try {
  // 方案2: 优先使用Node.js 18+内置的fetch (无需额外依赖)
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
    console.log('使用Node.js内置fetch');
  } else {
    // 方案1: 尝试使用node-fetch包 (兼容老版本Node)
    // 注意: node-fetch v3+是ESM模块，在CommonJS中需要特殊处理
    try {
      // 尝试动态导入
      const nodeFetch = require('node-fetch');
      fetch = nodeFetch.default || nodeFetch;
      console.log('使用node-fetch包');
    } catch (esmError) {
      // 如果动态导入失败，尝试降级方案
      console.warn('node-fetch导入失败，尝试使用替代方案:', esmError.message);
      
      // 创建一个简单的模拟fetch函数作为最后的fallback
      fetch = async (url, options = {}) => {
        return {
          ok: false,
          status: 500,
          json: () => Promise.resolve({
            error: 'Fetch不可用，请确保Node.js版本≥18或安装了兼容的fetch库',
            suggestion: 'npm install node-fetch@2 或升级Node.js到18+版本'
          })
        };
      };
    }
  }
} catch (error) {
  console.error('初始化fetch时发生严重错误:', error);
  // 确保即使在极端情况下fetch也有定义
  fetch = async () => ({
    ok: false,
    status: 500,
    json: () => Promise.resolve({ error: '系统内部错误' })
  });
}

dotenv.config();

const app = express();
const port = process.env.PORT || 8787;
const allowedOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '1mb' }));

// 静态站点 - 为不同目录设置明确的静态文件服务
// 主目录
app.use(express.static(path.join(__dirname)));
// 专门为图片目录设置静态文件服务，确保在各种部署环境中都能正确访问
app.use('/images_shanshan', express.static(path.join(__dirname, 'images_shanshan')));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Chat API - 使用 OpenAI Chat Completions
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 不能为空' });
    }

    // 优先使用智谱AI，如未配置则回退到 OpenAI
    const zhipuKey = process.env.ZHIPU_API_KEY;
    if (zhipuKey) {
      console.log('尝试调用智谱AI服务');
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

        console.log('智谱AI响应状态码:', response.status);
        const data = await response.json();
        console.log('智谱AI响应数据:', data);
        
        if (!response.ok) {
          console.error('智谱AI调用失败:', data?.error || '未知错误');
          return res.status(response.status).json({ 
            error: data?.error || 'Zhipu 调用失败',
            status: response.status,
            debugInfo: data
          });
        }
        
        const content = data?.choices?.[0]?.message?.content || '';
        console.log('智谱AI回复内容:', content);
        return res.json({ reply: content });
      } catch (zhipuError) {
        console.error('智谱AI请求异常:', zhipuError.message);
        return res.status(500).json({
          error: '智谱AI服务调用异常',
          details: zhipuError.message
        });
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '未配置 ZHIPU_API_KEY 或 OPENAI_API_KEY' });
    }

    const client = new OpenAI({ apiKey });

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
    res.status(500).json({ error: 'AI 服务异常' });
  }
});

// 创建邮件发送 transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // QQ邮箱465端口需要启用SSL
  secureConnection: true, // 启用安全连接
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    ciphers: 'SSLv3', // 解决某些安全协议问题
    rejectUnauthorized: false // 对于自签名证书，可能需要设置为false
  },
  connectionTimeout: 10000, // 10秒连接超时
  greetingTimeout: 5000, // 5秒问候超时
  socketTimeout: 20000, // 20秒套接字超时
  debug: true // 启用调试信息输出
});

// 测试邮件发送的端点
app.get('/api/test-email', async (req, res) => {
  try {
    console.log('测试邮件发送开始...');
    console.log('SMTP配置:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER
    });

    const testMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: '测试邮件 - 服务器配置测试',
      text: '这是一封测试邮件，用于验证服务器的邮件发送功能是否正常工作。',
      html: '<p>这是一封测试邮件，用于验证服务器的邮件发送功能是否正常工作。</p>'
    };

    // 发送测试邮件
    const info = await transporter.sendMail(testMailOptions);
    console.log('测试邮件发送成功:', info.messageId);
    res.json({ success: true, message: '测试邮件发送成功！', messageId: info.messageId });
  } catch (error) {
    console.error('测试邮件发送失败:', error);
    res.status(500).json({
      error: '测试邮件发送失败',
      details: error.message,
      code: error.code
    });
  }
});

// 联系表单提交API
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // 验证表单数据
    if (!name || !email || !message) {
      return res.status(400).json({ error: '所有字段都是必需的' });
    }

    // 准备邮件选项
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

    // 发送邮件
    await transporter.sendMail(mailOptions);
    
    // 也发送确认邮件给发件人
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
    res.status(500).json({ error: '消息发送失败，请稍后再试' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


