// ===============================
// Kenya PAYE Calculator 2026
// Calculates:
// - PAYE
// - NSSF (2026 rates)
// - SHIF (2026 rates)
// - Net Salary
// ===============================

function calculate() {
    const mode = document.getElementById("mode").value;
    const input = parseFloat(document.getElementById("grossSalary").value);

    if (isNaN(input) || input <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    let gross, net, paye, nssf, shif;

    if (mode === "net") {
        // User entered Gross Salary
        gross = input;
        const result = calculateDeductions(gross);
        paye = result.paye;
        nssf = result.nssf;
        shif = result.shif;
        net = result.net;

    } else {
        // User entered Net Salary
        net = input;
        gross = estimateGrossFromNet(net);

        const result = calculateDeductions(gross);
        paye = result.paye;
        nssf = result.nssf;
        shif = result.shif;
        net = result.net; // recalculated net (more accurate)
    }

    displayResults(gross, paye, nssf, shif, net);
}


// ===============================
// Calculate PAYE, NSSF, SHIF
// ===============================
function calculateDeductions(gross) {

    let remaining = gross;
    let paye = 0;

    // PAYE Bands (Monthly)
    const bands = [
        { limit: 24000, rate: 0.10 },
        { limit: 8333, rate: 0.25 },
        { limit: 467667, rate: 0.30 },
        { limit: 300000, rate: 0.325 },
        { limit: Infinity, rate: 0.35 }
    ];

    for (let band of bands) {
        if (remaining <= 0) break;

        const taxable = Math.min(remaining, band.limit);
        paye += taxable * band.rate;
        remaining -= taxable;
    }

    // Personal Relief
    const personalRelief = 2400;
    paye = Math.max(paye - personalRelief, 0);


    // ===============================
    // NSSF 2026
    // 6% of pensionable earnings
    // Max employee contribution = 6,480
    // ===============================

    let nssf = gross * 0.06;
    if (nssf > 6480) {
        nssf = 6480;
    }

    if (gross < 9000) {
        nssf = gross * 0.06; // still 6%
    }


    // ===============================
    // SHIF 2026
    // 2.75% of gross
    // Minimum 300
    // ===============================

    let shif = gross * 0.0275;
    if (shif < 300) {
        shif = 300;
    }

    const net = gross - (paye + nssf + shif);

    return {
        paye: Math.round(paye),
        nssf: Math.round(nssf),
        shif: Math.round(shif),
        net: Math.round(net)
    };
}


// ===============================
// Estimate Gross from Net
// (Iterative approximation)
// ===============================
function estimateGrossFromNet(targetNet) {

    let grossEstimate = targetNet;
    let iterations = 0;
    const maxIterations = 200;

    while (iterations < maxIterations) {
        const result = calculateDeductions(grossEstimate);
        const difference = result.net - targetNet;

        if (Math.abs(difference) < 1) {
            break;
        }

        grossEstimate -= difference;
        iterations++;
    }

    return Math.round(grossEstimate);
}


// ===============================
// Display Results
// ===============================
function displayResults(gross, paye, nssf, shif, net) {

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
            <strong>Net Salary:</strong>
            <strong>KES ${net.toLocaleString()}</strong>
        </div>
    `;
}
