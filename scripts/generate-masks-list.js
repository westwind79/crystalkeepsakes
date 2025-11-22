// Generate available-masks.json from files in /public/img/masks/
// Run: node scripts/generate-masks-list.js

const fs = require('fs');
const path = require('path');

const masksDir = path.join(__dirname, '../public/img/masks');
const outputFile = path.join(__dirname, '../public/data/available-masks.json');

console.log('🔍 Scanning masks folder:', masksDir);

try {
  const files = fs.readdirSync(masksDir);
  
  const maskFiles = files
    .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
    .map(file => ({
      filename: file,
      path: `/img/masks/${file}`,
      displayName: file.replace(/-mask\.(png|jpg|jpeg|webp)$/i, '').replace(/[-_]/g, ' ')
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  
  fs.writeFileSync(outputFile, JSON.stringify(maskFiles, null, 2), 'utf-8');
  
  console.log(`✅ Generated ${maskFiles.length} masks`);
  console.log(`📁 Output: ${outputFile}`);
  console.log('\n💡 Masks found:');
  maskFiles.slice(0, 5).forEach(mask => console.log(`   - ${mask.displayName}`));
  if (maskFiles.length > 5) {
    console.log(`   ... and ${maskFiles.length - 5} more`);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
