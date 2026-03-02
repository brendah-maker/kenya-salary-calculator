// Wait for DOM to fully load
document.addEventListener('DOMContentLoaded', function() {

  // --- Calculator Switch ---
  const calcSelect = document.getElementById('calculatorSelect');
  calcSelect.addEventListener('change', switchCalculator);

  // --- PAYE ---
  document.getElementById('calculatePAYEButton').addEventListener('click', calculatePAYE);

  // --- SHIF ---
  document.getElementById('calculateSHIFButton').addEventListener('click', calculateSHIF);

  // --- VAT ---
  document.getElementById('calculateVATButton').addEventListener('click', calculateVAT);

  // --- Cookie Banner ---
  const banner = document.getElementById('cookieBanner');
  const btn = document.getElementById('acceptCookies');
  if (!localStorage.getItem('cookiesAccepted')) banner.style.display = 'flex';
  btn.addEventListener('click', function() {
    localStorage.setItem('cookiesAccepted', 'true');
    banner.style.display = 'none';
  });

});

// ===============================
// Switch Calculator
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
// PAYE Calculator
// ===============================
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

// --- Other functions remain same as your original ---
// calculateDeductions, estimateGrossFromNet, displayResults, displayComparison, renderChart, renderStackedComparison, lightenColor, calculateSHIF, calculateVAT
