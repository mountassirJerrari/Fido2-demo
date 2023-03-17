// POST registrationrequest

function registerRequest() {
  const username = document.getElementById("username").value;
  if (username.length == 0) {
    showError("please provide a username");
    return;
  }
  axios({
    method: "post",
    url: `${window.origin}/auth/registerRequest`,
    data: {
      username: username,
      attOptions: {
        authenticatorSelection: {
          residentKey: false,
          authenticatorAttachment: "cross-platform",
          userVerification: "preferred",
        },
        attestation: "direct",
      },
    },
  })
    .then((res) => {
      if (res.status == 200) {
        console.log("creating credential ...");
        createCredential(res.data);
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

function registerResponse(credential) {
  try {
    axios({
      method: "post",
      url: `${window.origin}/auth/registerResponse`,
      data: credential,
    })
      .then((res) => {
        showMessage("successful registration !");
      })
      .catch((err) => {
        if (err.response.data?.error) {
          showError(err.response.data?.error);
        } else {
          showError("error in the network");
        }
      });
  } catch (error) {
    console.log(
      "axios ressources missing 2: a network issue  , check your internet connection"
    );
  }
}

async function createCredential(options) {
  try {
    
  
  options.user.id = base64.decode(options.user.id);

  options.challenge = base64.decode(options.challenge);

  if (options.excludeCredentials) {
    for (let cred of options.excludeCredentials) {
      cred.id = base64.decode(cred.id);
    }
  }
  console.log(options);
  const cred = await navigator.credentials.create({
    publicKey: options,
  });
  console.log(cred);

  const credential = {};
  credential.id = cred.id;
  credential.rawId = base64.encode(cred.rawId);
  credential.type = cred.type;

  if (cred.response) {
    const clientDataJSON = base64.encode(cred.response.clientDataJSON);
    const attestationObject = base64.encode(cred.response.attestationObject);
    credential.response = {
      clientDataJSON,
      attestationObject,
    };
  }

  registerResponse(credential);
} catch (error) {
  showError(error);
}
}

// Show output in browser

function showError(error) {
  gsap.from("#message", { y: "40px", opacity: 100, duration: 0.4 });
  document.getElementById("message").style.display = "block";
  document.getElementById("message").innerHTML = error;
  gsap.to("#message", { opacity: 0, duration: 1, delay: 5 });
  gsap.to("#message", { opacity: 100, delay: 7 });
  const i = setInterval(() => {
    document.getElementById("message").style.display = "none";
    document.getElementById("message").innerHTML = "";
    clearInterval(i);
  }, 6000);
}
function showMessage(successMessage, switchIt = true) {
  gsap.from("#successMessage", { y: "40px", opacity: 100, duration: 0.4 });
  document.getElementById("successMessage").style.display = "block";
  document.getElementById("successMessage").innerHTML = successMessage;
  gsap.to("#successMessage", { opacity: 0, duration: 1, delay: 5 });
  gsap.to("#successMessage", { opacity: 100, delay: 7 });
  if (switchIt) toAuthenticationAnim();
  const i = setInterval(() => {
    document.getElementById("successMessage").style.display = "none";
    document.getElementById("successMessage").innerHTML = "";
    clearInterval(i);
  }, 9000);
}

// authentication section
function auhenticateRequest() {
  const username = document.getElementById("username").value;
  if (username.length == 0) {
    showError("please provide a username");
    return;
  }

  axios({
    method: "post",
    url: `${window.origin}/auth/authRequest`,
    data: {
      username: username,
      userVerification: "required",
    },
  })
    .then((res) => {
      if (res.status == 200) {
        getCredential(res.data);
        console.log(res.data);
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

async function getCredential(options) {
  try {
    if (options.allowCredentials.length === 0) {
      showError("No registered credentials found.");
      return;
    }

    options.challenge = base64.decode(options.challenge);

    for (let cred of options.allowCredentials) {
      cred.id = base64.decode(cred.id);
    }

    const cred = await navigator.credentials.get({
      publicKey: options,
    });

    const credential = {};
    credential.id = cred.id;
    credential.type = cred.type;
    credential.rawId = base64.encode(cred.rawId);

    if (cred.response) {
      const clientDataJSON = base64.encode(cred.response.clientDataJSON);
      const authenticatorData = base64.encode(cred.response.authenticatorData);
      const signature = base64.encode(cred.response.signature);
      const userHandle = base64.encode(cred.response.userHandle);
      credential.response = {
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle,
      };
    }
    console.log(credential);
    authResponse(credential);
  } catch (err) {
    showError(err);
    return;
  }
}
function authResponse(credential) {
  try {
    axios({
      method: "post",
      url: `${window.origin}/auth/authResponse`,
      data: credential,
    })
      .then((res) => {
        showMessage("successful authentication", false);
        const i = setInterval(() => {
          window.location.replace(`${window.origin}/profile`)
          clearInterval(i);
        }, 1000);
      })
      .catch((err) => {
        if (err.response.data?.error) {
          showError(err.response.data?.error);
        } else {
          showError(err);
        }
      });
  } catch (error) {
    console.log(
      "axios ressources missing 2: a network issue  , check your internet connection"
    );
  }
}
