const fs = require('fs');
const path = require('path');

const dirs = [
    path.join(__dirname, 'frontend/src'),
    path.join(__dirname, 'backend/src'),
    path.join(__dirname, 'frontend/package.json'),
    path.join(__dirname, 'backend/package.json'),
    path.join(__dirname, 'README.md'),
];

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.match(/\.(js|jsx|ts|tsx|json|md|html|css|txt)$/)) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
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

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    content = content.replace(/Oak & Heritage/g, 'Ballanki A1 Furnitures');
    content = content.replace(/OAK & HERITAGE/g, 'BALLANKI A1 FURNITURES');
    content = content.replace(/oak-and-heritage/g, 'ballanki-a1-furnitures');

    // Fix urls and emails
    content = content.replace(/oakandheritage/g, 'ballankia1furnitures');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

dirs.forEach(processPath);
