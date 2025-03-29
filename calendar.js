function fetchCalendarEvents(startDate, endDate, metrics, cropNum) {
    let querySize = 100;
    let events = [];
    let i = 0;
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate).toISOString();
    let loadingText = document.getElementById("loadingText");

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
                drawCharts(events, "calendar ", metrics, startDate, endDate, cropNum);
                showCalendarLoadingPercentage(loadingText, events, endDate, startDate);
                await new Promise(resolve => setTimeout(resolve, 500));
            } while (nextPageToken);
            drawCharts(events,  "calendar ", metrics, startDate, endDate, cropNum);
            loadingText.innerText = `Done loading ${events.length} events.`;
        } catch (error) {
            loadingText.innerText = `Oops, looks like there is an error loading`;
            throw error;
        }
    });
}
function showCalendarLoadingPercentage(loadingText, events, endDate, startDate){
    const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 3600 * 24);
    let lastEventDateStr = events[events.length - 1]?.start?.dateTime || events[events.length - 1]?.start?.date;
    let lastEventDate = new Date(lastEventDateStr);
    let days = (new Date(endDate) - lastEventDate) / (1000 * 3600 * 24);
    loadingText.innerText = `Loading events ${Math.floor(100 * days / totalDays)}%, please wait...`;

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
    let standardizedData = {'items': [], 'nextPageToken': data.nextPageToken}
    data.items.forEach(event => {
        standardizedData.items.push({
            'color': getEventColorName(event['colorId']),
            'organizer': event['organizer']['email'],
            'start': event.start
        });
    });
    return standardizedData;
}

function getEventColorName(colorId) {
    const colorMap = {
        1: "Lavender",
        2: "Sage",
        3: "Grape",
        4: "Flamingo",
        5: "Banana",
        6: "Tangerine",
        7: "Peacock",
        8: "Graphite",
        9: "Blueberry",
        10: "Basil",
        11: "Tomato"
    };
    return colorMap[colorId] || "Default"; // Default for unspecified colors
}
