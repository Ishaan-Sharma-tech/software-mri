const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const version = '31.7.7';
const url = `https://npmmirror.com/mirrors/electron/${version}/electron-v${version}-win32-x64.zip`;
const zipPath = path.join(__dirname, 'electron.zip');

console.log('Downloading Electron manually from:', url);
const file = fs.createWriteStream(zipPath);

https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error('Failed to download, status code:', response.statusCode);
    process.exit(1);
  }
  
  response.pipe(file);
  
  file.on('finish', () => {
    file.close(() => {
      console.log('Download complete. Extracting...');
      try {
        fs.mkdirSync('node_modules/electron/dist', { recursive: true });
        execSync(`powershell Expand-Archive -Path electron.zip -DestinationPath node_modules/electron/dist -Force`, { stdio: 'inherit' });
        fs.writeFileSync('node_modules/electron/path.txt', 'electron.exe');
        console.log('Extraction complete. Electron installed successfully.');
        process.exit(0);
      } catch (err) {
        console.error('Extraction failed:', err);
        process.exit(1);
      }
    });
  });
}).on('error', (err) => {
  fs.unlinkSync(zipPath);
  console.error('Download error:', err.message);
  process.exit(1);
});
