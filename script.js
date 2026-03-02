// ===============================
// Calculator Dropdown Switch
// ===============================
function switchCalculator() {
    const calc = document.getElementById("calculatorSelect").value;
    document.getElementById("payeCalculator").style.display = calc === "paye" ? "block" : "none";
    document.getElementById("shifCalculator").style.display = calc === "shif" ? "block" : "none";
    document.getElementById("vatCalculator").style.display = calc === "vat" ? "block" : "none";

    document.getElementById("payeResult").innerHTML = "";
    document.getElementById("shifResult").innerHTML = "";
    document.getElementById("vatResult").innerHTML = "";

    if (window.salaryChart) window.salaryChart.destroy();
}

// ===============================
// PAYE Calculator (2025/26 Pre-Amendment)
// ===============================
function calculatePAYE() {
    const mode = document.getElementById("mode").value;
    const input1 = parseFloat(document.getElementById("grossSalary").value);
    const input2 = parseFloat(document.getElementById("grossSalary2").value);

    if (isNaN(input1) || input1 <= 0) { alert("Enter valid salary"); return; }

    const result1 = mode === "gross" ? calculateDeductions(input1) : calculateDeductions(estimateGrossFromNet(input1));
    displayResults(result1);

    if (!isNaN(input2) && input2 > 0) {
        const result2 = mode === "gross" ? calculateDeductions(input2) : calculateDeductions(estimateGrossFromNet(input2));
        displayComparison(result1, result2);
        renderStackedComparison(
            [result1.paye, result1.nssf, result1.shif, result1.housingLevy, result1.net],
            [result2.paye, result2.nssf, result2.shif, result2.housingLevy, result2.net],
            [result1.gross, result2.gross]
        );
    } else {
        renderChart(result1);
    }
}

// ===============================
// Calculate Deductions
// ===============================
function calculateDeductions(gross) {
    // ----- NSSF 2026 Tier 1+2 -----
    let nssf = gross <= 9000 ? gross * 0.06
             : gross > 108000 ? 6480
             : 540 + (gross - 9000) * 0.06;
    nssf = Math.min(nssf, 6480);

    // ----- SHIF 2026 -----
    let shif = Math.max(gross * 0.0275, 300); // Minimum 300, 2.75% of gross, no max

    // ----- Housing Levy 1.5% -----
    let housingLevy = gross * 0.015;

    // ----- Taxable Income for PAYE -----
    const taxableIncome = gross - nssf; // Only NSSF reduces taxable income

    // ----- PAYE Bands Pre-Amendment 2025/26 -----
    const bands = [
        { upper: 24000, rate: 0.10 },
        { upper: 32333, rate: 0.25 },
        { upper: 500000, rate: 0.30 },
        { upper: 800000, rate: 0.325 },
        { upper: Infinity, rate: 0.35 }
    ];

    let paye = 0;
    let lower = 0;
    for (let band of bands) {
        if (taxableIncome > lower) {
            paye += (Math.min(taxableIncome, band.upper) - lower) * band.rate;
            lower = band.upper;
        } else break;
    }

    const personalRelief = 2400;
    paye = Math.max(paye - personalRelief, 0);

    const net = gross - (paye + nssf + shif + housingLevy);

    return {
        gross: Math.round(gross),
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
    for (let i = 0; i < 200; i++) {
        const result = calculateDeductions(grossEstimate);
        const diff = result.net - targetNet;
        if (Math.abs(diff) < 1) break;
        grossEstimate -= diff;
    }
    return Math.round(grossEstimate);
}

// ===============================
// Display Results
// ===============================
function displayResults({ gross, paye, nssf, shif, housingLevy, net }) {
    const deductions = paye + nssf + shif + housingLevy;
    const takeHomePercent = ((net / gross) * 100).toFixed(1);
    const deductionPercent = ((deductions / gross) * 100).toFixed(1);

    document.getElementById("payeResult").innerHTML = `
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
// Comparison, Charts & Helpers
// ===============================
function displayComparison(res1, res2) {
    const compDiv = document.getElementById("payeResult");
    compDiv.innerHTML += `
        <h3>Salary Comparison</h3>
        <div class="result-row"><span>Gross Salary 1:</span><span>KES ${res1.gross.toLocaleString()}</span></div>
        <div class="result-row"><span>Net Salary 1:</span><span>KES ${res1.net.toLocaleString()}</span></div>
        <div class="result-row"><span>Gross Salary 2:</span><span>KES ${res2.gross.toLocaleString()}</span></div>
        <div class="result-row"><span>Net Salary 2:</span><span>KES ${res2.net.toLocaleString()}</span></div>
    `;
}

function renderChart({ paye, nssf, shif, housingLevy, net }) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    if (window.salaryChart) window.salaryChart.destroy();
    window.salaryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PAYE','NSSF','SHIF','Housing Levy','Net Pay'],
            datasets:[{
                data:[paye,nssf,shif,housingLevy,net],
                backgroundColor:['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#8E44AD']
            }]
        },
        options: { responsive:true, plugins:{legend:{position:'bottom'}} }
    });
}

function renderStackedComparison(data1, data2, grossArr) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    if (window.salaryChart) window.salaryChart.destroy();
    window.salaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PAYE','NSSF','SHIF','Housing Levy','Net Pay'],
            datasets:[
                { label: `KES ${grossArr[0].toLocaleString()}`, data: data1, backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#8E44AD'] },
                { label: `KES ${grossArr[1].toLocaleString()}`, data: data2, backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#8E44AD'].map(c => lightenColor(c,0.5)) }
            ]
        },
        options:{ responsive:true, plugins:{legend:{position:'bottom'}}, scales:{x:{stacked:true},y:{stacked:true,beginAtZero:true}} }
    });
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace('#',''),16);
    const amt = Math.round(2.55 * percent * 100);
    const R = Math.min(255, Math.max(0,(num >> 16) + amt));
    const G = Math.min(255, Math.max(0,((num >> 8) & 0xFF) + amt));
    const B = Math.min(255, Math.max(0,(num & 0xFF) + amt));
    return '#' + (0x1000000 + (R<<16) + (G<<8) + B).toString(16).slice(1);
}
