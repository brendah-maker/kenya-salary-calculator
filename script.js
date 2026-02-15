// ===============================
// Kenya PAYE Calculator 2025 & 2026
// ===============================

function calculate() {
    const mode = document.getElementById("mode").value;
    const input = parseFloat(document.getElementById("grossSalary").value);
    const selectedYear = document.getElementById("yearToggle").value;

    if (isNaN(input) || input <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    const config = getTaxConfig(selectedYear);

    let gross, net, paye, nssf, shif, housingLevy;

    if (mode === "gross") {
        gross = input;
        const result = calculateDeductions(gross, config);
        ({ paye, nssf, shif, housingLevy, net } = result);
    } else {
        net = input;
        gross = estimateGrossFromNet(net, config);
        const result = calculateDeductions(gross, config);
        ({ paye, nssf, shif, housingLevy, net } = result);
    }

    displayResults(gross, paye, nssf, shif, housingLevy, net);
}

// ===============================
// Tax Config per Year
// ===============================
function getTaxConfig(year) {
    if (year === "2025") {
        return {
            nssfCap: 6000,
            bands: [
                { upper: 24000, rate: 0.10 },
                { upper: 32333, rate: 0.25 },
                { upper: 47667, rate: 0.30 },
                { upper: 100000, rate: 0.325 },
                { upper: Infinity, rate: 0.35 }
            ]
        };
    }
    // 2026 default
    return {
        nssfCap: 6480,
        bands: [
            { upper: 24000, rate: 0.10 },
            { upper: 32333, rate: 0.25 },
            { upper: 47667, rate: 0.30 },
            { upper: 100000, rate: 0.325 },
            { upper: Infinity, rate: 0.35 }
        ]
    };
}

// ===============================
// Calculate Deductions
// ===============================
function calculateDeductions(gross, config) {
    // NSSF 6%
    let nssf = gross * 0.06;
    if (nssf > config.nssfCap) nssf = config.nssfCap;
    if (gross < 9000) nssf = gross * 0.06;

    // SHIF 2.75% min 300
    let shif = gross * 0.0275;
    if (shif < 300) shif = 300;

    // Housing Levy 1.5%
    let housingLevy = gross * 0.015;

    // Taxable Income after pre-PAYE deductions
    const taxableIncome = gross - nssf - shif - housingLevy;

    // PAYE
    let paye = 0;
    let lower = 0;
    for (let band of config.bands) {
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
function estimateGrossFromNet(targetNet, config) {
    let grossEstimate = targetNet;
    let iterations = 0;
    const maxIterations = 200;

    while (iterations < maxIterations) {
        const result = calculateDeductions(grossEstimate, config);
        const difference = result.net - targetNet;
        if (Math.abs(difference) < 1) break;
        grossEstimate -= difference;
        iterations++;
    }

    return Math.round(grossEstimate);
}

// ===============================
// Display Results
// ===============================
function displayResults(gross, paye, nssf, shif, housingLevy, net) {
    document.getElementById("result").innerHTML = `
        <h2>Salary Breakdown</h2>
        <div class="result-row"><span>Gross Salary:</span><span>KES ${gross.toLocaleString()}</span></div>
        <div class="result-row"><span>PAYE:</span><span>KES ${paye.toLocaleString()}</span></div>
        <div class="result-row"><span>NSSF:</span><span>KES ${nssf.toLocaleString()}</span></div>
        <div class="result-row"><span>SHIF:</span><span>KES ${shif.toLocaleString()}</span></div>
        <div class="result-row"><span>Housing Levy:</span><span>KES ${housingLevy.toLocaleString()}</span></div>
        <div class="result-row"><strong>Net Salary:</strong><strong>KES ${net.toLocaleString()}</strong></div>
    `;

    renderChart(paye, nssf, shif, housingLevy, net);
}

// ===============================
// Render Chart
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
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}
