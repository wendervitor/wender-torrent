'use strict'

const fs = require('fs'); //file reader
const bencode = require('bencode'); //bencode parser
const dgram = require('dgram'); //udp datagram socket
const Buffer = require('buffer').Buffer;
const urlParse = require('url').parse;

const file = fs.readFileSync('puppy.torrent'); //easiest way to read a file, but return a buffer
const torrent=bencode.decode(file);

const url = urlParse(torrent.announce.toString('utf8'));//tracker url

const socket = dgram.createSocket('udp4');
const myMsg = Buffer.from('hello?', 'utf8');//mensagenneds to be send in buffer type

socket.send(myMsg,0,myMsg.length,url.port,url.host,()=>{
    console.log('sent');
});

socket.on('message', msg =>{
    console.log('message is', msg);
});

console.log(torrent.announce.toString('utf8'));