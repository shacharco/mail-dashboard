function fetchEmails(startDate, endDate, metrics, cropNum) {
    const querySize = 100;
    let emailIds = [];
    const batchSize = 10;
    let metadatas = [];      
    const start = new Date(startDate);
    const end = new Date(endDate);
    let loadingText = document.getElementById("loadingText");

    chrome.storage.local.get("gmailAccessToken", async function (storage) {
        if (!storage.gmailAccessToken) {
            console.error("No access token found.");
            return;
        }
        try {
            let nextPageToken = null;
            do {
                let data = await fetchEmailsIds(querySize, start, end, nextPageToken, storage.gmailAccessToken)
                nextPageToken = data.nextPageToken;
                emailIds.push(...data.messages);
                const startMetadatas = metadatas.length;
                for (let i = startMetadatas; i < emailIds.length; i+=batchSize) {
                    const idsBatch = emailIds.slice(i, i + batchSize);
                    metadatas.push(...await fetchEmailsMetadataBatch(idsBatch, storage.gmailAccessToken));
                    if (metadatas.length == batchSize || metadatas.length % (batchSize*10) == 0){
                        drawCharts(metadatas, "mails ", metrics, startDate, endDate, cropNum);
                        showMailLoadingPercentage(loadingText, metadatas, start, end);
                    }
                    await new Promise(resolve => setTimeout(resolve, 500)); 
                }
            } while (nextPageToken);
            drawCharts(metadatas, "mails ", metrics, startDate, endDate, cropNum);
            loadingText.innerText = `Done loading ${emailIds.length} emails. Showing `; 
        } catch (error) {
            loadingText.innerText = `Oops, looks like there is an error loading`; 
            throw error;
        }

    });
}

function formatDateForGmailQuery(date) {
    // Convert date to format "yyyy/mm/dd"
    let d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function showMailLoadingPercentage(loadingText, metadatas, start, end){
    const totalDays = (end-start) / (1000 * 3600 * 24);
    let lastMailDateStr = metadatas[metadatas.length-1]['date'];
    let lastMailDate = new Date(lastMailDateStr);
    let days = (end-lastMailDate) / (1000 * 3600 * 24); // 1000 ms * 3600 seconds * 24 hours
    loadingText.innerText = `Loading emails ${Math.floor(100*days/totalDays)}%, please wait...`;

}

async function fetchEmailsIds(size, start, end, nextPageToken, gmailAccessToken){
    let query = `after:${formatDateForGmailQuery(start)} before:${formatDateForGmailQuery(end)}`;
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    url.searchParams.set("maxResults", `${size}`);
    url.searchParams.set("q", query);
    if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

    let response = await fetch(url, {
        headers: { Authorization: `Bearer ${gmailAccessToken}` }
    });
    let data = await response.json();
    return data;
}

async function fetchEmailsMetadataBatch(batch, gmailAccessToken){
    let messages = await Promise.all(batch.map(async msg => {
        let res = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
            headers: { Authorization: `Bearer ${gmailAccessToken}` }
        });
        if (!res.ok) {
            console.error(`Error fetching message ${msg.id}:`, res.status, res.statusText);
            throw new Error(await res.text());
        }
        let jsonMsg = await res.json();
        return {
            'from': jsonMsg.payload.headers.find(header => header.name === "From").value,
            'subject': jsonMsg.payload.headers.find(header => header.name === "Subject").value,
            'date': jsonMsg.payload.headers.find(header => header.name === "Date").value
        };
        
    }));
    return messages;
}   
function formatDateForGmailQuery(date) {
    // Convert date to format "yyyy/mm/dd"
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}