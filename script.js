// ===============================
// WAIT FOR DOM
// ===============================
document.addEventListener("DOMContentLoaded", function () {

  // Calculator Switch
  const calcSelect = document.getElementById("calculatorSelect");
  calcSelect.addEventListener("change", switchCalculator);

  // Buttons
  document.getElementById("calculatePAYEButton").addEventListener("click", calculatePAYE);
  document.getElementById("calculateSHIFButton").addEventListener("click", calculateSHIF);
  document.getElementById("calculateVATButton").addEventListener("click", calculateVAT);

  // Cookie Banner
  const banner = document.getElementById("cookieBanner");
  const btn = document.getElementById("acceptCookies");

  if (!localStorage.getItem("cookiesAccepted")) {
    banner.style.display = "flex";
  }

  btn.addEventListener("click", function () {
    localStorage.setItem("cookiesAccepted", "true");
    banner.style.display = "none";
  });

  // Show PAYE by default
  switchCalculator();
});


// ===============================
// SWITCH CALCULATOR
// ===============================
function switchCalculator() {
  const calc = document.getElementById("calculatorSelect").value;

  document.getElementById("payeCalculator").style.display =
    calc === "paye" ? "block" : "none";

  document.getElementById("shifCalculator").style.display =
    calc === "shif" ? "block" : "none";

  document.getElementById("vatCalculator").style.display =
    calc === "vat" ? "block" : "none";

  // Clear results
  document.getElementById("payeResult").innerHTML = "";
  document.getElementById("shifResult").innerHTML = "";
  document.getElementById("vatResult").innerHTML = "";

  if (window.salaryChart) {
    window.salaryChart.destroy();
  }
}


// ===============================
// PAYE CALCULATOR
// ===============================
function calculatePAYE() {

  const mode = document.getElementById("mode").value;
  const input1 = parseFloat(document.getElementById("grossSalary").value);
  const input2 = parseFloat(document.getElementById("grossSalary2").value);

  if (isNaN(input1) || input1 <= 0) {
    alert("Please enter a valid salary.");
    return;
  }

  let gross, paye, nssf, shif, housingLevy, net;

  if (mode === "gross") {
    gross = input1;
  } else {
    gross = estimateGrossFromNet(input1);
  }

  ({ paye, nssf, shif, housingLevy, net } = calculateDeductions(gross));

  displayResults(gross, paye, nssf, shif, housingLevy, net);

  // Comparison
  if (!isNaN(input2) && input2 > 0) {

    let gross2;

    if (mode === "gross") {
      gross2 = input2;
    } else {
      gross2 = estimateGrossFromNet(input2);
    }

    const res2 = calculateDeductions(gross2);

    displayComparison(net, res2.net);
    renderComparisonChart(
      [paye, nssf, shif, housingLevy, net],
      [res2.paye, res2.nssf, res2.shif, res2.housingLevy, res2.net]
    );

  } else {
    renderChart(paye, nssf, shif, housingLevy, net);
  }
}


// ===============================
// DEDUCTIONS LOGIC
// ===============================
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

  if (nssf > 6480) nssf = 6480;

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
  let previousLimit = 0;

  for (let band of bands) {
    if (taxable > previousLimit) {
      paye +=
        (Math.min(taxable, band.limit) - previousLimit) *
        band.rate;
      previousLimit = band.limit;
    }
  }

  // Personal relief
  paye = Math.max(paye - 2400, 0);

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
// ESTIMATE GROSS FROM NET
// ===============================
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


// ===============================
// DISPLAY RESULTS
// ===============================
function displayResults(gross, paye, nssf, shif, housingLevy, net) {
  document.getElementById("payeResult").innerHTML = `
    <h3>Salary Breakdown</h3>
    <p><strong>Gross:</strong> KES ${gross.toLocaleString()}</p>
    <p>PAYE: KES ${paye.toLocaleString()}</p>
    <p>NSSF: KES ${nssf.toLocaleString()}</p>
    <p>SHIF: KES ${shif.toLocaleString()}</p>
    <p>Housing Levy: KES ${housingLevy.toLocaleString()}</p>
    <hr>
    <p><strong>Net Salary:</strong> KES ${net.toLocaleString()}</p>
  `;
}


// ===============================
// DISPLAY COMPARISON
// ===============================
function displayComparison(net1, net2) {
  document.getElementById("payeResult").innerHTML += `
    <hr>
    <h3>Comparison</h3>
    <p>Salary 1 Net: KES ${net1.toLocaleString()}</p>
    <p>Salary 2 Net: KES ${net2.toLocaleString()}</p>
    <p><strong>Difference:</strong> KES ${(net2 - net1).toLocaleString()}</p>
  `;
}


// ===============================
// SINGLE CHART
// ===============================
function renderChart(paye, nssf, shif, housingLevy, net) {

  const ctx = document.getElementById("salaryChart").getContext("2d");

  if (window.salaryChart) window.salaryChart.destroy();

  window.salaryChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["PAYE", "NSSF", "SHIF", "Housing Levy", "Net Salary"],
      datasets: [{
        data: [paye, nssf, shif, housingLevy, net]
      }]
    },
    options: { responsive: true }
  });
}


// ===============================
// COMPARISON CHART
// ===============================
function renderComparisonChart(data1, data2) {

  const ctx = document.getElementById("salaryChart").getContext("2d");

  if (window.salaryChart) window.salaryChart.destroy();

  window.salaryChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["PAYE", "NSSF", "SHIF", "Housing Levy", "Net"],
      datasets: [
        { label: "Salary 1", data: data1 },
        { label: "Salary 2", data: data2 }
      ]
    },
    options: { responsive: true }
  });
}


// ===============================
// SHIF CALCULATOR
// ===============================
function calculateSHIF() {

  const salary = parseFloat(document.getElementById("shifSalary").value);

  if (isNaN(salary) || salary <= 0) {
    alert("Enter a valid salary.");
    return;
  }

  const shif = Math.max(salary * 0.0275, 300);

  document.getElementById("shifResult").innerHTML =
    `<p><strong>Monthly SHIF Contribution:</strong> KES ${Math.round(shif).toLocaleString()}</p>`;
}


// ===============================
// VAT CALCULATOR
// ===============================
function calculateVAT() {

  const amount = parseFloat(document.getElementById("vatAmount").value);

  if (isNaN(amount) || amount <= 0) {
    alert("Enter a valid amount.");
    return;
  }

  const vat = amount * 0.16;
  const total = amount + vat;

  document.getElementById("vatResult").innerHTML = `
    <p>VAT (16%): KES ${vat.toLocaleString()}</p>
    <p><strong>Total Amount:</strong> KES ${total.toLocaleString()}</p>
  `;
}
