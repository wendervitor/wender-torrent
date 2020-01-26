'use strict'

//reference: http://www.bittorrent.org/beps/bep_0015.html


const dgram = require('dgram'); //udp datagram socket
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;
const crypto = require('crypto');

const torrentParser = require('./torrent-parser');
const util = require('./util');


module.exports.getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');
  const url = torrent.announce.toString('utf8');
  

  udpSend(socket, buildConnReq(), url);

  socket.on('message', response => {
    if (respType(response) === 'connect') {
      const coonResp = parseConnResp(response);
      const announceReq = buildAnnounceReq(coonResp.conectionId,torrent);
      udpSend(socket, announceReq, url);
    }
    else if (respType(response) === 'announce') {
      const announceResp = parseAnnounceResp(response);
      callback(announceResp.peers);
    }
  });
};

function udpSend(socket, message, rawUrl, callback = () => { }) {
  const url = urlParse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.hostname, callback);
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if(action === 0) return 'connect';
  if(action === 1) return 'announce';
}

function buildConnReq() { //request the connection with tracker
  const buf = Buffer.alloc(16);

  //connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  //action
  buf.writeUInt32BE(0, 8);
  //transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) { //parse the response of connection request
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    conectionId: resp.slice(8)
  }
}

function buildAnnounceReq(connId, torrent, port=6882) { //request the announce
  const buf = Buffer.allocUnsafe(98);
  
  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peerId
  util.genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  torrentParser.size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize){//addres comes in groups of 6 bytes, 4 fr ip and 2 for tcp port
    let groups = [];
    for(let i=0;i < iterable.length; i += groupSize){
      groups.push(iterable.slice(i, i+groupSize));
    }
    return groups;
  }
  return{
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map(address => {
      return{
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  };
}