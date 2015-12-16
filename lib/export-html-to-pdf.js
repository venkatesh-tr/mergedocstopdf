'use strict';
var fs = require('fs'),
  Promise = require('bluebird'),
  _ = require('lodash'),
  path = require('path'),
  wkhtmltopdf = require('wkhtmltopdf');

module.exports = function() {
  return function(renderedHtml, tmpFile, opts) {
    return new Promise(function(resolve) {
//       fs.writeFile(tmpFile + '.html', renderedHtml,
//         function(err) {
//           if (err) {
//             var msg = `
// Error in exportToPdf: Error writing debug html file: file = $ {
//   tmpFile
// }.html `;
//             console.error(msg, err);
//           }
//         });

      var options = {
        pageSize: 'letter',
        minimumFontSize: 14,
        marginTop: '20mm',
        headerSpacing: '5'
      };
      console.log(opts);
      if (opts && _.isObject(opts)) {
        options = _.merge(options, opts);
      }
      console.log('Options = ' + JSON.stringify(options));
      var fss = fs.createWriteStream(tmpFile + '.pdf');
      fss.on('close', function() {
        resolve(fs.createReadStream(tmpFile + '.pdf'));
      });
      console.log(options);
      wkhtmltopdf(renderedHtml, options, function(code, signal) {
        if (code || signal) {
          var msg = `
Error in exportToPdf: file = $ {
  tmpFile
}, opts = $ {
  opts
}, code = $ {
  code
}, signal = $ {
  signal
}
`;
          console.error(msg, signal);
        }
      }).pipe(fss);
    });
  };
};
