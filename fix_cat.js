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

    // Categories
    content = content.replace(/\/design\/cat_jewellery\.png/g, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=200');
    content = content.replace(/\/design\/cat_sarees\.png/g, 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=200');
    content = content.replace(/\/design\/cat_dresses\.png/g, 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&q=80&w=200');

    // Replace Jewellery -> Desks, Sarees -> Sofas, Dresses -> Chairs just to be safe
    // But be careful not to corrupt variable names if they exist.
    // Instead I'll just change the text on customer/categories/page.tsx

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated images for: ${filePath}`);
    }
}

dirs.forEach(processPath);
