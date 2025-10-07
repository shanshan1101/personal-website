// 全局变量
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-item');
const indicators = document.querySelectorAll('.indicator');
let aiChatHistory = [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 初始化应用
function initializeApp() {
    setupNavigation();
    setupCarousel();
    setupScrollEffects();
    setupContactForm();
    setupBackToTop();
    setupSmoothScrolling();
    setupAnimations();
}

// 导航栏功能
function setupNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');

    // 移动端菜单切换
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // 点击导航链接时关闭移动端菜单
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // 滚动时导航栏样式变化
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// 轮播功能
function setupCarousel() {
    // 自动轮播
    setInterval(() => {
        changeSlide(1);
    }, 5000);

    // 触摸支持
    let startX = 0;
    let endX = 0;
    const carousel = document.getElementById('carousel');

    carousel.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
    });

    carousel.addEventListener('touchend', function(e) {
        endX = e.changedTouches[0].clientX;
        handleSwipe();
    });

    function handleSwipe() {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                changeSlide(1); // 向左滑动，显示下一张
            } else {
                changeSlide(-1); // 向右滑动，显示上一张
            }
        }
    }
}

// 切换轮播图片
function changeSlide(direction) {
    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide += direction;

    if (currentSlide >= slides.length) {
        currentSlide = 0;
    } else if (currentSlide < 0) {
        currentSlide = slides.length - 1;
    }

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

// 跳转到指定轮播图片
function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    indicators[currentSlide].classList.remove('active');

    currentSlide = n - 1;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

// 滚动效果
function setupScrollEffects() {
    // 返回顶部按钮
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 平滑滚动
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70; // 考虑导航栏高度
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 联系表单
function setupContactForm() {
    const form = document.getElementById('contactForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        // 禁用提交按钮，防止重复提交
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';

        try {
            // 发送表单数据到服务器
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                showNotification('消息发送成功！我会尽快回复您。', 'success');
                form.reset();
            } else {
                showNotification(result.error || '消息发送失败，请稍后再试', 'error');
            }
        } catch (error) {
            console.error('表单提交错误:', error);
            showNotification('网络错误，请检查您的连接后再试', 'error');
        } finally {
            // 恢复按钮状态
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    });
}

// 通知功能
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 根据类型选择图标
    let iconClass = 'info-circle';
    if (type === 'success') {
        iconClass = 'check-circle';
    } else if (type === 'error') {
        iconClass = 'exclamation-circle';
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${iconClass}"></i>
            <span>${message}</span>
        </div>
    `;

    // 添加通知样式
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 返回顶部按钮
function setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 动画效果
function setupAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);

    // 观察需要动画的元素
    document.querySelectorAll('.about, .portfolio, .contact, .gallery').forEach(el => {
        observer.observe(el);
    });
}

// AI助手功能
function openAIAssistant() {
    const aiModal = document.getElementById('aiModal');
    if (aiModal) {
        aiModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // 防止背景滚动
        setTimeout(() => {
            document.getElementById('aiInput').focus();
        }, 300);
    }
}

function closeAIAssistant() {
    const aiModal = document.getElementById('aiModal');
    if (aiModal) {
        aiModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // 恢复背景滚动
    }
}



async function sendAIMessage() {
    const input = document.getElementById('aiInput');
    const message = input.value.trim();
    
    if (!message) return;

    // 添加用户消息
    addMessageToChat(message, 'user');
    input.value = '';

    // 显示加载动画
    showTypingIndicator();
    
    // 特定问题的预设回复
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('冯珊珊是谁') || lowerMessage.includes('冯珊珊是誰')) {
        setTimeout(() => {
            hideTypingIndicator();
            addMessageToChat('冯珊珊是一个美丽善良正直勇敢的女孩儿。', 'ai');
        }, 300);
        return;
    } else if (lowerMessage.includes('你是谁') || lowerMessage.includes('你是誰')) {
        setTimeout(() => {
            hideTypingIndicator();
            addMessageToChat('我是珊珊的小助手。', 'ai');
        }, 300);
        return;
    }
    
    // 通过后端API调用AI服务
    try {
        console.log('正在通过后端API调用AI服务...');
        
        // 构建请求参数
        const requestData = {
            messages: [
                { role: 'system', content: '你是一个友好的中文AI助手，回答简洁、有帮助。' },
                { role: 'user', content: message }
            ]
        };
        
        // 发送API请求到后端
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('后端API响应状态码:', res.status);
        const data = await res.json();
        console.log('后端API响应数据:', data);
        
        hideTypingIndicator();

        if (res.ok && data && data.reply) {
            // 成功获取AI回复
            addMessageToChat(data.reply, 'ai');
        } else {
            // API返回错误
            console.warn('AI API返回错误:', data?.error || '未知错误');
            let errorMessage = 'AI服务暂时不可用';
            
            // 根据错误码提供更具体的提示
            if (res.status === 401) {
                errorMessage = '未授权，请检查API Key是否正确';
            } else if (res.status === 429) {
                errorMessage = '请求过于频繁，请稍后再试';
            } else if (res.status === 500) {
                errorMessage = '服务器内部错误，请稍后再试';
            } else if (data?.error) {
                errorMessage = data.error;
            }
            
            addMessageToChat(`⚠️ ${errorMessage}`, 'system');
        }
    } catch (err) {
        console.error('AI 请求失败:', err);
        hideTypingIndicator();
        // 网络异常或其他错误
        addMessageToChat(`⚠️ 网络连接异常: ${err.message || '无法连接到AI服务器'}`, 'system');
    }
}

function addMessageToChat(message, sender) {
    const chat = document.getElementById('aiChat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${sender}-message`;
    
    if (sender === 'system') {
        messageDiv.innerHTML = `
            <div class="system-message-content">
                <p>${message}</p>
            </div>
        `;
    } else {
        const avatar = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
        const avatarClass = sender === 'user' ? 'user-avatar' : 'ai-avatar';
        
        messageDiv.innerHTML = `
            <div class="${avatarClass}">
                <i class="${avatar}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
    }

    chat.appendChild(messageDiv);
    chat.scrollTop = chat.scrollHeight;

    // 保存到历史记录
    aiChatHistory.push({ sender, message, timestamp: new Date() });
}

function showTypingIndicator() {
    const chat = document.getElementById('aiChat');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="ai-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    // 添加打字动画样式
    const style = document.createElement('style');
    style.textContent = `
        .typing-dots {
            display: flex;
            gap: 4px;
            padding: 8px 0;
        }
        .typing-dots span {
            width: 8px;
            height: 8px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }
        .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    chat.appendChild(typingDiv);
    chat.scrollTop = chat.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function handleAIKeyPress(event) {
    if (event.key === 'Enter') {
        sendAIMessage();
    }
}

function clearAIChat() {
    const chat = document.getElementById('aiChat');
    const messages = chat.querySelectorAll('.ai-message, .user-message');
    messages.forEach(msg => msg.remove());
    
    // 添加欢迎消息
    addMessageToChat('对话历史已清空。有什么可以帮助您的吗？', 'ai');
    aiChatHistory = [];
}

function exportAIChat() {
    if (aiChatHistory.length === 0) {
        showNotification('暂无对话记录可导出', 'info');
        return;
    }

    let exportText = 'AI对话记录\n';
    exportText += '导出时间: ' + new Date().toLocaleString() + '\n\n';
    
    aiChatHistory.forEach(entry => {
        const sender = entry.sender === 'user' ? '用户' : 'AI助手';
        const time = entry.timestamp.toLocaleTimeString();
        exportText += `[${time}] ${sender}: ${entry.message}\n`;
    });

    // 创建下载链接
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('对话记录已导出', 'success');
}

// 模态框功能
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    if (e.target.classList.contains('ai-modal')) {
        closeAIAssistant();
    }
});

// 键盘事件
document.addEventListener('keydown', function(e) {
    // ESC键关闭模态框
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active, .ai-modal.active').forEach(modal => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
});

// 页面加载动画
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // 添加加载完成样式
    const style = document.createElement('style');
    style.textContent = `
        body {
            opacity: 0;
            transition: opacity 0.5s ease;
        }
        body.loaded {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
});

// 性能优化：防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化滚动事件
const optimizedScrollHandler = debounce(function() {
    // 滚动相关的处理逻辑
}, 16); // 约60fps

window.addEventListener('scroll', optimizedScrollHandler);

// 错误处理
window.addEventListener('error', function(e) {
    console.error('页面错误:', e.error);
    showNotification('页面出现错误，请刷新重试', 'error');
});

// 网络状态检测
window.addEventListener('online', function() {
    showNotification('网络连接已恢复', 'success');
});

window.addEventListener('offline', function() {
    showNotification('网络连接已断开', 'error');
});

