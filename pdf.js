const PDFDocument = require('pdfkit');
const fetch = require("node-fetch");
const imageSize = require('buffer-image-size');
const fs = require("fs");
const path = require("path");

function getImageBuffer(url){
    return fetch(url)
        .then(response => response.buffer())
}

function addImage({doc, buffer, options: {filename="output.pdf", directory=__dirname}}){
    // if no document created document with initial page of image size
    // otherwise adds another page for image with same parameters
    // images has full size

    const {width, height} = imageSize(buffer);
    const dimensions = {width, height};

    if (!doc) {
        doc = new PDFDocument({margin: 0, size: Object.values(dimensions)});
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, {recursive: true});
        doc.pipe(fs.createWriteStream(path.join(directory, filename)));
    }
    else doc.addPage({margin: 0, size: Object.values(dimensions)});
    doc.image(buffer, dimensions);
    return doc;
}

function createPdf(imageList, options){
    // initial image
    if (imageList)
        getImageBuffer(imageList.shift())
            .then(buffer => addImage({buffer, options}))
            // all other images this way
            .then(doc => {
                return imageList.reduce(async (prev, imageUrl) => {
                    await prev;
                    const buffer = await getImageBuffer(imageUrl);
                    return addImage({doc, buffer, options});
                }, Promise.resolve());
            })
            .then(doc => doc.end());
}

module.exports = createPdf;