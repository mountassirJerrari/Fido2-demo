const User = require("../models/user");
const base64 = require("base64-arraybuffer");
const { Fido2Lib } = require("fido2-lib");
// instanciation of the fido2 lib
const f2l = new Fido2Lib({
  timeout: 1231,
  rpId: process.env.RP_ID,
  rpName: process.env.RP_NAME,
  origin: process.env.ORIGIN,
  challengeSize: 32,
  attestation: "direct",
  cryptoParams: [-7, -257],
  authenticatorAttachment: "platform",
  authenticatorRequireResidentKey: false,
  authenticatorUserVerification: "required",
});
//authentication handler
const authenticationReq = async (req, res) => {
  /*
   {
        "username": "johndoe@example.com",
        "userVerification": "required"
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
          transports: ["internal"],
        });
      }
    }

    const authnOptions = await f2l.assertionOptions();
    authnOptions.challenge = base64.encode(authnOptions.challenge);
    authnOptions.allowCredentials = allowCredentials;
    req.session.challenge = authnOptions.challenge;
    res.status(200).json(authnOptions);
  } catch (e) {
    res.status(400).json({ error: e });
  }
};
const authenticationRes = async (req, res) => {
  /*
  the expected body  :
  {
        "id":"LFdoCFJTyB82ZzSJUHc-c72yraRc_1mPvGX8ToE8su39xX26Jcqd31LUkKOS36FIAWgWl6itMKqmDvruha6ywA",
        "rawId":"LFdoCFJTyB82ZzSJUHc-c72yraRc_1mPvGX8ToE8su39xX26Jcqd31LUkKOS36FIAWgWl6itMKqmDvruha6ywA",
        "response":{
            "authenticatorData":"SZYN5YgOjGh0NBcPZHZgW4_krrmihjLHmVzzuoMdl2MBAAAAAA",
            "signature":"MEYCIQCv7EqsBRtf2E4o_BjzZfBwNpP8fLjd5y6TUOLWt5l9DQIhANiYig9newAJZYTzG1i5lwP-YQk9uXFnnDaHnr2yCKXL",
            "userHandle":"",
            "clientDataJSON":"eyJjaGFsbGVuZ2UiOiJ4ZGowQ0JmWDY5MnFzQVRwe..."
        },
        "type":"public-key"
    }
  */
  try {
    const username = req.session.user.username;
    const user = await User.findOne({ username: username });

    const logResponse = req.body;

    let thisCred, challenge;

    challenge = req.session.challenge;

    const credList = user.credentials;
    const credListFiltered = credList.filter(
      (x) => x.credId == logResponse.rawId
    );

    if (!credListFiltered.length) {
      return res.status(400).json({ error: "Authenticator is not registred" });
    }
    thisCred = credListFiltered.pop();
    logResponse.rawId = base64.decode(logResponse.rawId);
    logResponse.response.authenticatorData = base64.decode(
      logResponse.response.authenticatorData
    );
    const assertionExpectations = {
      challenge: challenge,
      origin: process.env.ORIGIN,
      factor: "either",
      publicKey: thisCred.publicKey,
      prevCounter: thisCred.counter,
      userHandle: null,
    };
    console.log(logResponse); 
    let logResult = await f2l.assertionResult(
      logResponse,
      assertionExpectations
    );
    user.credentials = user.credentials.map((cred) => {
      if ((cred.credId = logResponse.rawId)) {
        cred.counter = logResult.authnrData.get("counter");
      }
      return cred
    });
    await user.save();
    req.session.auth = true;
    delete req.session.challenge;
    return res.json({ logedin: true });
  } catch (error) {
    delete req.session.challenge;
    return res.status.json({ error });
  }
};

module.exports = { authenticationReq, authenticationRes };
