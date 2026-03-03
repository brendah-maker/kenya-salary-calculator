// ============================================
// KENYA FINANCIAL TOOLS HUB - FULL SCRIPT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});


// ============================================
// INITIALIZE APP
// ============================================
function initializeApp() {

  // Switch calculator
  document
    .getElementById("calculatorSelect")
    .addEventListener("change", switchCalculator);

  // Buttons
  document
    .getElementById("calculatePAYEButton")
    .addEventListener("click", calculatePAYE);

  document
    .getElementById("calculateSHIFButton")
    .addEventListener("click", calculateSHIF);

  document
    .getElementById("calculateVATButton")
    .addEventListener("click", calculateVAT);

  handleCookies();

  switchCalculator(); // default view
}


// ============================================
// COOKIE HANDLING
// ============================================
function handleCookies() {
  const banner = document.getElementById("cookieBanner");
  const btn = document.getElementById("acceptCookies");

  if (!localStorage.getItem("cookiesAccepted")) {
    banner.style.display = "flex";
  }

  btn.addEventListener("click", () => {
    localStorage.setItem("cookiesAccepted", "true");
    banner.style.display = "none";
  });
}


// ============================================
// SWITCH CALCULATOR VIEW
// ============================================
function switchCalculator() {
  const selected = document.getElementById("calculatorSelect").value;

  document.getElementById("payeCalculator").style.display =
    selected === "paye" ? "block" : "none";

  document.getElementById("shifCalculator").style.display =
    selected === "shif" ? "block" : "none";

  document.getElementById("vatCalculator").style.display =
    selected === "vat" ? "block" : "none";

  clearResults();
}

function clearResults() {
  document.getElementById("payeResult").innerHTML = "";
  document.getElementById("shifResult").innerHTML = "";
  document.getElementById("vatResult").innerHTML = "";

  if (window.salaryChart) {
    window.salaryChart.destroy();
  }
}


// ============================================
// PAYE CALCULATOR
// ============================================
function calculatePAYE() {

  const mode = document.getElementById("mode").value;
  const salary1 = parseFloat(document.getElementById("grossSalary").value);
  const salary2 = parseFloat(document.getElementById("grossSalary2").value);

  if (isNaN(salary1) || salary1 <= 0) {
    alert("Please enter a valid salary.");
    return;
  }

  let gross1 = mode === "gross"
    ? salary1
    : estimateGrossFromNet(salary1);

  const result1 = calculateDeductions(gross1);

  displaySalaryBreakdown(gross1, result1);

  if (!isNaN(salary2) && salary2 > 0) {

    let gross2 = mode === "gross"
      ? salary2
      : estimateGrossFromNet(salary2);

    const result2 = calculateDeductions(gross2);

    displayComparison(result1.net, result2.net);
    renderComparisonChart(result1, result2);

  } else {
    renderChart(result1);
  }
}


// ============================================
// DEDUCTION LOGIC
// ============================================
function calculateDeductions(gross) {

  // NSSF
  let nssf;
  if (gross <= 9000) {
    nssf = gross * 0.06;
  } else if (gross > 108000) {
    nssf = 6480;
  } else {
    nssf = 540 + (gross - 9000) * 0.06;
  }
  nssf = Math.min(nssf, 6480);

  // SHIF
  const shif = Math.max(gross * 0.0275, 300);

  // Housing Levy
  const housingLevy = gross * 0.015;

  // Taxable Income
  const taxable = gross - nssf;

  const bands = [
    { limit: 24000, rate: 0.10 },
    { limit: 32333, rate: 0.25 },
    { limit: 47667, rate: 0.30 },
    { limit: 100000, rate: 0.325 },
    { limit: Infinity, rate: 0.35 }
  ];

  let paye = 0;
  let prev = 0;

  for (let band of bands) {
    if (taxable > prev) {
      paye += (Math.min(taxable, band.limit) - prev) * band.rate;
      prev = band.limit;
    }
  }

  paye = Math.max(paye - 2400, 0); // Personal relief

  const totalDeductions = paye + nssf + shif + housingLevy;
  const net = gross - totalDeductions;

  return {
    paye: Math.round(paye),
    nssf: Math.round(nssf),
    shif: Math.round(shif),
    housingLevy: Math.round(housingLevy),
    totalDeductions: Math.round(totalDeductions),
    net: Math.round(net)
  };
}


// ============================================
// ESTIMATE GROSS FROM NET
// ============================================
function estimateGrossFromNet(targetNet) {
  let guess = targetNet;

  for (let i = 0; i < 200; i++) {
    const result = calculateDeductions(guess);
    const diff = result.net - targetNet;

    if (Math.abs(diff) < 1) break;
    guess -= diff;
  }

  return Math.round(guess);
}


// ============================================
// DISPLAY SALARY BREAKDOWN
// ============================================
function displaySalaryBreakdown(gross, result) {

  const takeHomePercent = ((result.net / gross) * 100).toFixed(1);
  const deductionPercent = ((result.totalDeductions / gross) * 100).toFixed(1);

  const annualNet = result.net * 12;
  const annualDeductions = result.totalDeductions * 12;

  document.getElementById("payeResult").innerHTML = `
    <div class="result-card">

      <h3>Salary Breakdown</h3>

      ${row("Gross Salary:", gross)}
      ${row("PAYE:", result.paye)}
      ${row("NSSF:", result.nssf)}
      ${row("SHIF:", result.shif)}
      ${row("Housing Levy:", result.housingLevy)}

      <div class="result-row total">
        <span>Net Salary:</span>
        <strong>KES ${result.net.toLocaleString()}</strong>
      </div>

      ${row("Take-home %:", takeHomePercent + "%")}
      ${row("Deductions %:", deductionPercent + "%")}
      ${row("Annual Net Salary:", annualNet)}
      ${row("Total Annual Deductions:", annualDeductions)}

    </div>
  `;
}

function row(label, value) {
  if (typeof value === "number") {
    value = "KES " + value.toLocaleString();
  }
  return `
    <div class="result-row">
      <span>${label}</span>
      <span>${value}</span>
    </div>
  `;
}


// ============================================
// COMPARISON DISPLAY
// ============================================
function displayComparison(net1, net2) {
  document.getElementById("payeResult").innerHTML += `
    <div class="result-card" style="margin-top:15px;">
      <h3>Comparison</h3>
      ${row("Salary 1 Net:", net1)}
      ${row("Salary 2 Net:", net2)}
      ${row("Difference:", net2 - net1)}
    </div>
  `;
}


// ============================================
// CHARTS
// ============================================
function renderChart(result) {

  const ctx = document.getElementById("salaryChart").getContext("2d");

  if (window.salaryChart) window.salaryChart.destroy();

  window.salaryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["PAYE", "NSSF", "SHIF", "Housing Levy", "Net"],
      datasets: [{
        data: [
          result.paye,
          result.nssf,
          result.shif,
          result.housingLevy,
          result.net
        ]
      }]
    },
    options: { responsive: true }
  });
}

function renderComparisonChart(r1, r2) {

  const ctx = document.getElementById("salaryChart").getContext("2d");

  if (window.salaryChart) window.salaryChart.destroy();

  window.salaryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["PAYE", "NSSF", "SHIF", "Housing Levy", "Net"],
      datasets: [
        {
          label: "Salary 1",
          data: [r1.paye, r1.nssf, r1.shif, r1.housingLevy, r1.net]
        },
        {
          label: "Salary 2",
          data: [r2.paye, r2.nssf, r2.shif, r2.housingLevy, r2.net]
        }
      ]
    },
    options: { responsive: true }
  });
}


// ============================================
// SHIF CALCULATOR
// ============================================
function calculateSHIF() {
  const salary = parseFloat(document.getElementById("shifSalary").value);

  if (isNaN(salary) || salary <= 0) {
    alert("Enter valid salary.");
    return;
  }

  const shif = Math.max(salary * 0.0275, 300);

  document.getElementById("shifResult").innerHTML =
    `<div class="result-card">
      <h3>SHIF Contribution</h3>
      ${row("Monthly Contribution:", Math.round(shif))}
    </div>`;
}


// ============================================
// VAT CALCULATOR
// ============================================
function calculateVAT() {
  const amount = parseFloat(document.getElementById("vatAmount").value);

  if (isNaN(amount) || amount <= 0) {
    alert("Enter valid amount.");
    return;
  }

  const vat = amount * 0.16;
  const total = amount + vat;

  document.getElementById("vatResult").innerHTML =
    `<div class="result-card">
      <h3>VAT Calculation</h3>
      ${row("VAT (16%):", vat)}
      ${row("Total Amount:", total)}
    </div>`;
}
