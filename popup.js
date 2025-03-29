
document.getElementById("startButton").addEventListener("click", async function () {
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let crop = document.getElementById("crop").value;
    let cropNum = -1;
    // Validate that both dates are provided
    if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
    }
    if(crop){
        cropNum = parseInt(crop, 10);
    }
    let gmailMetrics = Array.from(document.getElementById("gmail-metrics").selectedOptions).map(option => option.value);
    let calendarMetrics = Array.from(document.getElementById("calendar-metrics").selectedOptions).map(option => option.value);
    
    // Validate that at least one metric is selected
    if (gmailMetrics.length === 0 && calendarMetrics == 0) {
        alert("Please select at least one metric.");
        return;
    }
    let loadingText = document.getElementById("loadingText");
    loadingText.style.display = "block"; // Show loading message
    try {
        if (gmailMetrics.length != 0){
            fetchEmails(startDate, endDate, gmailMetrics, cropNum);
        }
        if (calendarMetrics.length != 0){
            fetchCalendarEvents(startDate, endDate, calendarMetrics, cropNum);
        }
    } catch (error) {
        console.error("Error fetching emails:", error);
    }
});

async function main() {
    try {
        let accessToken = await authenticate();
    } catch (error) {
        console.error("Authentication failed:", error);
    }
}
document.getElementById("requestFeature").addEventListener("click", function() {
    chrome.tabs.create({ url: "https://forms.gle/FRA8kzNbDrZjEP3j9" });
});

main();
