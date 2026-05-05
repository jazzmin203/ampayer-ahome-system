const Tesseract = require('tesseract.js');

async function testOCR(path) {
  console.log(`Testing OCR for ${path}...`);
  try {
    const result = await Tesseract.recognize(path, 'spa');
    console.log(`--- START OF TEXT ---`);
    console.log(result.data.text);
    console.log(`--- END OF TEXT ---`);
  } catch (err) {
    console.error(err);
  }
}

const file = process.argv[2];
testOCR(file);
