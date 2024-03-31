import {Chat} from './chat.js';
import {PeerConnection} from "./peer-connection.js";


//For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC2og5VzzMRMv-y7LzBaBbR8ESTlIAUcgA",
    authDomain: "spacify-a1301.firebaseapp.com",
    databaseURL: "https://spacify-a1301-default-rtdb.firebaseio.com",
    projectId: "spacify-a1301",
    storageBucket: "spacify-a1301.appspot.com",
    messagingSenderId: "589698052917",
    appId: "1:589698052917:web:927fea7a9781a9ffa6527c",
    measurementId: "G-22SM67YV1H"
  };
// Initialize Firebase app
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const provider = new firebase.auth.GoogleAuthProvider();

const authDialog = document.getElementById('auth-dialog');
const loginBtn = document.getElementById('sBtn');
const signupBtn = document.getElementById('suBtn');
const logoutBtn = document.getElementById('logoutBtn');
const deleteAccBtn = document.getElementById('deleteAccountBtn');
const reportBtn = document.getElementById('reportBtn');
const fullscreenButton = document.getElementById('fullscreenButton');
const exitFullscreenBtn = document.querySelector('.exit-fullscreen-btn');
const body = document.body;

let peerConnection;
let chat;
let nsfwCounter = 0;


document.getElementById("startPairing").addEventListener("click", async () => {
    peerConnection.setState("CONNECTING");
    peerConnection.sdpExchange.send(JSON.stringify({name: "PAIRING_START"}))
    
});

document.getElementById("abortPairing").addEventListener("click", () => {
    peerConnection.sdpExchange.send(JSON.stringify({name: "PAIRING_ABORT"}))
    peerConnection.disconnect("LOCAL");
})

document.getElementById("leavePairing").addEventListener("click", () => {
    peerConnection.sendBye();
});

window.addEventListener("beforeunload", () => {
    if (peerConnection.state === "CONNECTED") {
        peerConnection.sendBye();
    }
});

// Listen for changes to the user's email verification status
firebase.auth().onIdTokenChanged(async (user) => {
  if (user) {
    // Check if the user's email is verified
    if (user.emailVerified) {
      console.log('Email verified');
      // Allow access to the application or desired features
      // You can also update the user's data in the database if needed
      const userRef = database.ref('users/' + user.uid);
      await userRef.update({ emailVerified: true });
    } else {
      console.log('Email not verified');
      // Prompt the user to verify their email or show a restricted view
    }
  }
});



// Event listeners
loginBtn.addEventListener('click', () => {
    login();
});
signupBtn.addEventListener('click', () => {
  signup();
});

document.getElementById('gSignUpBtn').addEventListener('click', () => {
  const verifyCheckbox = document.getElementById('verify');

  // Check if the 18+ checkbox is checked
  if (verifyCheckbox.checked) {
    // Sign in with Google
    firebase.auth().signInWithPopup(provider)
      .then(result => {
        // Get the user's credential and additional user info
        const credential = result.credential;
        const user = result.user;

        // Save user data to the database
        const userRef = firebase.database().ref('users/' + user.uid);
        userRef.set({
          email: user.email,
          reports: 0,
          online: true,
          disabled: false
        });

        console.log('User signed up with Google:', user.uid);
      })
      .catch(error => {
        console.error('Error signing up with Google:', error);
      });
  } else {
    alert('Please confirm that you are 18+ and agree with our policies.');
  }
});

// Sign In with Google
document.getElementById('gSignInBtn').addEventListener('click', () => {
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      // Get the user's credential and additional user info
      const credential = result.credential;
      const user = result.user;

      console.log('User logged in with Google:', user.uid);
    })
    .catch(error => {
      console.error('Error logging in with Google:', error);
    });
});

logoutBtn.addEventListener('click', () => {
  logout();
});
deleteAccBtn.addEventListener('click', () => {
    deleteAccount();
});

fullscreenButton.addEventListener('click', () => {
  body.classList.toggle('fullscreen');
});

exitFullscreenBtn.addEventListener('click', () => {
    body.classList.remove('fullscreen');
});

function login() {
  const email = document.getElementById('signin-email').value;
  const password = document.getElementById('signin-password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      // Check if the user's email is verified
      if (user.emailVerified) {
        // Check if the user is disabled
        const userRef = database.ref('users/' + user.uid);
        userRef.once('value', snapshot => {
          const userData = snapshot.val();
          if (userData && userData.disabled) {
            // User is disabled, prevent login
            console.log('User account is disabled. Cannot log in.');
            // You can display an error message to the user indicating their account is disabled
            return;
          } else {
            // User is not disabled, proceed with login
            console.log('User logged in');
            authDialog.style.display = 'none';
          }
        });
      } else {
        // User's email is not verified
        alert('Your email is not verified. Please check your inbox for the verification email and verify your email address.');
      }
    })
    .catch(error => {
      console.error('Login error:', error);
    });
}

// Call the checkEmailVerification function when needed
// function checkEmailVerification() {
//   const user = auth.currentUser;

//   if (user && !user.emailVerified) {
//     // User's email is not verified
//     console.log('Email not verified');
//     // You can prompt the user to verify their email or show a restricted view
//   } else {
//     // User's email is verified
//     console.log('Email verified');
//     // Allow access to the application or desired features
//   }
//

function signup() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const verifyCheckbox = document.getElementById('verify');

  // Check if the 18+ checkbox is checked
  if (verifyCheckbox.checked) {
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        const user = userCredential.user;
        console.log('User signed up:', user.uid);

        // Send email verification
        user.sendEmailVerification()
          .then(() => {
            console.log('Email verification sent');
            // Save user data to the database
            const userRef = database.ref('users/' + user.uid);
            userRef.set({
              email: user.email,
              emailVerified: false,
              reports: 0,
              online: false,
              disabled: false
            });

            authDialog.style.display = 'none';
            alert('A verification email has been sent to your email address. Please verify your email to complete the sign-up process.');
          })
          .catch(error => {
            console.error('Error sending email verification:', error);
          });
      })
      .catch(error => {
        console.error('Signup error:', error);
      });
  } else {
    alert('Please confirm that you are 18+ and agree with our policies.');
  }
}

function logout() {
    const confirmLogout = confirm('Are you sure you want to log out?');
    if (confirmLogout) {
        auth.signOut()
          .then(() => {
            console.log('User logged out');
            authDialog.style.display = 'flex';
            location.reload();
          })
          .catch(error => {
            console.error('Logout error:', error);
          });
    }
}

function deleteAccount() {
    const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmDelete) {
        const user = auth.currentUser;
        user.delete()
          .then(() => {
            console.log('User account deleted');
            authDialog.style.display = 'flex';
            location.reload();
          })
          .catch(error => {
            console.error('Account deletion error:', error);
          });
    }
}
function initializePeerConnection() {
  // Only initialize peer connection if user is logged in
  if (auth.currentUser) {
      peerConnection = new PeerConnection({
          onLocalMedia: stream => document.getElementById("localVideo").srcObject = stream,
          onRemoteMedia: stream => document.getElementById("remoteVideo").srcObject = stream,
          onChatMessage: message => chat.addRemoteMessage(message),
          onStateChange: state => {
              document.body.dataset.state = state;
              chat.updateUi(state);
          }
      });

      chat = new Chat(peerConnection);
  } else {
      // User is not logged in, handle the case accordingly
      console.error("User not logged in. Peer connection not initialized.");
  }
}


export function checkAuthState() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {

      document.getElementById('logoutBtn').style.display = 'block';
      document.getElementById('deleteAccountBtn').style.display = 'block';
      // Update user's online status to true
      const userRef = database.ref('users/' + user.uid);
      userRef.update({ online: true })
        .then(() => {
          authDialog.style.display = 'none';

          // Call the checkEmailVerification function
          checkEmailVerification(user);
        })
        .catch(error => {
          console.error('Error updating user online status:', error);
        });
    } else {
      document.getElementById('logoutBtn').style.display = 'none';
      document.getElementById('deleteAccountBtn').style.display = 'none';
      authDialog.style.display = 'flex';
    }
  });
}

function checkEmailVerification(user) {
  if (user && user.emailVerified) {
    // User's email is verified
    // Initialize the necessary functionality
    initializePeerConnection();
    initNSFWDetection();

    // Allow access to the application or desired features
  } else {
    // User's email is not verified
    alert('Email not verified');
    // You can prompt the user to verify their email or show a restricted view
  }
}



window.addEventListener('scroll', function() {
  const fixedDiv = document.getElementById('nextpage');
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  const fixedDivHeight = fixedDiv.offsetHeight;
  const fixedDivTop = fixedDiv.offsetTop;

  if (scrollPosition >= fixedDivTop + fixedDivHeight) {
    fixedDiv.classList.add('fixed');
    requestAnimationFrame(() => {
      fixedDiv.classList.add('show');
    });
  } else {
    fixedDiv.classList.remove('show');
    requestAnimationFrame(() => {
      fixedDiv.classList.remove('fixed');
    });
  }
});



document.addEventListener("DOMContentLoaded", function() {


  const delayTime = 3000;

  // Function to hide the splash screen after the delay
  function hideSplashScreen() {
      const splashScreen = document.querySelector('.splash-screen');
      splashScreen.style.display = 'none';
  }

  // Hide the splash screen after the delay time
  setTimeout(hideSplashScreen, delayTime);

  function handleEscapeKey(event) {
    if (event.keyCode === 27) { // Check if the pressed key is "Escape"
      // Trigger the appropriate action based on the peer connection state
      switch (peerConnection.state) {
        case "CONNECTING":
          // Trigger the "abortPairing" event
          document.getElementById("abortPairing").click();
          break;
        case "CONNECTED":
          // Trigger the "leavePairing" event
          document.getElementById("leavePairing").click();
          break;
        default:
          // Trigger the "startPairing" event
          document.getElementById("startPairing").click();
      }
    }
  }
  fullscreenButton.addEventListener("click", function() {
      // Scroll to the top of the page
      window.scrollTo({
          top: 0,
          behavior: "smooth" 
      });
  });
  document.addEventListener("keydown", handleEscapeKey);
});


const screenshots = document.querySelector('.screenshots');
const middleImage = screenshots.querySelector('img:not([id])');
const otherImages = screenshots.querySelectorAll('img[id]');
const initialGap = 1; // Set the initial gap value in pixels
let maxGap = 50; // Set the maximum gap value in pixels

middleImage.classList.add('middle');

window.addEventListener('scroll', () => {
  const scrollPosition = window.pageYOffset;
  const viewportHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

  const scrollPercentage = scrollPosition / (documentHeight - viewportHeight);
  const gap = initialGap + (maxGap - initialGap) * scrollPercentage;

  otherImages.forEach((image) => {
    const isLeftImage = image.id === 'ss1' || image.id === 'ss2';
    const translation = isLeftImage ? -gap : gap;
    image.style.transform = `translateX(${translation}px)`;
  });
});

async function initNSFWDetection() {
  // Load NSFWJS model
  const model = await nsfwjs.load("MobileNetV2Mid");

  // Function to check if a frame from the video stream is NSFW
  async function checkNSFW(frame) {
    // Classify the frame
    const predictions = await model.classify(frame);

    // Check if any of the predictions indicate NSFW content
    for (const prediction of predictions) {
      if ((prediction.className === 'Porn' || prediction.className === 'Hentai') && prediction.probability > 0.5) {
        const videoElement = document.getElementById('remoteVideo');
        videoElement.classList.add('blurred');
        return;
      } else {
        const videoElement = document.getElementById('remoteVideo');
        videoElement.classList.remove('blurred');
      }
    }
  }

  // Start video stream and NSFW moderation
  async function startVideo() {
    const localVideoElement = document.getElementById('localVideo');
    const remoteVideoElement = document.getElementById('remoteVideo');

    // Classify each frame from the local video stream
    localVideoElement.addEventListener('play', () => {
      setInterval(async () => {
        // Capture current frame from the local video stream
        const localFrame = localVideoElement;
        
        // Classify the local frame
        const predictions = await model.classify(localFrame);

        // Check if any of the predictions indicate NSFW content
        for (const prediction of predictions) {
          if ((prediction.className === 'Porn' || prediction.className === 'Hentai') && prediction.probability > 0.5) {
            nsfwCounter++;
            console.log('NSFW content found');

            if (nsfwCounter >= 7) {
              const warnImage = document.querySelector('.warn');
              warnImage.style.display = "flex" ;

              function hideWarnImage() {
                warnImage.style.display = "none" ;
            }
              setTimeout(hideWarnImage, 5000);
            }

            // Check if the user has reached the maximum NSFW detections
            if (nsfwCounter >= 20) {
              const user = auth.currentUser;
              const userRef = database.ref('users/' + user.uid);

                // Update the 'disabled' boolean to true
                userRef.update({ disabled: true })
               .then(() => {
                 console.log('User account disabled in the database');
               });

          // Increment the user's report count using a transaction
             userRef.child('reports').transaction(currentReports => {
            // If there are no current reports, initialize to 1
              if (currentReports === null) {
                 return 0;
               } else {
                  // Increment the current report count
                    return currentReports + 1;
                   }
                  }).then(() => {
                   console.log('User report count updated successfully');
                 }).catch(error => {
                    console.error('Error updating user report count:', error);
                });

              // Sign out the user
              auth.signOut()
                .then(() => {
                  console.log('User logged out due to excessive NSFW content');
                  authDialog.style.display = 'flex';
                  nsfwCounter = 0; // Reset the counter
                  location.reload();
                })
                .catch(error => {
                  console.error('Logout error:', error);
                });
            }
          }
        }
      }, 1000); // Check every 1 second
    });

    remoteVideoElement.addEventListener('play', () => {
      setInterval(async () => {
        // Capture current frame from the remote video stream
        const remoteFrame = remoteVideoElement;
        // Check if the remote frame is NSFW
        await checkNSFW(remoteFrame);
      }, 1000); // Check every 1 second
    });
  }

  startVideo();
}

window.addEventListener('load', () => {
  checkAuthState();

  // Listen for changes in online status and update count
  const onlineStatusRef = database.ref('users').orderByChild('online').equalTo(true);
  onlineStatusRef.on('value', snapshot => {
    const onlineUsersCount = snapshot.numChildren();
    document.getElementById('.onlineStatus').innerText = "Online: " + onlineUsersCount.toString();
  });
});

// Update user's online status to false when closing the site
window.addEventListener('beforeunload', () => {
  const user = auth.currentUser;
  if (user) {
    const userRef = database.ref('users/' + user.uid);
    userRef.update({ online: false })
      .then(() => {
        console.log('User online status updated to false');
      })
      .catch(error => {
        console.error('Error updating user online status:', error);
      });
  }
});
