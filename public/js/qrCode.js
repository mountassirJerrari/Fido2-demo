
async function registerRequestQr() {

    const username = document.getElementById("username").value;
    if (username.length == 0) {
        showError("please provide a username");
        return;

    }
    axios({
        method: "post",
        url: `${window.origin}/auth/registerRequestQr`,
        data: {
            username: username,
        },
    })
        .then((res) => {
            if (res.status == 200) {
                console.log("creating credential ...");
                console.log(res.data);
                startRegisterQRceremony(res.data)
            }
        })
        .catch((err) => {
            if (err.response?.data?.error) {
                showError(err.response?.data?.error);
            } else {
                showError(err);
            }
        });
}

async function autheticationRequestQr() {

    const username = document.getElementById("username").value;
    if (username.length == 0) {
        showError("please provide a username");
        return;

    }
    axios({
        method: "post",
        url: `${window.origin}/auth/authRequestQr`,
        data: {
            username: username,
        },
    })
        .then((res) => {
            if (res.status == 200) {
                console.log("creating credential ...");
                console.log(res.data);
                startAuthQRceremony(res.data)
            }
        })
        .catch((err) => {
            if (err.response?.data?.error) {
                showError(err.response?.data?.error);
            } else {
                showError(err);
            }
        });
}
//qr ceremenony
async function startRegisterQRceremony(options) {

    let roomId;

    const socket = io("https://grape-alder-page.glitch.me") ;
    socket.on('roomJoined', (room) => {
        console.log(room);
        document.getElementById('canvasContainer').style.display = "flex";
        QRCode.toCanvas(document.getElementById('canvas'), room, function (error) {
            if (error) console.error(error)
            console.log('success!');
        })
        roomId = room
    })
    socket.on('authenticatorReady', () => {
        console.log("authenticatorReady... ");
        socket.emit('attestationReq', roomId, options);
    })
    socket.on('attestationRes', (attestionRes) => {
        axios({
            method: "post",
            url: `${window.origin}/auth/registerResponseQr`,
            data: {
                attestationObject: attestionRes,
            },
        })
            .then((res) => {
                if (res.status == 200) {
                    showMessage("successful regsitration", false);
                    document.getElementById('canvasContainer').style.display = "none";
                    socket.off();
                    
                }
            })
            .catch((err) => {
                if (err.response?.data?.error) {
                    showError(err.response?.data?.error);
                } else {
                    showError(err);
                }
            });
    })

}

async function startAuthQRceremony(options) {

    let roomId;

    const socket = io("https://grape-alder-page.glitch.me")
    socket.on('roomJoined', (room) => {
        console.log(room);
        document.getElementById('canvasContainer').style.display = "flex";
        QRCode.toCanvas(document.getElementById('canvas'), room, function (error) {
            if (error) console.error(error)
            console.log('success!');
        })
        roomId = room
    })
    socket.on('authenticatorReady', () => {
        console.log("authenticatorReady... ");
        socket.emit('assertionReq', roomId, options);
    })
    socket.on('assertionRes', (assertionRes) => {
        
        axios({
            method: "post",
            url: `${window.origin}/auth/authResponseQr`,
            data: {
                attestationObject: assertionRes,
            },
           })
            .then((res) => {
                if (res.status == 200) {
                    showMessage("successful authentication", false);
                    document.getElementById('canvasContainer').style.display = "none";
                }
            })
            .catch((err) => {
                if (err.response?.data?.error) {
                    showError(err.response?.data?.error);
                } else {
                    showError(err);
                }
            });
    })

}






// let roomId;

// const socket = io("http://localhost:8000")
// socket.on('roomJoined', (room) => {
//     QRCode.toCanvas(document.getElementById('canvas'), room, function (error) {
//         if (error) console.error(error)
//         console.log('success!');
//     })
//     roomId = room
// })
// socket.on('authenticatorReady', () => {
//     console.log('got that the authenticator is ready')
//     registerRequest();
// })

// function registerRequest() {
//     const username = document.getElementById("username").value;
//     if (username.length == 0) {
//         console.log("please provide a username");
//         return;
//     }

//     axios({
//         method: "post",
//         url: `${window.origin}/auth/registerRequestTest`,
//         data: {
//             username: username,
//         },
//     })
//         .then((res) => {
//             if (res.status == 200) {

//                 socket.emit("attestationReq", roomId, res.data)
//                 socket.on('attestationRes', attestation => {
//                     console.log(attestation);
//                     registerResponse(attestation);
//                 })
//             }
//         })
//         .catch((err) => {
//             if (err.response?.data?.error) {
//                 console.log(err.response?.data?.error);
//             } else {
//                 console.log(err);
//             }
//         });
// }
// function registerResponse(attestation) {
//     try {
//         axios({
//             method: "post",
//             url: `${window.origin}/auth/registerResponseTest`,
//             data: attestation,
//         })
//             .then((res) => {
//                 console.log("successful registration !");
//             })
//             .catch((err) => {
//                 if (err.response.data?.error) {
//                     console.log(err.response.data?.error);
//                 } else {
//                     console.log("error in the network");
//                 }
//             });
//     } catch (error) {
//         console.log(
//             "axios ressources missing 2: a network issue  , check your internet connection"
//         );
//     }
// }

