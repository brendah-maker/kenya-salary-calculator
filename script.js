// ===============================
// Kenya PAYE Calculator 2026
// ===============================

function calculate() {
    const mode = document.getElementById("mode").value;
    const input = parseFloat(document.getElementById("grossSalary").value);

    if (isNaN(input) || input <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    let gross, net, paye, nssf, shif, housingLevy;

    if (mode === "gross") {
        // User entered Gross Salary
        gross = input;
        const result = calculateDeductions(gross);
        paye = result.paye;
        nssf = result.nssf;
        shif = result.shif;
        housingLevy = result.housingLevy;
        net = result.net;

    } else {
        // User entered Net Salary
        net = input;
        gross = estimateGrossFromNet(net);
        const result = calculateDeductions(gross);
        paye = result.paye;
        nssf = result.nssf;
        shif = result.shif;
        housingLevy = result.housingLevy;
        net = result.net;
    }

    displayResults(gross, paye, nssf, shif, housingLevy, net);
}


// ===============================
// Calculate PAYE, NSSF, SHIF, Housing Levy
// ===============================
function calculateDeductions(gross) {
    // ------------------------------
    // PAYE 2026 (Monthly, Marginal)
    // ------------------------------
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
        if (gross > lower) {
            const taxable = Math.min(gross, band.upper) - lower;
            paye += taxable * band.rate;
            lower = band.upper;
        } else break;
    }

    // Personal Relief
    const personalRelief = 2400;
    paye = Math.max(paye - personalRelief, 0);

    // ------------------------------
    // NSSF 2026
    // ------------------------------
    let nssf = gross * 0.06;
    if (nssf > 6480) nssf = 6480;
    if (gross < 9000) nssf = gross * 0.06;

    // ------------------------------
    // SHIF 2026
    // ------------------------------
    let shif = gross * 0.0275;
    if (shif < 300) shif = 300;

    // ------------------------------
    // Housing Levy 1.5%
    // ------------------------------
    let housingLevy = gross * 0.015;

    // ------------------------------
    // Net Salary
    // ------------------------------
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
// Estimate Gross from Net (Iterative)
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
// Display Results
// ===============================
function displayResults(gross, paye, nssf, shif, housingLevy, net) {
    document.getElementById("result").innerHTML = `
        <h2>Salary Breakdown</h2>

        <div class="result-row">
            <span>Gross Salary:</span>
            <span>KES ${gross.toLocaleString()}</span>
        </div>

        <div class="result-row">
            <span>PAYE:</span>
            <span>KES ${paye.toLocaleString()}</span>
        </div>

        <div class="result-row">
            <span>NSSF (2026):</span>
            <span>KES ${nssf.toLocaleString()}</span>
        </div>

        <div class="result-row">
            <span>SHIF (2026):</span>
            <span>KES ${shif.toLocaleString()}</span>
        </div>

        <div class="result-row">
            <span>Housing Levy (1.5%):</span>
            <span>KES ${housingLevy.toLocaleString()}</span>
        </div>

        <div class="result-row">
            <strong>Net Salary:</strong>
            <strong>KES ${net.toLocaleString()}</strong>
        </div>
    `;
}
