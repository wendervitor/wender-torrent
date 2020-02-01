'use strict';

const download = require('./download');
const torrentParser = require('./torrent-parser');

const torrent = torrentParser.open('./assets/ebook.torrent');

download(torrent, torrent.info.name);
