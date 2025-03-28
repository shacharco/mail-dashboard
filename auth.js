

const CLIENT_ID = "692565867759-09c8aoaonk2v5k00tchnl3qj02asfqdu.apps.googleusercontent.com";
let redirectUri = chrome.identity.getRedirectURL();

// Remove the trailing slash if it exists
if (redirectUri.endsWith('/')) {
  redirectUri = redirectUri.slice(0, -1);
}
const AUTH_URL = `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${redirectUri}&scope=https://www.googleapis.com/auth/gmail.readonly%20https://www.googleapis.com/auth/calendar.readonly`;

async function authenticate() {
    return new Promise((resolve, reject) => {
        console.log("Starting auth:", redirectUri);
        
        chrome.identity.launchWebAuthFlow({ url: AUTH_URL, interactive: true }, function (redirectUrl) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }

            try {
                let params = new URL(redirectUrl).hash.substring(1).split("&");
                let token = params.find(param => param.startsWith("access_token")).split("=")[1];
                console.log("Auth successful:", token);

                chrome.storage.local.set({ gmailAccessToken: token }, () => {
                    resolve(token); // Return the token
                });

            } catch (error) {
                console.error("Error parsing token:", error);
                reject(error);
            }
        });
    });
}
