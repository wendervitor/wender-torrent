'use strict';

const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');
const bignum = require('bignum');
const path = require('path');

module.exports.open = (filepath) => {
    const filePath = path.join(__dirname, filepath);
    return bencode.decode(fs.readFileSync(filePath));
};

module.exports.infoHash = torrent => {
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha1').update(info).digest();
};

module.exports.size = torrent => {
    const size = torrent.info.files ?
        torrent.info.files.map(file => file.length).reduce((a, b) => a + b) :
        torrent.info.length;
    return bignum.toBuffer(size, { size: 8 });
};
