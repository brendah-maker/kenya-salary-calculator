// ===============================
// Calculator Dropdown Switch
// ===============================
function switchCalculator() {
    const calc = document.getElementById("calculatorSelect").value;
    document.getElementById("payeCalculator").style.display = calc === "paye" ? "block" : "none";
    document.getElementById("shifCalculator").style.display = calc === "shif" ? "block" : "none";
    document.getElementById("vatCalculator").style.display = calc === "vat" ? "block" : "none";

    // Clear previous results
    document.getElementById("payeResult").innerHTML = "";
    document.getElementById("shifResult").innerHTML = "";
    document.getElementById("vatResult").innerHTML = "";
    if (window.salaryChart) window.salaryChart.destroy();
}

// ===============================
// PAYE Calculator
// ===============================
function calculatePAYE() {
    const mode = document.getElementById("mode").value;
    const input = parseFloat(document.getElementById("grossSalary").value);
    const input2 = parseFloat(document.getElementById("grossSalary2").value);

    if (isNaN(input) || input <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    // Primary Salary
    let gross, net, paye, nssf, shif, housingLevy;
    if (mode === "gross") {
        gross = input;
        ({ paye, nssf, shif, housingLevy, net } = calculateDeductions(gross));
    } else {
        net = input;
        gross = estimateGrossFromNet(net);
        ({ paye, nssf, shif, housingLevy, net } = calculateDeductions(gross));
    }

    displayResults(gross, paye, nssf, shif, housingLevy, net);

    // Comparison Salary
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

        displayComparison(gross, net, gross2, net2);
        renderStackedComparison(
            [paye, nssf, shif, housingLevy, net],
            [paye2, nssf2, shif2, housingLevy2, net2],
            [gross, gross2]
        );
    } else {
        renderChart(paye, nssf, shif, housingLevy, net);
    }
}

// PAYE Helper Functions
function calculateDeductions(gross) {
    // NSSF
    let nssf = gross * 0.06;
    if (nssf > 6480) nssf = 6480;
    if (gross < 9000) nssf = gross * 0.06;

    // SHIF
    let shif = gross * 0.0275;
    if (shif < 300) shif = 300;

    // Housing Levy
    let housingLevy = gross * 0.015;

    // PAYE
    const taxableIncome = gross - nssf - shif - housingLevy;
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

function estimateGrossFromNet(targetNet) {
    let grossEstimate = targetNet;
    let iterations = 0;
    const maxIterations = 200;
    while (iterations < maxIterations) {
        const result = calculateDeductions(grossEstimate);
        const diff = result.net - targetNet;
        if (Math.abs(diff) < 1) break;
        grossEstimate -= diff;
        iterations++;
    }
    return Math.round(grossEstimate);
}

function displayResults(gross, paye, nssf, shif, housingLevy, net) {
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

function displayComparison(gross1, net1, gross2, net2) {
    const compDiv = document.getElementById("payeResult");
    compDiv.innerHTML += `
        <h3>Salary Comparison</h3>
        <div class="result-row"><span>Gross Salary 1:</span><span>KES ${gross1.toLocaleString()}</span></div>
        <div class="result-row"><span>Net Salary 1:</span><span>KES ${net1.toLocaleString()}</span></div>
        <div class="result-row"><span>Gross Salary 2:</span><span>KES ${gross2.toLocaleString()}</span></div>
        <div class="result-row"><span>Net Salary 2:</span><span>KES ${net2.toLocaleString()}</span></div>
    `;
}

function renderChart(paye, nssf, shif, housingLevy, net) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    if (window.salaryChart) window.salaryChart.destroy();
    window.salaryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PAYE','NSSF','SHIF','Housing Levy','Net Pay'],
            datasets: [{
                data: [paye,nssf,shif,housingLevy,net],
                backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#8E44AD']
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
    const num = parseInt(color.replace('#',''),16),
          amt = Math.round(2.55 * percent * 100),
          R = (num >> 16) + amt,
          G = (num >> 8 & 0x00FF) + amt,
          B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

// ===============================
// SHIF Calculator
// ===============================
function calculateSHIF() {
    const salary = parseFloat(document.getElementById("shifSalary").value);
    if (isNaN(salary) || salary <= 0) { alert("Enter valid salary"); return; }

    let shif = salary * 0.0275;
    if (shif < 300) shif = 300;

    // Previous NHIF logic
    let nhif = 0;
    if (salary <= 5999) nhif=150;
    else if (salary <= 7999) nhif=300;
    else if (salary <= 11999) nhif=400;
    else if (salary <= 14999) nhif=500;
    else if (salary <= 19999) nhif=600;
    else if (salary <= 24999) nhif=750;
    else if (salary <= 29999) nhif=850;
    else if (salary <= 34999) nhif=900;
    else if (salary <= 39999) nhif=950;
    else if (salary <= 44999) nhif=1000;
    else if (salary <= 49999) nhif=1100;
    else if (salary <= 59999) nhif=1200;
    else if (salary <= 69999) nhif=1300;
    else if (salary <= 79999) nhif=1400;
    else if (salary <= 89999) nhif=1500;
    else if (salary <= 99999) nhif=1600;
    else nhif=1700;

    const diff = shif - nhif;
    const percent = (diff/nhif)*100;

    const box = document.getElementById("shifResult");
    box.innerHTML = `
        <div class="${diff>0?'positive':'negative'}">
            <p>SHIF Contribution (2.75%): KES ${shif.toFixed(2)}</p>
            <p>Previous NHIF Contribution: KES ${nhif.toFixed(2)}</p>
            <p>You will pay ${diff>0?`(+${percent.toFixed(1)}%)`:`(${percent.toFixed(1)}%)`} KES ${Math.abs(diff).toFixed(2)} ${diff>0?'more':'less'} than previous NHIF contribution.</p>
        </div>
    `;
}

// ===============================
// VAT Calculator
// ===============================
function calculateVAT() {
    const amount = parseFloat(document.getElementById("vatAmount").value);
    if (isNaN(amount) || amount <= 0) { alert("Enter valid amount"); return; }
    const vat = amount * 0.16; // Assuming 16%
    const total = amount + vat;

    document.getElementById("vatResult").innerHTML = `
        <div>
            <p>Amount: KES ${amount.toLocaleString()}</p>
            <p>VAT (16%): KES ${vat.toLocaleString()}</p>
            <p>Total: KES ${total.toLocaleString()}</p>
        </div>
    `;
}
