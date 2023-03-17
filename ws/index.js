const { io } = require('../server')
const crypto = require('crypto')
const base64 = require('base64-arraybuffer')


io.on('connection', (socket) => {
    //generate a roomId and joind the browser client on the first connection to the websocket 
    const roomId = base64.encode(crypto.randomBytes(32));
    socket.join(roomId);
    console.log(socket.id);
    io.to(socket.id).emit('roomJoined', roomId);
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(socket.id+"just joined the group  "+roomId)
        socket.to(roomId).emit('authenticatorReady')
    })
    //handling the authentication communication over the webSoceket
    socket.on('attestationReq', (roomId,options) => {
        socket.to(roomId).emit('attestationReq', options)
    })
    socket.on('attestationRes', (roomId, attestation) => {
        socket.to(roomId).emit("attestationRes", attestation)
       
    })
    socket.on('assertionReq', (roomId,options) => {
        console.log("assertionReq............................");
        socket.to(roomId).emit('assertionReq', options)
    })
    socket.on('assertionRes', (roomId, assertion) => {
        socket.to(roomId).emit("assertionRes", assertion)
       
    })
})






