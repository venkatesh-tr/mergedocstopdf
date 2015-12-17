#Merge Office Documents, Images, PDFs into single PDF

This application can be used for merging two or more documents or images or pdfs or any combination of them into single PDF.

##Usage
```
node app.js <input-folder> <output-file-with-path>
```

For example, the following command reads through all files from input folder (with respect to current folder) and outputs the final converted/merged pdf into output folder.


```
node app.js ./input ./output/final.pdf
```

##How does it work?

It scans through the input folder and does the following:

1. If the file is one of the image file (jpg/jpeg/png/bmp) it converts the image to a html (embeds the image into a sample html) and converts this html to pdf to store the pdf into same folder
1. If the file is not either a html or a pdf, it assumes that this file might be a office document (like doc/docx/xls/xlsx/ppt/pptx) and converts it into pdf using [office-converter](https://www.npmjs.com/package/office-converter).
1. Once all files are converted, it picks up the pdf files generated (along with already those pdfs that exist in the same folder) and converts them into single PDF using [pdf-merge](https://www.npmjs.com/package/pdf-merge) module (which in turn depends on [pdftk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/)) into ouput path specified.

##TODOs
1. If the file is a html file, it should convert the html to pdf file
1. Conversion of office documents into pdf sometimes is failing - probably due to threading issues of unoconv which needs a fix. Immediate fix is to convert office files sequentially (rather than parallel).
1. Writing test cases
