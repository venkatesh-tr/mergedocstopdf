var Promise = require('bluebird'),
  fs = Promise.promisifyAll(require("fs")),
  _ = require('lodash'),
  office2Pdf = Promise.promisify(require('office-converter')().generatePdf),
  buildImageHtml = require('./lib/build-image-html')(),
  sizeOf = require('image-size'),
  maxWidth = 1500,
  maxHeight = 1500,
  PdfMerge = require('pdf-merge');
// readFile = Promise.promisify(fs.readFile),
// readDir = Promise.promisify(fs.readDir);

// Read all files from the input folder and Copy them to temp folder
// Convert each one into PDF
// Merge all PDFs into one and copy back to output folder

console.log('Process Arguments : ', process.argv);
var inputFolder = 'input';

if (process.argv.length > 2) {
  inputFolder = process.argv[2];
}
console.log('Reading folder : ', inputFolder);
fs.readdirAsync(inputFolder).then((files) => {
  if (files && files.length > 0) {
    var allPDFFiles = _.map(files, (file) => {
      return convertToPdf(inputFolder + '/' + file);
    });
    return Promise.all(allPDFFiles);
  } else {
    return Promise.reject('No Files found inside the specified directory : ' + inputFolder);
  }
}).then((results) => {
  console.log('results : ', results);
  var allFileMappings = _.transform(results, (result, value, indx) => {
    console.log(value, '   ', indx);
    result[value.file] = value.outputFile;
    return result;
  });
  return Promise.resolve(allFileMappings);
}).then((mappedFiles) => {
  console.log('Mapped Files : ');
  console.log(mappedFiles);
  var writeStream = fs.createWriteStream('./output/final.pdf');
  writeStream.on('close', (err, res) => {
    console.log('Merged all PDFs!');
  });
  var mergedPdf = new PdfMerge(_.values(mappedFiles)).asReadStream().promise().then((stream) => {
    stream.pipe(writeStream);
  });
}).error((err) => {
  console.error('Error generating PDFs : ')
  console.error(err);
});

function convertToPdf(fileName) {
  var extn = fileName.lastIndexOf('.') > -1 ? fileName.substring(fileName.lastIndexOf('.') + 1) : 'docx';
  if (extn === 'jpg' || extn === 'jpeg' || extn === 'png' || extn === 'bmp') {
    return fs.realpathAsync(fileName).then((realPath) => {
      var size = sizeOf(realPath);
      return buildImageHtml(realPath, size.width > maxWidth ? maxWidth : size.width, size.height > maxHeight ? maxHeight : size.height);
    }).then((stream) => {
      var fileNameWithoutExtn = fileName.lastIndexOf('.') > -1 ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
      return Promise.resolve({
        file: fileName,
        outputFile: fileNameWithoutExtn + '.pdf'
      })
    });
  } else if (extn !== 'pdf' && extn !== 'html') {
    return office2Pdf(fileName).then((result) => {
      return Promise.resolve({
        file: fileName,
        outputFile: result.outputFile
      })
    });
  } else {
    return Promise.resolve({
      file: fileName,
      outputFile: fileName
    });
  }
}
