'use strict';


const download = require('./download');
const torrentParser = require('./torrent-parser');

const torrent = torrentParser.open('./assets/ebook.torrent');

download(torrent);
/*tracker.getPeers(torrent, peers => {
    console.log('list of peers: ', peers);
});*/