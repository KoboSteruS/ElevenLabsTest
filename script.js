/**
 * AI Тренер - Демо версия
 * Интеграция с ElevenLabs Conversation API
 * Обновлено согласно официальной документации
 */

// Конфигурация
const CONFIG = {
    // Ваш Agent ID из ElevenLabs
    AGENT_ID: 'agent_8301k4me43j7ftqa21d4rv7d15m6',
    
    // API ключ ElevenLabs (получите на https://elevenlabs.io/app/settings/api-keys)
    API_KEY: 'YOUR_API_KEY_HERE',
    
    // Сценарии тренировок
    SCENARIOS: {
        sales: {
            name: 'Продажи - Работа с возражениями',
            prompt: 'Ты опытный клиент, который сомневается в покупке. Задавай вопросы о цене, качестве, сроках. Будь реалистичным, но не слишком агрессивным.'
        },
        support: {
            name: 'Поддержка - Решение проблем клиента',
            prompt: 'Ты клиент с технической проблемой. Опиши проблему, задавай уточняющие вопросы, будь терпеливым но настойчивым в решении.'
        },
        negotiation: {
            name: 'Переговоры - Заключение сделки',
            prompt: 'Ты представитель компании-партнера. Обсуждай условия сотрудничества, цены, сроки. Будь профессиональным но жестким в переговорах.'
        }
    }
};

// Глобальные переменные
let conversation = null;
let isRecording = false;
let startTime = null;

// DOM элементы
const elements = {
    startBtn: document.getElementById('startTrainingBtn'),
    stopBtn: document.getElementById('stopTrainingBtn'),
    statusIndicator: document.getElementById('statusIndicator'),
    statusText: document.getElementById('statusText'),
    statusDot: document.querySelector('.status-dot'),
    scenarioSelect: document.getElementById('scenarioSelect'),
    logContent: document.getElementById('logContent'),
    clearLogBtn: document.getElementById('clearLogBtn')
};

/**
 * Инициализация приложения
 */
function init() {
    console.log('🚀 Инициализация AI Тренера...');
    
    // Обработчики событий
    elements.startBtn.addEventListener('click', startTraining);
    elements.stopBtn.addEventListener('click', stopTraining);
    elements.clearLogBtn.addEventListener('click', clearLog);
    elements.scenarioSelect.addEventListener('change', onScenarioChange);
    
    // Проверка поддержки браузера
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showNotification('Ваш браузер не поддерживает доступ к микрофону', 'error');
        elements.startBtn.disabled = true;
        return;
    }
    
    // Проверка конфигурации
    if (CONFIG.AGENT_ID === 'YOUR_AGENT_ID_HERE') {
        showNotification('Необходимо настроить Agent ID в конфигурации', 'warning');
        addLogMessage('system', '⚠️ Для работы необходимо настроить Agent ID в файле script.js');
    }
    
    updateStatus('Готов к работе', 'ready');
    console.log('✅ Инициализация завершена');
}

/**
 * Начало тренировки
 */
async function startTraining() {
    try {
        console.log('🎤 Начало тренировки...');
        
        // Проверка конфигурации
        if (CONFIG.AGENT_ID === 'YOUR_AGENT_ID_HERE') {
            showNotification('Настройте Agent ID для начала работы', 'error');
            return;
        }
        
        updateStatus('Подключение к AI...', 'connecting');
        elements.startBtn.disabled = true;
        
        // Запрос доступа к микрофону
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
        
        console.log('✅ Доступ к микрофону получен');
        
        // Инициализация ElevenLabs Conversation
        await initElevenLabsConversation();
        
        // Обновление UI
        updateStatus('Тренировка активна', 'recording');
        elements.stopBtn.disabled = false;
        startTime = new Date();
        
        addLogMessage('system', '🎯 Тренировка начата! Говорите с AI-тренером');
        showNotification('Тренировка начата! Говорите с AI-тренером', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка при начале тренировки:', error);
        handleError(error);
    }
}

/**
 * Инициализация ElevenLabs Conversation
 * Согласно официальной документации
 */
async function initElevenLabsConversation() {
    try {
        // Импорт ElevenLabs SDK
        const { Conversation } = await import('https://cdn.skypack.dev/@elevenlabs/client');
        
        console.log('🔧 Инициализация ElevenLabs...');
        console.log('Agent ID:', CONFIG.AGENT_ID);
        console.log('API Key:', CONFIG.API_KEY ? 'Установлен' : 'Не установлен');
        
        // Конфигурация сессии согласно документации
        const sessionConfig = {
            agentId: CONFIG.AGENT_ID,
            onConnect: () => {
                console.log('✅ WebSocket подключение установлено');
                addLogMessage('system', '🔗 Подключение к AI установлено');
            },
            onDisconnect: () => {
                console.log('❌ WebSocket подключение разорвано');
                addLogMessage('system', '🔌 Подключение к AI разорвано');
            },
            onMessage: (message) => {
                console.log('🤖 Получено сообщение:', message);
                // Обрабатываем разные типы сообщений
                if (typeof message === 'string') {
                    addLogMessage('ai', message);
                } else if (message.text) {
                    addLogMessage('ai', message.text);
                } else if (message.transcript) {
                    addLogMessage('user', message.transcript);
                }
            },
            onStatusChange: (status) => {
                console.log('📊 Статус изменился:', status);
                handleStatusChange(status);
            },
            onModeChange: (mode) => {
                console.log('🔄 Режим изменился:', mode);
                addLogMessage('system', `🔄 Режим: ${mode}`);
            },
            onError: (error) => {
                console.error('❌ Ошибка ElevenLabs:', error);
                handleElevenLabsError(error);
            }
        };
        
        // Запуск сессии согласно документации
        console.log('🚀 Запуск сессии...');
        conversation = await Conversation.startSession(sessionConfig);
        console.log('✅ ElevenLabs сессия успешно запущена');
        
        // Получаем ID сессии
        const sessionId = conversation.getId();
        console.log('🆔 ID сессии:', sessionId);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации ElevenLabs:', error);
        console.error('Тип ошибки:', error.constructor.name);
        console.error('Детали ошибки:', {
            message: error.message,
            code: error.code,
            type: error.type,
            wasClean: error.wasClean
        });
        
        // Детальная диагностика ошибки
        const errorMessage = error.message || error.toString() || 'Неизвестная ошибка';
        const errorCode = error.code;
        
        // Обработка CloseEvent (WebSocket закрыт)
        if (error.type === 'close' || errorCode === 1006) {
            throw new Error('WebSocket соединение закрыто. Возможные причины: неверный Agent ID, проблемы с сетью, или агент недоступен. Проверьте Agent ID и интернет-соединение.');
        }
        
        // Обработка других типов ошибок
        if (errorMessage.includes && errorMessage.includes('WebSocket')) {
            throw new Error('Ошибка WebSocket подключения. Проверьте интернет-соединение.');
        } else if (errorMessage.includes && errorMessage.includes('microphone')) {
            throw new Error('Ошибка доступа к микрофону. Разрешите доступ к микрофону.');
        } else if (errorMessage.includes && errorMessage.includes('agent')) {
            throw new Error('Ошибка агента. Проверьте Agent ID.');
        } else {
            throw new Error(`Ошибка подключения: ${errorMessage} (код: ${errorCode || 'N/A'})`);
        }
    }
}

/**
 * Получение подписанного URL от ElevenLabs
 */
async function getSignedUrl() {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation/get-signed-url', {
        method: 'POST',
        headers: {
            'xi-api-key': CONFIG.API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            agent_id: CONFIG.AGENT_ID
        })
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.signed_url;
}

/**
 * Обработка изменения статуса
 */
function handleStatusChange(status) {
    const statusMessages = {
        'listening': 'Слушаю...',
        'speaking': 'AI говорит...',
        'thinking': 'AI думает...',
        'idle': 'Ожидание...'
    };
    
    const message = statusMessages[status] || status;
    addLogMessage('system', `📊 Статус: ${message}`);
}

/**
 * Обработка ошибок ElevenLabs
 */
function handleElevenLabsError(error) {
    addLogMessage('system', `❌ Ошибка AI: ${error.message || error}`);
    showNotification('Ошибка подключения к AI', 'error');
}

/**
 * Завершение тренировки
 */
async function stopTraining() {
    try {
        console.log('⏹️ Завершение тренировки...');
        
        if (conversation) {
            // Завершаем сессию согласно документации
            await conversation.endSession();
            conversation = null;
            console.log('✅ Сессия завершена');
        }
        
        // Обновление UI
        updateStatus('Тренировка завершена', 'ready');
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
        
        // Подсчет времени
        if (startTime) {
            const duration = Math.round((new Date() - startTime) / 1000);
            addLogMessage('system', `⏱️ Тренировка завершена. Длительность: ${duration} сек.`);
        }
        
        showNotification('Тренировка завершена', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка при завершении тренировки:', error);
        handleError(error);
    }
}

/**
 * Обработка ошибок
 */
function handleError(error) {
    console.error('❌ Ошибка:', error);
    
    let message = 'Произошла ошибка';
    if (error.name === 'NotAllowedError') {
        message = 'Доступ к микрофону запрещен';
    } else if (error.name === 'NotFoundError') {
        message = 'Микрофон не найден';
    } else if (error.message) {
        message = error.message;
    }
    
    addLogMessage('system', `❌ ${message}`);
    showNotification(message, 'error');
    
    // Сброс состояния
    updateStatus('Ошибка', 'ready');
    elements.startBtn.disabled = false;
    elements.stopBtn.disabled = true;
}

/**
 * Обновление статуса
 */
function updateStatus(text, type = 'ready') {
    elements.statusText.textContent = text;
    elements.statusDot.className = 'status-dot';
    
    if (type === 'recording') {
        elements.statusDot.classList.add('recording');
    } else if (type === 'connecting') {
        elements.statusDot.classList.add('connecting');
    }
}

/**
 * Добавление сообщения в лог
 */
function addLogMessage(type, message) {
    const timestamp = new Date().toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const messageElement = document.createElement('div');
    messageElement.className = `log-message ${type}`;
    messageElement.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="message">${message}</span>
    `;
    
    elements.logContent.appendChild(messageElement);
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
}

/**
 * Очистка лога
 */
function clearLog() {
    elements.logContent.innerHTML = `
        <div class="log-message system">
            <span class="timestamp">[${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
            <span class="message">Лог очищен</span>
        </div>
    `;
}

/**
 * Изменение сценария
 */
function onScenarioChange() {
    const selectedScenario = elements.scenarioSelect.value;
    const scenario = CONFIG.SCENARIOS[selectedScenario];
    
    if (scenario) {
        addLogMessage('system', `📋 Выбран сценарий: ${scenario.name}`);
        console.log('📋 Сценарий изменен:', scenario.name);
    }
}

/**
 * Показ уведомления
 */
function showNotification(message, type = 'info') {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Автоматическое удаление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

/**
 * Демо-режим (если ElevenLabs недоступен)
 */
function enableDemoMode() {
    console.log('🎭 Включен демо-режим');
    
    // Переопределяем функции для демо
    window.startTraining = async function() {
        updateStatus('Демо-режим активен', 'recording');
        elements.startBtn.disabled = true;
        elements.stopBtn.disabled = false;
        
        addLogMessage('system', '🎭 Демо-режим: Имитация тренировки');
        addLogMessage('ai', 'Привет! Я AI-тренер. Как дела?');
        
        // Имитация диалога
        setTimeout(() => {
            addLogMessage('user', 'Привет! Хочу потренироваться в продажах');
        }, 2000);
        
        setTimeout(() => {
            addLogMessage('ai', 'Отлично! Я буду играть роль сомневающегося клиента. Начнем?');
        }, 4000);
        
        showNotification('Демо-режим активен', 'warning');
    };
    
    window.stopTraining = function() {
        updateStatus('Демо завершен', 'ready');
        elements.startBtn.disabled = false;
        elements.stopBtn.disabled = true;
        addLogMessage('system', '🎭 Демо-режим завершен');
        showNotification('Демо завершен', 'success');
    };
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', init);

// Экспорт для глобального доступа
window.AITrainer = {
    startTraining,
    stopTraining,
    clearLog,
    showNotification,
    enableDemoMode
};
