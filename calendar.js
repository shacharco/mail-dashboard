function fetchCalendarEvents(callback, startDate, endDate, metrics, cropNum) {
    let querySize = 100;
    let events = [];
    let i = 0;
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();
    const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 3600 * 24);
    
    chrome.storage.local.get("gmailAccessToken", async function (storage) {
        if (!storage.gmailAccessToken) {
            console.error("No access token found.");
            return;
        }
        try {
            let nextPageToken = null;
            do {
                let data = await fetchCalendarEventsBatch(querySize, nextPageToken, storage.gmailAccessToken, start, end);
                nextPageToken = data.nextPageToken;
                events.push(...data.items);
            } while (nextPageToken);

            callback(events, "calendar ", metrics, startDate, endDate, cropNum);
            let lastEventDateStr = events[events.length - 1]?.start?.dateTime || events[events.length - 1]?.start?.date;
            let lastEventDate = new Date(lastEventDateStr);
            let days = (new Date(endDate) - lastEventDate) / (1000 * 3600 * 24);
            loadingText.innerText = `Loading events ${Math.floor(100 * days / totalDays)}%, please wait...`;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            callback(events,  "calendar ", metrics, startDate, endDate, cropNum);
            loadingText.innerText = `Done loading ${events.length} events.`;
        } catch (error) {
            loadingText.innerText = `Oops, looks like there is an error loading`;
            throw error;
        }
    });
}

async function fetchCalendarEventsBatch(size, nextPageToken, gmailAccessToken, start, end) {
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("maxResults", `${size}`);
    url.searchParams.set("timeMin", start);
    url.searchParams.set("timeMax", end);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);
    
    let response = await fetch(url, {
        headers: { Authorization: `Bearer ${gmailAccessToken}` }
    });
    let data = await response.json();
    return data;
}