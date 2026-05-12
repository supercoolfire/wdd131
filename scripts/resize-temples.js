const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sourceDir = path.join(__dirname, '../images/temples-large');
const targetDir = path.join(__dirname, '../images/temples-small');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir).filter(file => file.endsWith('.jpg'));

files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);
    
    // Using PowerShell to resize since we don't know if 'sharp' is installed
    // This script uses System.Drawing which is available on Windows
    const psCommand = `
 Add-Type -AssemblyName System.Drawing;
 $img = [System.Drawing.Image]::FromFile('${sourcePath}');
 $newWidth = 200;
 $newHeight = [int]($img.Height * ($newWidth / $img.Width));
 $newImg = new-object System.Drawing.Bitmap($newWidth, $newHeight);
$graph = [System.Drawing.Graphics]::FromImage($newImg);
$graph.DrawImage($img, 0, 0, $newWidth, $newHeight);
$newImg.Save('${targetPath}', [System.Drawing.Imaging.ImageFormat]::Jpeg);
$graph.Dispose();
$img.Dispose();
$newImg.Dispose();
    `;
    
    try {
        execSync(`powershell -Command "${psCommand.replace(/\n/g, ' ')}"`);
        console.log(`Resized: ${file}`);
    } catch (err) {
        console.error(`Failed to resize ${file}:`, err.message);
    }
});
