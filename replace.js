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
            if (file.match(/\.(js|jsx|ts|tsx|json|md|html|css)$/)) {
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

    content = content.replace(/Ratnamayuri/g, 'Oak & Heritage');
    content = content.replace(/RATNAMAYURI/g, 'OAK & HERITAGE');
    content = content.replace(/ratnamayuri/g, 'oak-and-heritage');

    // Fix urls
    content = content.replace(/Oak & Heritage\.com/g, 'oakandheritage.com');
    content = content.replace(/Oak & Heritage\.live/g, 'oakandheritage.live');
    content = content.replace(/oak-and-heritage\.com/g, 'oakandheritage.com');
    content = content.replace(/oak-and-heritage\.live/g, 'oakandheritage.live');
    content = content.replace(/oak-and-heritage\.onrender/g, 'oakandheritage.onrender');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

dirs.forEach(processPath);
