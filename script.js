// ===============================
// Kenya PAYE Calculator 2026 – Full Version
// ===============================

function calculate() {
    const mode = document.getElementById("mode").value;
    const input = parseFloat(document.getElementById("grossSalary").value);
    const input2 = parseFloat(document.getElementById("grossSalary2").value);

    if (isNaN(input) || input <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // --------------------------
    // Primary salary calculation
    // --------------------------
    let gross, net, paye, nssf, shif, housingLevy;
    if (mode === "gross") {
        gross = input;
        ({ paye, nssf, shif, housingLevy, net } = calculateDeductions(gross));
    } else {
        net = input;
        gross = estimateGrossFromNet(net);
        ({ paye, nssf, shif, housingLevy, net } = calculateDeductions(gross));
    }

    // Display primary result
    displayResults(gross, paye, nssf, shif, housingLevy, net);

    // --------------------------
    // Comparison salary
    // --------------------------
    if (!isNaN(input2) && input2 > 0) {
        let gross2, net2, paye2, nssf2, shif2, housingLevy2;

        if (mode === "gross") {
            gross2 = input2;
            ({ paye: paye2, nssf: nssf2, shif: shif2, housingLevy: housingLevy2, net: net2 } = calculateDeductions(gross2));
        } else {
            net2 = input2;
            gross2 = estimateGrossFromNet(net2);
            ({ paye: paye2, nssf: nssf2, shif: shif2, housingLevy: housingLevy2, net: net2 } = calculateDeductions(gross2));
        }

        // Display numeric comparison
        displayComparison(gross, net, gross2, net2);

        // Render comparison chart
        renderComparisonChart(
            [paye, nssf, shif, housingLevy, net],
            [paye2, nssf2, shif2, housingLevy2, net2],
            [gross, gross2]
        );
    } else {
        // Single salary chart
        renderChart(paye, nssf, shif, housingLevy, net);
    }
}

// ===============================
// Calculate Deductions
// ===============================
function calculateDeductions(gross) {
    // NSSF 6% capped
    let nssf = gross * 0.06;
    if (nssf > 6480) nssf = 6480;
    if (gross < 9000) nssf = gross * 0.06;

    // SHIF 2.75% min 300
    let shif = gross * 0.0275;
    if (shif < 300) shif = 300;

    // Housing Levy 1.5%
    let housingLevy = gross * 0.015;

    // Taxable income for PAYE
    const taxableIncome = gross - nssf - shif - housingLevy;

    // PAYE bands
    const bands = [
        { upper: 24000, rate: 0.10 },
        { upper: 32333, rate: 0.25 },
        { upper: 47667, rate: 0.30 },
        { upper: 100000, rate: 0.325 },
        { upper: Infinity, rate: 0.35 }
    ];

    let paye = 0;
    let lower = 0;
    for (let band of bands) {
        if (taxableIncome > lower) {
            const taxable = Math.min(taxableIncome, band.upper) - lower;
            paye += taxable * band.rate;
            lower = band.upper;
        } else break;
    }

    const personalRelief = 2400;
    paye = Math.max(paye - personalRelief, 0);

    const net = gross - (paye + nssf + shif + housingLevy);

    return {
        paye: Math.round(paye),
        nssf: Math.round(nssf),
        shif: Math.round(shif),
        housingLevy: Math.round(housingLevy),
        net: Math.round(net)
    };
}

// ===============================
// Estimate Gross from Net
// ===============================
function estimateGrossFromNet(targetNet) {
    let grossEstimate = targetNet;
    let iterations = 0;
    const maxIterations = 200;

    while (iterations < maxIterations) {
        const result = calculateDeductions(grossEstimate);
        const difference = result.net - targetNet;
        if (Math.abs(difference) < 1) break;
        grossEstimate -= difference;
        iterations++;
    }

    return Math.round(grossEstimate);
}

// ===============================
// Display Results with Take-home % & Annual Projection
// ===============================
function displayResults(gross, paye, nssf, shif, housingLevy, net) {
    const deductions = paye + nssf + shif + housingLevy;
    const takeHomePercent = ((net / gross) * 100).toFixed(1);
    const deductionPercent = ((deductions / gross) * 100).toFixed(1);

    document.getElementById("result").innerHTML = `
        <h2>Salary Breakdown</h2>
        <div class="result-row"><span>Gross Salary:</span><span>KES ${gross.toLocaleString()}</span></div>
        <div class="result-row"><span>PAYE:</span><span>KES ${paye.toLocaleString()}</span></div>
        <div class="result-row"><span>NSSF:</span><span>KES ${nssf.toLocaleString()}</span></div>
        <div class="result-row"><span>SHIF:</span><span>KES ${shif.toLocaleString()}</span></div>
        <div class="result-row"><span>Housing Levy:</span><span>KES ${housingLevy.toLocaleString()}</span></div>
        <div class="result-row"><strong>Net Salary:</strong><strong>KES ${net.toLocaleString()}</strong></div>
        <div class="result-row"><span>Take-home %:</span><span>${takeHomePercent}%</span></div>
        <div class="result-row"><span>Deductions %:</span><span>${deductionPercent}%</span></div>
        <div class="result-row"><span>Annual Net Salary:</span><span>KES ${(net*12).toLocaleString()}</span></div>
        <div class="result-row"><span>Total Annual Deductions:</span><span>KES ${(deductions*12).toLocaleString()}</span></div>
    `;
}

// ===============================
// Display numeric comparison
// ===============================
function displayComparison(gross1, net1, gross2, net2) {
    const compDiv = document.getElementById("result");
    compDiv.innerHTML += `
        <h3>Salary Comparison</h3>
        <div class="result-row"><span>Gross Salary 1:</span><span>KES ${gross1.toLocaleString()}</span></div>
        <div class="result-row"><span>Net Salary 1:</span><span>KES ${net1.toLocaleString()}</span></div>
        <div class="result-row"><span>Gross Salary 2:</span><span>KES ${gross2.toLocaleString()}</span></div>
        <div class="result-row"><span>Net Salary 2:</span><span>KES ${net2.toLocaleString()}</span></div>
    `;
}

// ===============================
// Render Single Donut Chart
// ===============================
function renderChart(paye, nssf, shif, housingLevy, net) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    if (window.salaryChart) window.salaryChart.destroy();

    window.salaryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PAYE', 'NSSF', 'SHIF', 'Housing Levy', 'Net Pay'],
            datasets: [{
                data: [paye, nssf, shif, housingLevy, net],
                backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#8E44AD']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ===============================
// Render Comparison Chart
// ===============================
function renderComparisonChart(data1, data2, grossArr) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    if (window.salaryChart) window.salaryChart.destroy();

    window.salaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PAYE','NSSF','SHIF','Housing Levy','Net Pay'],
            datasets: [
                {
                    label: `KES ${grossArr[0].toLocaleString()}`,
                    data: data1,
                    backgroundColor: '#36A2EB'
                },
                {
                    label: `KES ${grossArr[1].toLocaleString()}`,
                    data: data2,
                    backgroundColor: '#FF6384'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}
