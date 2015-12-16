'use strict';
var exportHtmlToPdf = require('./export-html-to-pdf')();

module.exports = function() {
  return function(imageFileName, width, height) {
    var html = `<html><body><img src=\"file://${imageFileName}\" width=\"${width}\" height=\"${height}\"></body></html>`;
    var fileNameWithoutExtn = imageFileName.lastIndexOf('.') > -1 ? imageFileName.substring(0, imageFileName.lastIndexOf('.')) : imageFileName;
    return exportHtmlToPdf(html, fileNameWithoutExtn, {});
  };
}
