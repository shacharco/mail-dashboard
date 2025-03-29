
let metricsChartInstance = {}; // Store chart instance globally
function countData(data, metric){
    let values = {};
    data.forEach(event => {
        let value = event[metric];
        values[value] = (values[value] || 0) + 1;
    });
    return values;
}

function drawCharts(emailData, prefix, metrics, start, end, cropNum) {
    
    metrics.forEach(metric => {
        let chartContainer = document.createElement("div");
        let canvas = document.createElement("canvas");
        chartContainer.appendChild(canvas);
        document.getElementById("chartsContainer").appendChild(chartContainer);
        let metricData = countData(emailData, metric);
        drawChart(canvas, metricData, prefix+metric, start, end, cropNum);
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
