const fs = require('fs');

const files = [
  'app/classes/[id]/page.tsx',
  'app/simulator/v2/[id]/page.tsx',
  'app/simulator/play/[id]/page.tsx',
  'app/simulator/[id]/page.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    if (!content.includes('generateStaticParams')) {
      content += `\nexport function generateStaticParams() {
  return [{ id: "ekZU9TLV0HfmfMV2MVKe" }];
}\n`;
      fs.writeFileSync(f, content);
    }
  }
});
