const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'frontend/src'),
];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.match(/\.(js|jsx|ts|tsx)$/)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

const colorMap = {
    // Dark Greens -> Charcoals & Dark Woods
    '#1C2E24': '#1A1A1A',
    '#0D2619': '#0D0D0D',
    '#0C3D1E': '#1A1A1A',
    '#1A5C32': '#2A1C10',
    '#0D3218': '#0D0D0D',
    '#19402B': '#333333',
    '#1E3A2B': '#2A1C10',

    // Light Greens
    '#E8F5E9': '#EFEBE3',
    '#C8E6C9': '#E2DAC8',

    // Golds -> Warm Woods
    '#C9973E': '#8B6B46',
    '#F5D78E': '#C4B299',

    // Creams -> Linens
    '#FAF8F3': '#F8F5F0',
    '#FBF7F0': '#F8F5F0',
    '#F0ECE1': '#EFEBE3',
    '#F0ECE5': '#EFEBE3',
    '#F5F2EA': '#EFEBE3',

    // Borders & Muted
    '#E5E0D5': '#E2DAC8',
    '#EAE4D9': '#E2DAC8',
    '#EAE6DD': '#E2DAC8',

    // Text Greys
    '#8C9890': '#808080',
    '#7A6E5D': '#666666',
    '#556B5D': '#666666',
    '#6B7A70': '#666666',
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    for (const [oldHex, newHex] of Object.entries(colorMap)) {
        const regex = new RegExp(oldHex, 'gi');
        content = content.replace(regex, newHex);
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated colors for: ${filePath}`);
    }
}

function processPath(targetPath) {
    if (!fs.existsSync(targetPath)) return;
    if (fs.lstatSync(targetPath).isDirectory()) {
        const files = getAllFiles(targetPath);
        files.forEach(processFile);
    } else {
        processFile(targetPath);
    }
}

dirs.forEach(processPath);
