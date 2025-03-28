
let metricsChartInstance = {}; // Store chart instance globally
function formatMetadata(metadatas, metric){
    console.log(metadatas);
    let values = {};
    if (metadatas[0].payload != undefined){
        metadatas.forEach(msg => {
            let value = msg.payload.headers.find(header => header.name === metric).value;
            values[value] = (values[value] || 0) + 1;
        });
    }
    else{
        metadatas.forEach(msg => {
            metricKeys = metric.split(".");
            let value = msg;
            metricKeys.forEach(k => value = value[k])
            values[value] = (values[value] || 0) + 1;
        });
        if (metric == "colorId"){
            values = Object.fromEntries(
                Object.entries(values).map(([key, value]) => [getEventColorName(key), value])
            );
        }
    }

    return values;
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

function drawCharts(emailData, prefix, metrics, start, end, cropNum) {
    
    metrics.forEach(metric => {
        console.log(metric)
        let chartContainer = document.createElement("div");
        let canvas = document.createElement("canvas");
        chartContainer.appendChild(canvas);
        document.getElementById("chartsContainer").appendChild(chartContainer);
        console.log(emailData)
        let metricData = formatMetadata(emailData, metric);
        console.log(metricData)
        drawChart(canvas, metricData, prefix+metric, start, end, cropNum);
        
        // Add more chart types based on selected metrics
    });
}
function drawChart(canvas, emailData, metric, start, end, cropNum) {
    let ctx = canvas.getContext("2d");
    // Convert object to array and sort by values (descending)
    let sortedEntries = Object.entries(emailData).sort((a, b) => b[1] - a[1]);
    if (cropNum > 0){
        sortedEntries = sortedEntries.slice(0, cropNum);
    }
    let sum = 0;
    sortedEntries.forEach(entry => sum+=entry[1]);
    console.log(`Loaded ${sum} results for ${metric}`);

    // Extract sorted labels and values
    let labels = sortedEntries.map(entry => entry[0]);
    let values = sortedEntries.map(entry => entry[1]);
    // Destroy existing chart if it exists
    if (metricsChartInstance[metric]) {
        let parent = metricsChartInstance[metric].canvas.parentNode;
        metricsChartInstance[metric].destroy();
        parent.remove();
    }
    metricsChartInstance[metric] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: `Emails per ${metric} from ${start} to ${end}`,
                data: values,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}
function formatDateForGmailQuery(date) {
    // Convert date to format "yyyy/mm/dd"
    let d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}