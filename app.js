var Promise = require('bluebird');
var _ = require('lodash');
var buildImageHtml = require('./lib/build-image-html')();
var exportHtmlToPdf = require('./lib/export-html-to-pdf')();
var sizeOf = require('image-size');
var PdfMerge = require('pdf-merge');

var fs = Promise.promisifyAll(require('fs'));
var office2Pdf = Promise.promisify(require('office-converter')().generatePdf);
var maxWidth = 1500;
var maxHeight = 1500;
var imageExtn = /(gif|jpg|jpeg|tiff|png)$/i;

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

var outputFile = './output/final.pdf';
if (process.argv.length > 3) {
  outputFile = process.argv[3];
}
if (outputFile.lastIndexOf('pdf') !== outputFile.length - 3) {
  outputFile += '.pdf';
}

console.log('Reading folder : ', inputFolder);
fs.readdirAsync(inputFolder).then((files) => {
  if (files && files.length > 0) {
    var allPDFFiles = _.map(files, (file) => {
      return convertToPdf(inputFolder + '/' + file);
    });
    return Promise.all(allPDFFiles);
  }
  return Promise.reject('No Files found inside the specified directory : ' + inputFolder);
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
  var writeStream = fs.createWriteStream(outputFile);
  writeStream.on('close', (err, res) => {
    if (err) {
      console.error('Error writing the final PDF file  ', err);
    } else {
      console.log('Merged all PDFs!');
    }
  });
  var files = _.unique(_.values(mappedFiles));
  console.log(files);
  new PdfMerge(files).asReadStream().promise().then((stream) => {
    stream.pipe(writeStream);
  });
}).error((err) => {
  console.error('Error generating PDFs : ');
  console.error(err);
});

function convertToPdf(fileName) {
  var fileNameWithoutExtn = fileName.lastIndexOf('.') > -1 ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
  var extn = fileName.lastIndexOf('.') > -1 ? fileName.substring(fileName.lastIndexOf('.') + 1) : 'docx';
  if (imageExtn.test(extn)) {
    return fs.realpathAsync(fileName).then((realPath) => {
      var size = sizeOf(realPath);
      return buildImageHtml(realPath, size.width > maxWidth ? maxWidth : size.width, size.height > maxHeight ? maxHeight : size.height);
    }).then((stream) => {
      return Promise.resolve({
        file: fileName,
        outputFile: fileNameWithoutExtn + '.pdf'
      });
    });
  } else if (extn === 'html') {
    return fs.readFileAsync(fileName).then((content) => {
      return exportHtmlToPdf(content, fileNameWithoutExtn + '.pdf');
    }).then(() => {
      return Promise.resolve({
        file: fileName,
        outputFile: fileNameWithoutExtn + '.pdf'
      });
    });
  } else if (extn !== 'pdf') {
    return office2Pdf(fileName).then((result) => {
      return Promise.resolve({
        file: fileName,
        outputFile: result.outputFile
      });
    });
  } else {
    return Promise.resolve({
      file: fileName,
      outputFile: fileName
    });
  }
}
