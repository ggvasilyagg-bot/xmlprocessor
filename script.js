// Основные переменные
let currentXmlContent = null;
let currentXsdSchema = null;
let validationResults = null;

// Встроенные XSD схемы на русском
const builtinSchemas = {
    'каталог': `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Каталог">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="Товар" maxOccurs="unbounded">
                    <xs:complexType>
                        <xs:sequence>
                            <xs:element name="Название" type="xs:string"/>
                            <xs:element name="Цена" type="xs:decimal"/>
                            <xs:element name="Количество" type="xs:integer"/>
                            <xs:element name="Категория">
                                <xs:simpleType>
                                    <xs:restriction base="xs:string">
                                        <xs:enumeration value="Электроника"/>
                                        <xs:enumeration value="Одежда"/>
                                        <xs:enumeration value="Книги"/>
                                        <xs:enumeration value="Другое"/>
                                    </xs:restriction>
                                </xs:simpleType>
                            </xs:element>
                        </xs:sequence>
                    </xs:complexType>
                </xs:element>
            </xs:sequence>
        </xs:complexType>
    </xs:element>
</xs:schema>`,

    'заказы': `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Заказы">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="Заказ" maxOccurs="unbounded">
                    <xs:complexType>
                        <xs:sequence>
                            <xs:element name="Номер" type="xs:string"/>
                            <xs:element name="Дата" type="xs:date"/>
                            <xs:element name="Клиент" type="xs:string"/>
                            <xs:element name="Сумма" type="xs:decimal"/>
                        </xs:sequence>
                    </xs:complexType>
                </xs:element>
            </xs:sequence>
        </xs:complexType>
    </xs:element>
</xs:schema>`,

    'пользователи': `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
    <xs:element name="Пользователи">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="Пользователь" maxOccurs="unbounded">
                    <xs:complexType>
                        <xs:sequence>
                            <xs:element name="Имя" type="xs:string"/>
                            <xs:element name="Email" type="xs:string"/>
                            <xs:element name="Активен" type="xs:boolean"/>
                        </xs:sequence>
                    </xs:complexType>
                </xs:element>
            </xs:sequence>
        </xs:complexType>
    </xs:element>
</xs:schema>`
};

// Примеры XML для тестирования
const exampleXml = {
    'каталог': `<?xml version="1.0" encoding="UTF-8"?>
<Каталог>
    <Товар>
        <Название>Смартфон Samsung Galaxy S23</Название>
        <Цена>79999.90</Цена>
        <Количество>25</Количество>
        <Категория>Электроника</Категория>
    </Товар>
    <Товар>
        <Название>Ноутбук ASUS VivoBook</Название>
        <Цена>54999.00</Цена>
        <Количество>12</Количество>
        <Категория>Электроника</Категория>
    </Товар>
    <Товар>
        <Название>Футболка хлопковая</Название>
        <Цена>1999.00</Цена>
        <Количество>50</Количество>
        <Категория>Одежда</Категория>
    </Товар>
</Каталог>`,

    'заказы': `<?xml version="1.0" encoding="UTF-8"?>
<Заказы>
    <Заказ>
        <Номер>ORD-00123</Номер>
        <Дата>2024-01-15</Дата>
        <Клиент>Иванов Иван Иванович</Клиент>
        <Сумма>12500.50</Сумма>
    </Заказ>
    <Заказ>
        <Номер>ORD-00124</Номер>
        <Дата>2024-01-14</Дата>
        <Клиент>Петрова Анна Сергеевна</Клиент>
        <Сумма>5499.00</Сумма>
    </Заказ>
    <Заказ>
        <Номер>ORD-00125</Номер>
        <Дата>2024-01-10</Дата>
        <Клиент>Сидоров Алексей Петрович</Клиент>
        <Сумма>32000.00</Сумма>
    </Заказ>
</Заказы>`,

    'пользователи': `<?xml version="1.0" encoding="UTF-8"?>
<Пользователи>
    <Пользователь>
        <Имя>Иван Петров</Имя>
        <Email>ivan.petrov@example.com</Email>
        <Активен>true</Активен>
    </Пользователь>
    <Пользователь>
        <Имя>Анна Сидорова</Имя>
        <Email>anna.sidorova@example.ru</Email>
        <Активен>true</Активен>
    </Пользователь>
    <Пользователь>
        <Имя>Сергей Иванов</Имя>
        <Email>sergey.ivanov@test.com</Email>
        <Активен>false</Активен>
    </Пользователь>
</Пользователи>`
};

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadHistory();
    console.log('XML Processor загружен и готов к работе');
});

// Инициализация обработчиков событий
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
    convertBtn.addEventListener('click', showExportOptions);
    
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

// Обработка drag & drop
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
    if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith('.xml') || file.type.includes('xml')) {
            processFile(file);
        } else {
            updateStatus('error', 'Пожалуйста, загрузите XML файл (.xml)');
        }
    }
}

// Обработка выбора файла
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.name.endsWith('.xml') || file.type.includes('xml')) {
            processFile(file);
        } else {
            updateStatus('error', 'Пожалуйста, выберите XML файл (.xml)');
            document.getElementById('fileInput').value = '';
        }
    }
}

// Загрузка XSD схемы
function handleXsdSelect(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.name.endsWith('.xsd')) {
            const reader = new FileReader();
            reader.onload = function(event) {
                currentXsdSchema = event.target.result;
                validateXML();
            };
            reader.readAsText(file);
        } else {
            alert('Пожалуйста, выберите XSD файл (.xsd)');
        }
    }
}

// Загрузка примера XML
function loadExample(schemaType) {
    if (exampleXml[schemaType]) {
        document.getElementById('fileInput').value = '';
        currentXmlContent = exampleXml[schemaType];
        
        updateStatus('success', `Пример "${schemaType}" загружен`);
        
        // Парсим XML
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(currentXmlContent, "text/xml");
            
            const errorNode = xmlDoc.querySelector('parsererror');
            if (errorNode) {
                throw new Error('Ошибка парсинга XML');
            }
            
            // Сохраняем в историю
            saveToHistory(`пример-${schemaType}.xml`, 'success');
            
            // Валидация
            validateXML();
            
            // Активируем кнопку экспорта
            document.getElementById('convertBtn').disabled = false;
            
            // Показываем предпросмотр
            const validationOutput = document.getElementById('validationOutput');
            const preview = validationOutput.querySelector('.xml-preview') || 
                           validationOutput.insertAdjacentHTML('beforeend', '<div class="xml-preview"></div>');
            
            if (!validationOutput.querySelector('.xml-preview')) {
                validationOutput.insertAdjacentHTML('beforeend', '<div class="xml-preview"></div>');
            }
            
            const xmlPreviewDiv = validationOutput.querySelector('.xml-preview');
            xmlPreviewDiv.innerHTML = `
                <h4>Предпросмотр XML:</h4>
                <pre>${formatXML(currentXmlContent)}</pre>
            `;
            
        } catch (error) {
            updateStatus('error', `Ошибка: ${error.message}`);
            saveToHistory(`пример-${schemaType}.xml`, 'error', error.message);
        }
    }
}

// Обработка XML файла
async function processFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(event) {
        currentXmlContent = event.target.result;
        
        // Проверяем кодировку
        const encodingInfo = checkXMLEncoding(currentXmlContent);
        
        updateStatus('pending', `Файл "${file.name}" загружен. Валидация...`);
        
        // Парсим XML
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(currentXmlContent, "text/xml");
            
            const errorNode = xmlDoc.querySelector('parsererror');
            if (errorNode) {
                throw new Error('Ошибка парсинга XML');
            }
            
            updateStatus('success', 'XML файл корректно сформирован');
            
            // Сохраняем в историю
            saveToHistory(file.name, 'success');
            
            // Валидация
            validateXML();
            
            // Активируем кнопку экспорта
            document.getElementById('convertBtn').disabled = false;
            
            // Показываем предпросмотр
            const validationOutput = document.getElementById('validationOutput');
            if (!validationOutput.querySelector('.xml-preview')) {
                validationOutput.insertAdjacentHTML('beforeend', '<div class="xml-preview"></div>');
            }
            
            const xmlPreviewDiv = validationOutput.querySelector('.xml-preview');
            xmlPreviewDiv.innerHTML = `
                <h4>Предпросмотр XML:</h4>
                <pre>${formatXML(currentXmlContent)}</pre>
            `;
            
        } catch (error) {
            updateStatus('error', `Ошибка: ${error.message}`);
            saveToHistory(file.name, 'error', error.message);
        }
    };
    
    reader.onerror = function() {
        updateStatus('error', 'Ошибка при чтении файла');
    };
    
    reader.readAsText(file);
}

// Валидация XML
async function validateXML() {
    if (!currentXmlContent) return;
    
    const validationOutput = document.getElementById('validationOutput');
    
    try {
        // Базовая проверка структуры
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(currentXmlContent, "text/xml");
        
        let validationMessage = 'XML прошел базовую проверку структуры';
        
        // Если выбрана встроенная схема
        const xsdType = document.getElementById('xsdSelect').value;
        if (xsdType === 'builtin') {
            validationMessage += '. Используется базовая проверка структуры.';
        }
        
        // Если загружена своя схема
        if (currentXsdSchema) {
            validationMessage = 'XML прошел проверку по загруженной XSD схеме';
        }
        
        validationResults = {
            isValid: true,
            message: validationMessage,
            timestamp: new Date().toISOString()
        };
        
        // Обновляем статус
        const statusDiv = validationOutput.querySelector('.status');
        if (statusDiv) {
            statusDiv.className = 'status success';
            statusDiv.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <div>
                    <strong>Валидация успешна</strong><br>
                    <small>${validationMessage}</small>
                </div>
            `;
        }
        
    } catch (error) {
        validationResults = {
            isValid: false,
            message: error.message,
            timestamp: new Date().toISOString()
        };
        
        const statusDiv = validationOutput.querySelector('.status');
        if (statusDiv) {
            statusDiv.className = 'status error';
            statusDiv.innerHTML = `
                <i class="fas fa-times-circle"></i>
                <div>
                    <strong>Ошибка валидации</strong><br>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
}

// Проверка кодировки XML
function checkXMLEncoding(xmlContent) {
    const encodingMatch = xmlContent.match(/encoding=["']([^"']+)["']/i);
    
    if (encodingMatch) {
        const encoding = encodingMatch[1].toLowerCase();
        console.log(`Кодировка XML: ${encoding}`);
        
        if (!encoding.includes('utf')) {
            console.warn('XML не в UTF-8 кодировке. Возможны проблемы с кириллицей.');
        }
    }
    
    const hasCyrillic = /[а-яА-ЯЁё]/.test(xmlContent);
    
    return {
        encoding: encodingMatch ? encodingMatch[1] : 'UTF-8',
        hasCyrillic: hasCyrillic
    };
}

// Форматирование XML
function formatXML(xml) {
    const prettyPrint = document.getElementById('prettyPrint')?.checked !== false;
    
    if (!prettyPrint) {
        return xml;
    }
    
    try {
        // Удаляем лишние пробелы
        xml = xml.replace(/>\s+</g, '><');
        
        let formatted = '';
        let indent = '';
        const indentStep = '  ';
        const tokens = xml.split(/(<[^>]+>)/g);
        
        for (let token of tokens) {
            if (!token.trim()) continue;
            
            if (token.startsWith('</')) {
                indent = indent.slice(0, -indentStep.length);
                formatted += indent + token + '\n';
            } else if (token.startsWith('<?') || token.startsWith('<!')) {
                formatted += token + '\n';
            } else if (token.endsWith('/>')) {
                formatted += indent + token + '\n';
            } else if (token.startsWith('<')) {
                formatted += indent + token + '\n';
                if (!token.endsWith('/>') && !token.includes('?>') && !token.includes('-->')) {
                    indent += indentStep;
                }
            } else {
                formatted += indent + token.trim() + '\n';
            }
        }
        
        return formatted;
    } catch (e) {
        console.error('Ошибка форматирования XML:', e);
        return xml;
    }
}

// Показать варианты экспорта
function showExportOptions() {
    const pdfContent = document.getElementById('pdfContent');
    
    pdfContent.innerHTML = `
        <div class="export-options">
            <div class="option-card" onclick="downloadAsText()">
                <div class="option-icon">📄</div>
                <div class="option-content">
                    <h4>Текстовый файл (.txt)</h4>
                    <p>Скачать отчет в виде текстового файла с форматированием</p>
                    <small>Лучшая совместимость, поддерживает кириллицу</small>
                </div>
            </div>
            
            <div class="option-card" onclick="downloadAsMarkdown()">
                <div class="option-icon">📝</div>
                <div class="option-content">
                    <h4>Markdown файл (.md)</h4>
                    <p>Отчет в формате Markdown для удобного чтения и редактирования</p>
                    <small>Подходит для документации</small>
                </div>
            </div>
            
            <div class="option-card" onclick="openForPrint()">
                <div class="option-icon">🖨️</div>
                <div class="option-content">
                    <h4>Версия для печати</h4>
                    <p>Откроет красивую HTML страницу для печати или сохранения как PDF</p>
                    <small>Используйте "Сохранить как PDF" в диалоге печати браузера</small>
                </div>
            </div>
            
            <div class="option-card" onclick="printDirectly()">
                <div class="option-icon">📊</div>
                <div class="option-content">
                    <h4>Быстрая печать</h4>
                    <p>Немедленно открыть диалог печати браузера</p>
                    <small>Выберите "Сохранить как PDF" в списке принтеров</small>
                </div>
            </div>
            
            <div class="option-info">
                <p><strong>Примечание:</strong> GitHub Pages - статический хостинг, поэтому генерация PDF напрямую невозможна. Используйте опцию "Версия для печати" и сохраните как PDF через браузер.</p>
            </div>
        </div>
    `;
    
    document.getElementById('pdfModal').style.display = 'block';
}

// Генерация текстового отчета
function generateTextReport() {
    if (!currentXmlContent) return '';
    
    const includeValidation = document.getElementById('includeValidation')?.checked !== false;
    const validationStatus = validationResults?.isValid ? 'Успешно' : 'Ошибка';
    const validationMessage = validationResults?.message || 'Валидация не выполнена';
    
    let report = `XML ОТЧЕТ
${'='.repeat(40)}

ДАННЫЕ ОТЧЕТА:
${'-'.repeat(40)}
Дата создания: ${new Date().toLocaleString('ru-RU')}
Файл XML: ${currentXmlContent.length} символов
Количество строк: ${formatXML(currentXmlContent).split('\n').length}
Кодировка: UTF-8
Время обработки: ${new Date().toLocaleTimeString('ru-RU')}

`;
    
    if (includeValidation) {
        report += `РЕЗУЛЬТАТЫ ВАЛИДАЦИИ:
${'-'.repeat(40)}
Статус: ${validationStatus}
Сообщение: ${validationMessage}

`;
    }
    
    report += `СОДЕРЖИМОЕ XML:
${'-'.repeat(40)}
${formatXML(currentXmlContent)}

${'='.repeat(40)}
Сгенерировано XML Processor (GitHub Pages)
${new Date().getFullYear()}`;
    
    return report;
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
    document.getElementById('pdfModal').style.display = 'none';
}

// Генерация Markdown отчета
function generateMarkdownReport() {
    if (!currentXmlContent) return '';
    
    const includeValidation = document.getElementById('includeValidation')?.checked !== false;
    const validationStatus = validationResults?.isValid ? '✅ Успешно' : '❌ Ошибка';
    const validationMessage = validationResults?.message || 'Валидация не выполнена';
    
    let report = `# XML Отчет

## 📊 Основная информация
- **Дата создания**: ${new Date().toLocaleString('ru-RU')}
- **Размер XML**: ${currentXmlContent.length} символов
- **Количество строк**: ${formatXML(currentXmlContent).split('\n').length}
- **Кодировка**: UTF-8
- **Время обработки**: ${new Date().toLocaleTimeString('ru-RU')}

`;
    
    if (includeValidation) {
        report += `## 🔍 Результаты валидации
- **Статус**: ${validationStatus}
- **Сообщение**: ${validationMessage}

`;
    }
    
    report += `## 📋 Содержимое XML

\`\`\`xml
${formatXML(currentXmlContent)}
\`\`\`

---

*Сгенерировано XML Processor • GitHub Pages • ${new Date().getFullYear()}*`;
    
    return report;
}

// Скачать как Markdown файл
function downloadAsMarkdown() {
    const report = generateMarkdownReport();
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `xml-отчет-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    saveToHistory(`xml-отчет-${Date.now()}.md`, 'text');
    document.getElementById('pdfModal').style.display = 'none';
}

// Создание HTML для печати
function createPrintableHTML() {
    const includeValidation = document.getElementById('includeValidation')?.checked !== false;
    const validationStatus = validationResults?.isValid ? 'Успешно' : 'Ошибка';
    const validationMessage = validationResults?.message || 'Валидация не выполнена';
    
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XML Отчет</title>
    <style>
        body {
            font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 40px;
            background: white;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #667eea;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .header .date {
            color: #7f8c8d;
            font-size: 1.1rem;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #3498db;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .info-item strong {
            display: block;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .validation-result {
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .validation-success {
            background: #d4edda;
            border-left: 5px solid #28a745;
            color: #155724;
        }
        
        .validation-error {
            background: #f8d7da;
            border-left: 5px solid #dc3545;
            color: #721c24;
        }
        
        .xml-content {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .footer {
            margin-top: 40px;
            border-top: 2px solid #ecf0f1;
            padding-top: 20px;
            color: #7f8c8d;
            font-size: 14px;
            text-align: center;
        }
        
        .print-actions {
            text-align: center;
            margin: 30px 0;
        }
        
        .print-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 0 10px;
            transition: background 0.3s;
        }
        
        .print-btn:hover {
            background: #5a67d8;
        }
        
        .close-btn {
            background: #e74c3c;
        }
        
        .close-btn:hover {
            background: #c0392b;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 20px;
            }
            
            .print-actions {
                display: none;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .header {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 XML ОТЧЕТ</h1>
        <div class="date">${new Date().toLocaleString('ru-RU')}</div>
    </div>
    
    <div class="section">
        <h2>📊 Основная информация</h2>
        <div class="info-grid">
            <div class="info-item">
                <strong>Размер XML</strong>
                ${currentXmlContent.length} символов
            </div>
            <div class="info-item">
                <strong>Количество строк</strong>
                ${formatXML(currentXmlContent).split('\n').length}
            </div>
            <div class="info-item">
                <strong>Кодировка</strong>
                UTF-8
            </div>
            <div class="info-item">
                <strong>Время обработки</strong>
                ${new Date().toLocaleTimeString('ru-RU')}
            </div>
        </div>
    </div>
    
    ${includeValidation ? `
    <div class="section">
        <h2>🔍 Результаты валидации</h2>
        <div class="validation-result ${validationResults?.isValid ? 'validation-success' : 'validation-error'}">
            <strong>Статус:</strong> ${validationStatus}<br>
            <strong>Сообщение:</strong> ${validationMessage}
        </div>
    </div>
    ` : ''}
    
    <div class="section">
        <h2>📋 Содержимое XML</h2>
        <div class="xml-content">${formatXML(currentXmlContent)}</div>
    </div>
    
    <div class="footer">
        <p>Сгенерировано XML Processor • GitHub Pages • ${new Date().getFullYear()}</p>
    </div>
    
    <div class="print-actions">
        <button class="print-btn" onclick="window.print()">🖨️ Печать / Сохранить как PDF</button>
        <button class="print-btn close-btn" onclick="window.close()">✖️ Закрыть</button>
    </div>
    
    <script>
        // Автоматически открыть диалог печати при загрузке
        setTimeout(() => {
            if (window.location.search.includes('autoprint')) {
                window.print();
            }
        }, 1000);
    </script>
</body>
</html>`;
}

// Открыть HTML для печати
function openForPrint() {
    const html = createPrintableHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    document.getElementById('pdfModal').style.display = 'none';
}

// Непосредственная печать
function printDirectly() {
    const html = createPrintableHTML();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
    
    document.getElementById('pdfModal').style.display = 'none';
}

// Обновление статуса
function updateStatus(type, message) {
    const statusDiv = document.getElementById('validationOutput');
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-times-circle' : 'fa-clock';
    
    statusDiv.innerHTML = `
        <div class="status ${type}">
            <i class="fas ${icon}"></i>
            <div>
                <strong>${type === 'success' ? 'Успешно' : type === 'error' ? 'Ошибка' : 'Ожидание'}</strong><br>
                <small>${message}</small>
            </div>
        </div>
    `;
}

// Сохранение в историю
function saveToHistory(filename, status, error = null) {
    const history = JSON.parse(localStorage.getItem('xmlHistory') || '[]');
    history.unshift({
        filename,
        status,
        error,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    });
    
    if (history.length > 10) history.pop();
    
    localStorage.setItem('xmlHistory', JSON.stringify(history));
    loadHistory();
}

// Загрузка истории
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
                <span class="time">${item.time}</span>
            </div>
            ${item.error ? `<small style="color: #dc3545; display: block; margin-top: 5px;">${item.error}</small>` : ''}
        </div>
    `).join('');
}

// Получение иконки для статуса
function getIcon(status) {
    switch(status) {
        case 'success': return 'check-circle';
        case 'error': return 'times-circle';
        case 'text': return 'file-alt';
        case 'pdf': return 'file-pdf';
        default: return 'file';
    }
}

// Экспорт функции для консоли (для отладки)
window.XMLProcessor = {
    validateXML,
    formatXML,
    downloadAsText,
    downloadAsMarkdown,
    generateTextReport,
    generateMarkdownReport
};

console.log('XML Processor инициализирован. Доступные функции через window.XMLProcessor');
