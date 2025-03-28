function fetchEmails(callback, startDate, endDate, metrics, cropNum) {
    let querySize = 100;
    let emailIds = [];
    let batchSize = 10;
    let metadatas = []
    let i = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = (end-start) / (1000 * 3600 * 24);
    // Convert startDate and endDate to Gmail's date format (yyyy/mm/dd)
    let formattedStartDate = formatDateForGmailQuery(startDate);
    let formattedEndDate = formatDateForGmailQuery(endDate);
    
    let query = `after:${formattedStartDate} before:${formattedEndDate}`;
    chrome.storage.local.get("gmailAccessToken", async function (storage) {
        if (!storage.gmailAccessToken) {
            console.error("No access token found.");
            return;
        }
        try {
            let nextPageToken = null;
            do {
                let data = await fetchEmailsIds(querySize, nextPageToken, storage.gmailAccessToken, query)
                nextPageToken = data.nextPageToken;
                emailIds.push(...data.messages);
            } while (nextPageToken);
            do{
                const batch = emailIds.slice(i, i + batchSize);
                metadatas.push(...await fetchEmailsBatch(batch, storage.gmailAccessToken));
                if (metadatas.length == batchSize || metadatas.length % (batchSize*10) == 0){
                    callback(metadatas, "mails ", metrics, startDate, endDate, cropNum);
                    let lastMailDateStr = metadatas[metadatas.length-1].payload.headers.find(header => header.name === "Date").value;
                    let lastMailDate = new Date(lastMailDateStr);
                    let days = (end-lastMailDate) / (1000 * 3600 * 24); // 1000 ms * 3600 seconds * 24 hours
                    loadingText.innerText = `Loading emails ${Math.floor(100*days/totalDays)}%, please wait...`;
    
                }
                // Avoid hitting per-second rate limits
                await new Promise(resolve => setTimeout(resolve, 500));
                i+=batchSize;
    
            } while (i < emailIds.length);
            callback(metadatas, "mails ", metrics, startDate, endDate, cropNum);
            loadingText.innerText = `Done loading ${emailIds.length} emails. Showing `; 
        } catch (error) {
            loadingText.innerText = `Oops, looks like there is an error loading`; 
            throw error;
        }

    });
}



async function fetchEmailsIds(size, nextPageToken, gmailAccessToken, query){
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    url.searchParams.set("maxResults", `${size}`);
    if (query) url.searchParams.set("q", query); // Add query parameter for date range
    if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

    let response = await fetch(url, {
        headers: { Authorization: `Bearer ${gmailAccessToken}` }
    });
    let data = await response.json();
    return data;
}

async function fetchEmailsBatch(batch, gmailAccessToken){
    let messagePromises = batch.map(msg =>{
        return fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata`, {
            headers: { Authorization: `Bearer ${gmailAccessToken}` }
        }).then(res => {
            if (!res.ok) {
                console.error(`Error fetching message ${msg.id}:`, res.status, res.statusText);
                return res.text().then(text => { throw new Error(text); });
            }
            return res.json();
        })
    });
    let messages = await Promise.all(messagePromises);;
    return messages;
}   