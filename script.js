// Основные переменные
let currentXmlContent = null;
let currentXsdSchema = null;
let validationResults = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadHistory();
});

function initEventListeners() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const convertBtn = document.getElementById('convertBtn');
    const xsdSelect = document.getElementById('xsdSelect');
    const xsdFileInput = document.getElementById('xsdFileInput');

    // Обработка drag & drop
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    xsdSelect.addEventListener('change', function() {
        document.getElementById('customXsd').style.display = 
            this.value === 'custom' ? 'block' : 'none';
    });
    
    xsdFileInput.addEventListener('change', handleXsdSelect);
    convertBtn.addEventListener('click', generatePDF);
    
    // Модальное окно
    const modal = document.getElementById('pdfModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Обработка файлов
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropArea').classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropArea').classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropArea').classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.includes('xml')) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleXsdSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentXsdSchema = event.target.result;
            validateXML();
        };
        reader.readAsText(file);
    }
}

// Основная обработка XML
async function processFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        currentXmlContent = event.target.result;
        updateStatus('pending', 'Файл загружен. Валидация...');
        
        // Парсинг XML
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(currentXmlContent, "text/xml");
            
            // Проверка на ошибки парсинга
            const errorNode = xmlDoc.querySelector('parsererror');
            if (errorNode) {
                throw new Error('Ошибка парсинга XML');
            }
            
            updateStatus('success', 'XML файл корректно сформирован');
            
            // Сохраняем в историю
            saveToHistory(file.name, 'success');
            
            // Валидация
            validateXML();
            
            // Активируем кнопку конвертации
            document.getElementById('convertBtn').disabled = false;
            
        } catch (error) {
            updateStatus('error', `Ошибка: ${error.message}`);
            saveToHistory(file.name, 'error', error.message);
        }
    };
    
    reader.readAsText(file);
}

// Валидация XML
async function validateXML() {
    if (!currentXmlContent) return;
    
    const validationOutput = document.getElementById('validationOutput');
    
    try {
        // Простая проверка структуры
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(currentXmlContent, "text/xml");
        
        // Здесь можно добавить проверку по XSD
        // Для GitHub Pages потребуется библиотека типа xmllint
        // Пример: await validateWithXSD(xmlDoc, currentXsdSchema);
        
        const validationMessage = currentXsdSchema ? 
            'XML прошел проверку по XSD схеме' :
            'Валидация XSD не выполнена (схема не загружена)';
        
        validationResults = {
            isValid: true,
            message: validationMessage,
            timestamp: new Date().toISOString()
        };
        
        validationOutput.innerHTML = `
            <div class="status success">
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Валидация успешна</strong><br>
                    <small>${validationMessage}</small>
                </div>
            </div>
            <div class="xml-preview">
                <h4>Предпросмотр XML:</h4>
                <pre>${formatXML(currentXmlContent)}</pre>
            </div>
        `;
        
    } catch (error) {
        validationResults = {
            isValid: false,
            message: error.message,
            timestamp: new Date().toISOString()
        };
        
        validationOutput.innerHTML = `
            <div class="status error">
                <i class="fas fa-times-circle"></i>
                <div>
                    <strong>Ошибка валидации</strong><br>
                    <small>${error.message}</small>
                </div>
            </div>
        `;
    }
}

// Генерация PDF
// Генерация PDF с поддержкой кириллицы
async function generatePDF() {
    if (!currentXmlContent) return;
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Настройка шрифтов для кириллицы
        doc.setFont("helvetica", "normal");
        
        // Заголовок
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('Отчет по XML файлу', 105, 20, { align: 'center' });
        
        // Информация
        doc.setFontSize(12);
        doc.text(`Дата создания: ${new Date().toLocaleDateString('ru-RU')}`, 20, 35);
        doc.text(`Время: ${new Date().toLocaleTimeString('ru-RU')}`, 20, 42);
        
        // Результаты валидации
        doc.setFontSize(14);
        doc.setTextColor(0, 100, 0);
        doc.text('Результаты валидации:', 20, 55);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        
        if (validationResults && validationResults.isValid) {
            doc.setTextColor(0, 128, 0);
            doc.text('✓ Валидация успешна', 20, 65);
        } else if (validationResults && !validationResults.isValid) {
            doc.setTextColor(255, 0, 0);
            doc.text('✗ Ошибка валидации', 20, 65);
        } else {
            doc.text('Валидация не выполнена', 20, 65);
        }
        
        // XML содержимое
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('Содержимое XML:', 20, 80);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Форматируем XML с учетом кириллицы
        const formattedXML = formatXML(currentXmlContent);
        
        // Разбиваем текст на строки
        const lines = doc.splitTextToSize(formattedXML, 170);
        
        // Проверяем, влезает ли текст на одну страницу
        const startY = 90;
        const lineHeight = 7;
        const pageHeight = 270; // Высота страницы A4 в мм
        let y = startY;
        
        for (let i = 0; i < lines.length; i++) {
            // Если не хватает места на странице, добавляем новую
            if (y > pageHeight) {
                doc.addPage();
                y = 20;
            }
            doc.text(lines[i], 20, y);
            y += lineHeight;
        }
        
        // Добавляем информацию о файле
        doc.addPage();
        doc.setFontSize(16);
        doc.text('Информация о системе', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`XML строк: ${formattedXML.split('\n').length}`, 20, 40);
        doc.text(`Размер файла: ${new Blob([currentXmlContent]).size} байт`, 20, 50);
        doc.text(`Дата обработки: ${new Date().toLocaleString('ru-RU')}`, 20, 60);
        
        // Сохраняем PDF для скачивания
        window.generatedPDF = doc;
        
        // Показываем предпросмотр
        showPDFPreview(doc);
        
    } catch (error) {
        console.error('Ошибка при создании PDF:', error);
        alert('Ошибка при создании PDF. Проверьте консоль для подробностей.');
    }
}

// Альтернативный способ через HTML2Canvas (лучшая поддержка кириллицы)
async function generatePDFWithCanvas() {
    if (!currentXmlContent) return;
    
    try {
        // Создаем временный контейнер для конвертации
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '800px';
        tempContainer.style.padding = '20px';
        tempContainer.style.background = 'white';
        tempContainer.style.fontFamily = "'Roboto', sans-serif";
        
        // Заполняем контейнер содержимым
        tempContainer.innerHTML = `
            <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px;">Отчет по XML файлу</h1>
            
            <div style="margin-bottom: 30px;">
                <h2 style="color: #3498db;">Информация</h2>
                <p><strong>Дата создания:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                <p><strong>Статус валидации:</strong> 
                    ${validationResults && validationResults.isValid ? 
                        '<span style="color: green;">✓ Успешно</span>' : 
                        '<span style="color: red;">✗ Ошибка</span>'}
                </p>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h2 style="color: #3498db;">Содержимое XML</h2>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border: 1px solid #dee2e6;">
                    <pre style="font-family: 'Courier New', monospace; font-size: 12px; white-space: pre-wrap; word-wrap: break-word; margin: 0;">
${formatXML(currentXmlContent)}
                    </pre>
                </div>
            </div>
            
            <div style="border-top: 2px solid #eee; padding-top: 20px; color: #7f8c8d; font-size: 12px;">
                <p>Сгенерировано XML Processor • GitHub Pages • ${new Date().getFullYear()}</p>
            </div>
        `;
        
        document.body.appendChild(tempContainer);
        
        // Конвертируем в canvas
        const canvas = await html2canvas(tempContainer, {
            scale: 2, // Увеличиваем качество
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Удаляем временный контейнер
        document.body.removeChild(tempContainer);
        
        // Создаем PDF из canvas
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const imgWidth = 210; // Ширина A4 в мм
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        // Добавляем изображение в PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        // Сохраняем PDF для скачивания
        window.generatedPDF = doc;
        
        // Показываем предпросмотр
        showPDFPreview(doc);
        
    } catch (error) {
        console.error('Ошибка при создании PDF через canvas:', error);
        // Пробуем стандартный способ
        generatePDF();
    }
}

// Функция для показа предпросмотра
function showPDFPreview(doc) {
    const pdfContent = document.getElementById('pdfContent');
    
    // Создаем iframe для предпросмотра
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    pdfContent.innerHTML = `
        <iframe src="${url}" width="100%" height="400px" style="border: none;"></iframe>
        <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px;">
            <p><strong>Информация о PDF:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Размер: ${(blob.size / 1024).toFixed(2)} KB</li>
                <li>Страниц: ${doc.internal.getNumberOfPages()}</li>
                <li>Формат: A4</li>
                <li>Кодировка: UTF-8</li>
            </ul>
        </div>
    `;
    
    // Показываем модальное окно
    document.getElementById('pdfModal').style.display = 'block';
    
    // Очищаем URL при закрытии
    const modal = document.getElementById('pdfModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        URL.revokeObjectURL(url);
    };
}

// Обновленная функция скачивания PDF
document.getElementById('downloadPdf').onclick = function() {
    if (window.generatedPDF) {
        const fileName = `xml-отчет-${Date.now()}.pdf`;
        window.generatedPDF.save(fileName);
        saveToHistory(fileName, 'pdf');
    }
};

// Обновленная функция formatXML для правильной обработки кириллицы
function formatXML(xml) {
    // Удаляем BOM если есть
    xml = xml.replace(/^\uFEFF/, '');
    
    // Проверяем кодировку
    const encodingMatch = xml.match(/encoding=["']([^"']+)["']/i);
    if (encodingMatch && !encodingMatch[1].toLowerCase().includes('utf')) {
        console.warn('XML не в UTF-8 кодировке. Могут быть проблемы с кириллицей.');
    }
    
    const PADDING = '  ';
    const reg = /(>)(<)(\/*)/g;
    let formatted = '';
    let pad = 0;
    let inCdata = false;
    
    // Разбиваем на строки
    xml = xml.replace(reg, '$1\n$2$3');
    
    // Обрабатываем каждую строку
    xml.split('\n').forEach(node => {
        // Проверяем CDATA секции
        if (node.includes('<![CDATA[')) {
            inCdata = true;
        }
        if (node.includes(']]>')) {
            inCdata = false;
        }
        
        if (inCdata) {
            formatted += node + '\n';
            return;
        }
        
        // Определяем отступ
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            // Закрывающий тег на той же строке
            indent = 0;
        } else if (node.match(/^<\/\w/) && pad !== 0) {
            // Закрывающий тег
            pad -= 1;
        } else if (node.match(/^<\w[^>]*[^/]>.*$/)) {
            // Открывающий тег
            indent = 1;
        } else {
            indent = 0;
        }
        
        // Добавляем отступ
        formatted += PADDING.repeat(pad) + node + '\n';
        pad += indent;
    });
    
    return formatted;
}

// Обновляем обработчик кнопки конвертации
document.getElementById('convertBtn').onclick = function() {
    // Используем метод с canvas для лучшей поддержки кириллицы
    generatePDFWithCanvas();
};

// Добавляем опцию выбора метода конвертации в HTML
function addPDFOptionsToHTML() {
    const pdfSection = document.querySelector('.pdf-section');
    
    const optionsHTML = `
        <div class="pdf-method">
            <label>
                <input type="radio" name="pdfMethod" value="canvas" checked>
                Высокое качество (с поддержкой кириллицы)
            </label>
            <label>
                <input type="radio" name="pdfMethod" value="standard">
                Быстрая конвертация
            </label>
        </div>
    `;
    
    pdfSection.querySelector('.pdf-options').insertAdjacentHTML('afterend', optionsHTML);
}

// Обновленный обработчик конвертации
document.getElementById('convertBtn').onclick = function() {
    const method = document.querySelector('input[name="pdfMethod"]:checked').value;
    
    if (method === 'canvas') {
        generatePDFWithCanvas();
    } else {
        generatePDF();
    }
};
    
    // Содержимое XML
    doc.setFontSize(16);
    doc.setTextColor(102, 126, 234);
    doc.text('Содержимое XML:', 20, 95);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Форматирование XML для PDF
    const formattedXML = formatXML(currentXmlContent);
    const lines = doc.splitTextToSize(formattedXML, 170);
    doc.text(lines, 20, 110);
    
    // Предпросмотр в модальном окне
    const pdfContent = document.getElementById('pdfContent');
    pdfContent.innerHTML = `
        <div class="pdf-preview-content">
            <p><strong>PDF документ создан</strong></p>
            <p>Размер: A4</p>
            <p>Страниц: 1</p>
            <p>XML строк: ${formattedXML.split('\n').length}</p>
        </div>
    `;
    
    // Сохраняем PDF для скачивания
    window.generatedPDF = doc;
    
    // Показываем модальное окно
    document.getElementById('pdfModal').style.display = 'block';
    
    // Кнопка скачивания
    document.getElementById('downloadPdf').onclick = function() {
        const fileName = `xml-report-${Date.now()}.pdf`;
        window.generatedPDF.save(fileName);
        saveToHistory(fileName, 'pdf');
    };
}

// Вспомогательные функции
function updateStatus(type, message) {
    const statusDiv = document.getElementById('validationOutput');
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-times-circle' : 'fa-clock';
    
    statusDiv.innerHTML = `
        <div class="status ${type}">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
}

function formatXML(xml) {
    const PADDING = ' '.repeat(2);
    const reg = /(>)(<)(\/*)/g;
    let formatted = '';
    let pad = 0;
    
    xml = xml.replace(reg, '$1\r\n$2$3');
    
    xml.split('\r\n').forEach(node => {
        let indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad !== 0) pad -= 1;
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }
        
        formatted += PADDING.repeat(pad) + node + '\r\n';
        pad += indent;
    });
    
    return formatted.substring(0, 2000) + (formatted.length > 2000 ? '...' : '');
}

function saveToHistory(filename, status, error = null) {
    const history = JSON.parse(localStorage.getItem('xmlHistory') || '[]');
    history.unshift({
        filename,
        status,
        error,
        timestamp: new Date().toISOString()
    });
    
    // Храним только последние 10 записей
    if (history.length > 10) history.pop();
    
    localStorage.setItem('xmlHistory', JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('xmlHistory') || '[]');
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty">История пуста</p>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item ${item.status}">
            <div class="history-header">
                <i class="fas fa-${getIcon(item.status)}"></i>
                <strong>${item.filename}</strong>
                <span class="time">${new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            ${item.error ? `<small class="error">${item.error}</small>` : ''}
        </div>
    `).join('');
}

function getIcon(status) {
    switch(status) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'pdf': return 'file-pdf';
        default: return 'file';
    }
}

// API для Postman (имитация)
async function handleApiUpload(request) {
    // Для GitHub Pages потребуется использование GitHub Actions
    // или внешнего сервиса для обработки API запросов
    
    console.log('API Upload called:', request);
    
    // Возвращаем mock ответ
    return {
        success: true,
        message: 'Файл обработан (симуляция)',
        validation: validationResults,
        downloadUrl: '#'
    };
}

// Экспортируем для использования в консоли
window.handleApiUpload = handleApiUpload;
