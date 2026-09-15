const fs = require('fs');
const path = require('path');
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAAECAYAAABFfTOAAAAAEElEQVR42mNk+M+AAzBiAAANEQIN43t+KAAAAABJRU5ErkJggg==";
const buffer = Buffer.from(base64Png, 'base64');
const files = ['body.png', 'hair_1.png', 'hair_2.png', 'top_1.png', 'top_2.png', 'bottom_1.png', 'shoes_1.png'];
const dir = path.join(__dirname, 'public/assets/layers');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
files.forEach(file => {
  fs.writeFileSync(path.join(dir, file), buffer);
});
