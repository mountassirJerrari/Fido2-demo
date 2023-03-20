const User = require('../models/user')
const crypto = require('crypto')
require("dotenv").config();
const base64 = require('base64-arraybuffer')
const { Fido2Lib } = require("fido2-lib");

const f2l = new Fido2Lib({
  timeout: 120000,
  rpId: process.env.RP_ID,
  rpName: process.env.RP_NAME,
  challengeSize: 32,
  attestation: "direct",
  cryptoParams: [-7, -257],
  authenticatorAttachment: "platform",
  authenticatorRequireResidentKey: false,
  authenticatorUserVerification: "required"
});
// regsitration request handler
const registrationReq = async (req, res) => {

  // exptected Body .
  /**
    {
      username: "username",
      attOptions: {
        authenticatorSelection: {
          residentKey: false,
          authenticatorAttachment: "cross-platform",
          userVerification: "preferred",
        },
        attestation: "direct",
      },
    }
   */
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




    const registrationOptions = await f2l.attestationOptions();
    registrationOptions.challenge = base64.encode(registrationOptions.challenge)
    registrationOptions.user.id = user.id;
    registrationOptions.user.name = user.username;
    registrationOptions.user.displayName = user.username;

    // this object will be saved to the session and to be used in registration Response
    const attestationExpectations = {
      challenge: registrationOptions.challenge,
      origin: process.env.ORIGIN,
      factor: "either"
    };
    req.session.attestationExpectations = attestationExpectations;

    res.status(200).json(registrationOptions)
    return;
  } catch (e) {

    res.status(400).json({ error: e });
    return;
  }
}
const registrationRes = async (req, res) => {
  /*
  the response in the body
  
  {
        "rp": {
            "name": "Example Corporation"
        },
        "user": {
            "id": "S3932ee31vKEC0JtJMIQ",
            "name": "johndoe@example.com",
            "displayName": "John Doe"
        },

        "challenge": "uhUjPNlZfvn7onwuhNdsLPkkE5Fv-lUN",
        "pubKeyCredParams": [
            {
                "type": "public-key",
                "alg": -7
            }
        ],
        "timeout": 10000,
        "excludeCredentials": [
            {
                "type": "public-key",
                "id": "opQf1WmYAa5aupUKJIQp"
            }
        ],
        "authenticatorSelection": {
            "residentKey": false,
            "authenticatorAttachment": "cross-platform",
            "userVerification": "preferred"
        },
        "attestation": "direct"
    }
  */

  try {

    const { body } = req;
    const username = req.session.user.username;
    const { attestationExpectations } = req.session;
    body.rawId = base64.decode(body.rawId)


    console.log(body);
    const regResult = await f2l.attestationResult(body, attestationExpectations);
    const user = await User.findOne({ username: username })
    const authnrData = regResult.authnrData;
    const credId = base64.encode(authnrData.get("credId"))
    const counter = authnrData.get("counter")
    const credential = {
      counter: counter,
      publicKey: authnrData.get("credentialPublicKeyPem"),
      credId: credId
    }
    //adding the new credential
    const existingCred = user.credentials.find(
      (cred) => cred.credID === credId,
    );


    if (!existingCred) {
      user.credentials.push(credential);
    }



    await user.save();
    //delete the session  attestationExpectations
    
    delete req.session.attestationExpectations;

    // Respond with user info
    ;
    res.status(200).json({ message: 'you are registred :)' });
    return;

  } catch (e) {
    
    delete req.session.attestationExpectations;
    res.status(400).send({ error: e.message });
    return
  }
}



module.exports = { registrationReq, registrationRes }