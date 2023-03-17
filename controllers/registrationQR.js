const User = require('../models/user')
const crypto = require('crypto')
const EC = require('elliptic').ec;
require("dotenv").config();
const base64 = require('base64-arraybuffer')


const registrationReqQr = async (req, res) => {

    let username = req.session.user.username
    let user = await User.findOne({ username: username });

    // If user entry is not created yet, create one
    if (!user) {
        user = {
            username: username,
            id: base64.encode(crypto.randomBytes(32)),
            credentials: [],
        };
        user = await User.create(user);
    }

    try {
        const excludeCredentials = [];
        if (user.credentials.length > 0) {
            for (let cred of user.credentials) {
                excludeCredentials.push({
                    id: cred.credId,
                    type: 'public-key',
                    transports: ['internal'],
                });
            }
        }

        let registrationOptions = {}
        registrationOptions.challenge = base64.encode(crypto.randomBytes(32));

        registrationOptions.user = { id: user.id };
        registrationOptions.origin = process.env.ORIGIN
        const attestationExpectations = {
            challenge: registrationOptions.challenge,
            origin: process.env.ORIGIN,
        };
        req.session.attestationExpectations = attestationExpectations;

        /*
        the response : {
            challenge : "qdjqlkjdqljdqlkcncsdc";
            user : {
                id : "qkdjqljdlqkjdlqclqkc"
            }
            origin : "the origin | localhost"
        }
         */
        res.status(200).json(registrationOptions)
        return;
    } catch (e) {
        console.log(e);
        res.status(400).json({ error: e });
        return;
    }
}
const registrationResQr = async (req, res) => {

    try {

        const { signature, cred } = req.body.attestationObject;
        let exptected = req.session.attestationExpectations.challenge + '.' + req.session.attestationExpectations.origin + '.' + cred.publicKey;

        const ec = new EC('secp256k1');
        let pub = ec.keyFromPublic(cred.publicKey, 'hex');
        const isValid = pub.verify(exptected, signature)
        console.log(isValid);
        let user = await User.findOne({ username: req.session.user.username })
        //adding the new credential
        let credID = cred.credId;
        const existingCred = user.credentials.find(
            (cred) => cred.credID === credID,
        );

        const credential = {
            counter: null,
            publicKey: cred.publicKey,
            credId: credID
          }
        if (!existingCred) {
            user.credentials.push(credential);
        }



        await user.save();

        delete req.session.attestationExpectations;
        return res.send();

    } catch (e) {
        delete req.session.attestationExpectations;
        console.log(e);
        res.status(400).send({ error: e.message });
        return
    }
}



module.exports = { registrationReqQr, registrationResQr }