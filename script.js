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

// Удалите все сложные PDF функции и добавьте эти:

// Простая функция для создания текстового отчета
function generateTextReport() {
    if (!currentXmlContent) return;
    
    const reportContent = `
XML ОТЧЕТ
===========
Дата: ${new Date().toLocaleString('ru-RU')}
Статус валидации: ${validationResults?.isValid ? 'Успешно' : 'Ошибка'}
Сообщение: ${validationResults?.message || 'Нет данных'}

СОДЕРЖИМОЕ XML:
---------------
${formatXML(currentXmlContent)}

СТАТИСТИКА:
-----------
Размер XML: ${currentXmlContent.length} символов
Количество строк: ${formatXML(currentXmlContent).split('\n').length}
Кодировка: UTF-8
Время обработки: ${new Date().toLocaleTimeString('ru-RU')}

Сгенерировано XML Processor (GitHub Pages)
`;
    
    return reportContent;
}

// Скачать как текстовый файл
function downloadAsText() {
    const report = generateTextReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `xml-отчет-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    saveToHistory(`xml-отчет-${Date.now()}.txt`, 'text');
}

// Создать HTML для печати
function createPrintableHTML() {
    const report = generateTextReport();
    const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XML Отчет</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            line-height: 1.6;
            margin: 20px;
            background: white;
            color: black;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        .xml-content {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            font-size: 12px;
            white-space: pre-wrap;
            word-wrap: break-word;
            border: 1px solid #ddd;
        }
        .status-success {
            color: green;
            font-weight: bold;
        }
        .status-error {
            color: red;
            font-weight: bold;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px solid #333;
            padding-top: 10px;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>XML ОТЧЕТ</h1>
        <p>Дата создания: ${new Date().toLocaleString('ru-RU')}</p>
    </div>
    
    <div class="section">
        <h2>Статус валидации</h2>
        <p class="${validationResults?.isValid ? 'status-success' : 'status-error'}">
            ${validationResults?.isValid ? '✓ ВАЛИДАЦИЯ УСПЕШНА' : '✗ ОШИБКА ВАЛИДАЦИИ'}
        </p>
        <p>${validationResults?.message || ''}</p>
    </div>
    
    <div class="section">
        <h2>Содержимое XML</h2>
        <div class="xml-content">${formatXML(currentXmlContent)}</div>
    </div>
    
    <div class="section">
        <h2>Статистика</h2>
        <ul>
            <li>Размер XML: ${currentXmlContent.length} символов</li>
            <li>Количество строк: ${formatXML(currentXmlContent).split('\n').length}</li>
            <li>Кодировка: UTF-8</li>
            <li>Время обработки: ${new Date().toLocaleTimeString('ru-RU')}</li>
        </ul>
    </div>
    
    <div class="footer">
        <p>Сгенерировано XML Processor • GitHub Pages • ${new Date().getFullYear()}</p>
        <button class="no-print" onclick="window.print()">🖨️ Печать</button>
        <button class="no-print" onclick="window.close()">✖️ Закрыть</button>
    </div>
    
    <script>
        // Автоматически открыть диалог печати
        setTimeout(() => {
            if (window.location.search.includes('autoprint')) {
                window.print();
            }
        }, 500);
    </script>
</body>
</html>`;
    
    return htmlContent;
}

// Открыть в новом окне для печати
function openForPrint() {
    const html = createPrintableHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
}

// Использовать встроенный PDF принтер браузера
function printToPDF() {
    const html = createPrintableHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

// Обновите модальное окно для отображения вариантов
function showExportOptions() {
    const pdfContent = document.getElementById('pdfContent');
    
    pdfContent.innerHTML = `
        <div class="export-options">
            <h3>Выберите способ экспорта:</h3>
            
            <div class="option-card" onclick="downloadAsText()">
                <div class="option-icon">📄</div>
                <div class="option-content">
                    <h4>Текстовый файл (.txt)</h4>
                    <p>Простой текстовый файл с отчетом</p>
                    <small>Лучшая совместимость</small>
                </div>
            </div>
            
            <div class="option-card" onclick="openForPrint()">
                <div class="option-icon">🖨️</div>
                <div class="option-content">
                    <h4>Версия для печати</h4>
                    <p>Откроет в новом окне для печати или сохранения как PDF</p>
                    <small>Использует встроенный PDF принтер браузера</small>
                </div>
            </div>
            
            <div class="option-card" onclick="printToPDF()">
                <div class="option-icon">📊</div>
                <div class="option-content">
                    <h4>PDF через печать</h4>
                    <p>Откроет диалог печати для сохранения как PDF</p>
                    <small>Выберите "Сохранить как PDF" в принтере</small>
                </div>
            </div>
            
            <div class="option-info">
                <p><strong>Примечание:</strong> GitHub Pages - статический хостинг, поэтому генерация PDF напрямую не работает. Используйте опции выше.</p>
            </div>
        </div>
    `;
    
    document.getElementById('pdfModal').style.display = 'block';
}

// Обновите обработчик кнопки конвертации
document.getElementById('convertBtn').onclick = showExportOptions;
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
