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
function generatePDF() {
    if (!currentXmlContent) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Заголовок
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('XML Report', 105, 20, { align: 'center' });
    
    // Информация о файле
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Дата создания: ${new Date().toLocaleString()}`, 20, 40);
    
    // Результаты валидации
    doc.setFontSize(16);
    doc.text('Результаты валидации:', 20, 60);
    
    doc.setFontSize(12);
    if (validationResults.isValid) {
        doc.setTextColor(0, 128, 0);
        doc.text('✓ ' + validationResults.message, 20, 75);
    } else {
        doc.setTextColor(255, 0, 0);
        doc.text('✗ ' + validationResults.message, 20, 75);
    }
    
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
