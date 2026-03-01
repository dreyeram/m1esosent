const fs = require('fs');
const path = require('path');

const filePath = 'e:\\mln\\endoscopy-suite\\uploads\\logos\\logos_d18685af-6231-4268-b340-5cd657939abb_1771495930023.jpg';
console.log(`Checking path: ${filePath}`);
console.log(`Exists: ${fs.existsSync(filePath)}`);

const uploadsDir = 'e:\\mln\\endoscopy-suite\\uploads';
if (fs.existsSync(uploadsDir)) {
    console.log(`Contents of ${uploadsDir}:`, fs.readdirSync(uploadsDir));
    const logosDir = path.join(uploadsDir, 'logos');
    if (fs.existsSync(logosDir)) {
        console.log(`Contents of ${logosDir}:`, fs.readdirSync(logosDir));
    } else {
        console.log(`Logos dir does NOT exist at ${logosDir}`);
    }
} else {
    console.log(`Uploads dir does NOT exist at ${uploadsDir}`);
}
