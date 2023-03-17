const User = require("../models/user");
const crypto = require('crypto')
const EC = require('elliptic').ec;

require("dotenv").config();
const base64 = require('base64-arraybuffer')
// instanciation of the fido2 lib

//authentication handler
const authenticationReqQr = async (req, res) => {
  /*
   {
        "username": "johndoe@example.com",
    }
     */
  const { username } = req.body;
  try {
    const user = await User.findOne({ username: username });

    if (!user) {
      // Send empty response if user is not registered yet.

      res.status(400).json({ error: "User not found. consider registering" });

      return;
    }

    //const userVerification = req.body.userVerification || 'required';

    const allowCredentials = [];

    if (user.credentials) {
      for (let cred of user.credentials) {
        // `credId` is specified and matches

        allowCredentials.push({
          id: cred.credId,
          type: "public-key",
        });
      }
    }

    let authnOptions = {}
    authnOptions.challenge = base64.encode(crypto.randomBytes(32));
    authnOptions.allowCredentials = allowCredentials;
    authnOptions.origin = process.env.ORIGIN ;
    req.session.challenge = authnOptions.challenge;
    res.status(200).json(authnOptions);
  } catch (e) {
    console.log(e);
    res.status(400).json({ error: e });
  }
  //the response :
  /*
  {
    challenge:"sdsfsfsfsdfsdfdsfsccsdscdsdcqqs",
    allowCredentials:[{
      {
          id: "credId",
          type: "public-key",
        }
    }],
    origin:"localhost"
  }
   */
};
const authenticationResQr = async (req, res) => {
  /*
  the expected body  :
  {
        "id":"LFdoCFJTyB82ZzSJUHc-c72yraRc_1mPvGX8ToE8su39xX26Jcqd31LUkKOS36FIAWgWl6itMKqmDvruha6ywA",
        "signature":"dkfqslfdsdnzoeijfzieiuzen"
    }
  */
  try {
    const username = req.session.user.username;
    const user = await User.findOne({ username: username });

    const logResponse = req.body.attestationObject;
    console.log(logResponse);

    let thisCred, challenge;

    challenge = req.session.challenge;

    const credList = user.credentials;
    const credListFiltered = credList.filter(
      (x) => x.credId == logResponse.id
    );

    if (!credListFiltered.length) {
      return res.status(400).json({ error: "Authenticator is not registred" });
    }
    thisCred = credListFiltered.pop();
    
    let exptected = req.session.challenge + '.' + process.env.ORIGIN + '.' + thisCred.publicKey;
        
        const ec = new EC('secp256k1');
        let pub = ec.keyFromPublic(thisCred.publicKey, 'hex');
        const isValid = pub.verify(exptected, logResponse.signature)
        console.log(isValid);
    
    
    await user.save();
    req.session.auth = true;
    delete req.session.challenge;
    return res.json({ logedin: true });
  } catch (error) {
    console.log(error);
    delete req.session.challenge;
    return res.status(400).json({ error });
  }
};

module.exports = { authenticationReqQr, authenticationResQr };
