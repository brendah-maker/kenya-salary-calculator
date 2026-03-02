// Wait for DOM
document.addEventListener('DOMContentLoaded', function() {

  // Calculator switch
  const calcSelect = document.getElementById('calculatorSelect');
  calcSelect.addEventListener('change', switchCalculator);

  // Buttons
  document.getElementById('calculatePAYEButton').addEventListener('click', calculatePAYE);
  document.getElementById('calculateSHIFButton').addEventListener('click', calculateSHIF);
  document.getElementById('calculateVATButton').addEventListener('click', calculateVAT);

  // Cookie Banner
  const banner = document.getElementById('cookieBanner');
  const btn = document.getElementById('acceptCookies');
  if (!localStorage.getItem('cookiesAccepted')) banner.style.display = 'flex';
  btn.addEventListener('click', function() {
    localStorage.setItem('cookiesAccepted', 'true');
    banner.style.display = 'none';
  });

  // Show PAYE by default
  switchCalculator();
});

// --------------------------
// Calculator Switch
// --------------------------
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

// --------------------------
// PAYE Calculator
// --------------------------
function calculatePAYE() {
  const mode = document.getElementById("mode").value;
  const input = parseFloat(document.getElementById("grossSalary").value);
  const input2 = parseFloat(document.getElementById("grossSalary2").value);

  if (isNaN(input) || input <= 0) { alert("Enter a valid salary"); return; }

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

  // Optional comparison
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

// --------------------------
// Other functions
// --------------------------
function calculateDeductions(gross) {
  // NSSF
  let nssf = gross <= 9000 ? gross*0.06 : gross > 108000 ? 6480 : 540 + (gross-9000)*0.06;
  if (nssf > 6480) nssf = 6480;

  // SHIF
  let shif = Math.max(gross*0.0275, 300);

  // Housing Levy
  let housingLevy = gross*0.015;

  const taxableIncome = gross - nssf; // Only NSSF reduces taxable income
  const bands = [
    { upper: 24000, rate: 0.10 },
    { upper: 32333, rate: 0.25 },
    { upper: 47667, rate: 0.30 },
    { upper: 100000, rate: 0.325 },
    { upper: Infinity, rate: 0.35 }
  ];

  let paye=0, lower=0;
  for (let band of bands) {
    if (taxableIncome>lower) {
      paye += (Math.min(taxableIncome, band.upper)-lower)*band.rate;
      lower=band.upper;
    } else break;
  }
  paye = Math.max(paye-2400,0);

  const net = gross - (paye + nssf + shif + housingLevy);
  return { paye:Math.round(paye), nssf:Math.round(nssf), shif:Math.round(shif), housingLevy:Math.round(housingLevy), net:Math.round(net) };
}

function estimateGrossFromNet(targetNet) {
  let grossEstimate = targetNet;
  for (let i=0;i<200;i++) {
    const res = calculateDeductions(grossEstimate);
    const diff = res.net - targetNet;
    if (Math.abs(diff)<1) break;
    grossEstimate -= diff;
  }
  return Math.round(grossEstimate);
}

// displayResults, displayComparison, renderChart, renderStackedComparison, lightenColor, calculateSHIF, calculateVAT
// ... use your original code, but ensure they are in **global scope**
