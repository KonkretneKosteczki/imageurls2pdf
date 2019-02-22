const PDFDocument = require('pdfkit');
const fetch = require("node-fetch");
const imageSize = require('buffer-image-size');
const fs = require("fs");
const path = require("path");

function getImageBuffer(url) {
    return fetch(url)
        .then(response => response.buffer())
}

function addImage({doc, buffer, options: {filename = "output.pdf", directory = process.cwd()} = {}}) {
    // if no document created document with initial page of image size
    // otherwise adds another page for image with same parameters
    // images has full size

    const {width, height} = imageSize(buffer);
    const dimensions = {width, height};

    if (!doc) {
        doc = new PDFDocument({margin: 0, size: Object.values(dimensions)});
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, {recursive: true});
        doc.pipe(fs.createWriteStream(path.join(directory, filename)));
    } else doc.addPage({margin: 0, size: Object.values(dimensions)});
    doc.image(buffer, dimensions);
    console.log(`Added image: ${Object.values(dimensions).join("x")}`);
    return doc;
}

function createPdf(imageList, options) {
    // initial image
    if (imageList && imageList.length)
        getImageBuffer(imageList.shift())
            .then(buffer => addImage({buffer, options}))
            // all other images this way
            .then(doc => {
                if (imageList.length)
                    return imageList.reduce((prev, imageUrl) => prev
                        .then(() => getImageBuffer(imageUrl))
                        .then(buffer => addImage({doc, buffer, options})), Promise.resolve());
                else return doc;
            })
            .then(doc => doc.end());
}

module.exports = createPdf;