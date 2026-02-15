let salaryChart = null;

function calculate() {
    const mode = document.getElementById("mode").value;
    const grossSalary = parseFloat(document.getElementById("grossSalary").value);
    const grossSalary2 = parseFloat(document.getElementById("grossSalary2").value);

    if (isNaN(grossSalary)) {
        alert("Please enter a valid salary");
        return;
    }

    // ===== 1️⃣ Calculate deductions (example logic for Kenya 2026) =====
    let nssf = Math.min(2000, grossSalary * 0.06); // max NSSF 2000 KES
    let shif = grossSalary * 0.01; // 1% SHIF
    let housingLevy = grossSalary * 0.01; // 1% housing
    let paye = calculatePAYE(grossSalary); // function below
    let netSalary = grossSalary - (nssf + shif + housingLevy + paye);

    // ===== 2️⃣ Display results =====
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `
        <p><strong>Gross Salary:</strong> KES ${grossSalary.toLocaleString()}</p>
        <p><strong>PAYE:</strong> KES ${paye.toLocaleString()}</p>
        <p><strong>NSSF:</strong> KES ${nssf.toLocaleString()}</p>
        <p><strong>SHIF:</strong> KES ${shif.toLocaleString()}</p>
        <p><strong>Housing Levy:</strong> KES ${housingLevy.toLocaleString()}</p>
        <p><strong>Net Salary:</strong> KES ${netSalary.toLocaleString()}</p>
    `;

    // ===== 3️⃣ Prepare chart data =====
    const chartData = {
        labels: ["PAYE", "NSSF", "SHIF", "Housing Levy", "Net Salary"],
        datasets: [{
            label: "Salary Breakdown",
            data: [paye, nssf, shif, housingLevy, netSalary],
            backgroundColor: [
                "#2563eb",
                "#1e40af",
                "#3b82f6",
                "#60a5fa",
                "#93c5fd"
            ]
        }]
    };

    const config = {
        type: "doughnut",
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    };

    // ===== 4️⃣ Render or Update Chart =====
    if (salaryChart) {
        salaryChart.destroy(); // destroy previous chart if exists
    }
    const ctx = document.getElementById("salaryChart").getContext("2d");
    salaryChart = new Chart(ctx, config);
}

// ===== PAYE CALCULATION FUNCTION (Example 2026 rates) =====
function calculatePAYE(salary) {
    let paye = 0;
    if (salary <= 12298) {
        paye = salary * 0.1;
    } else if (salary <= 23885) {
        paye = 1229.8 + (salary - 12298) * 0.15;
    } else if (salary <= 35472) {
        paye = 2819.25 + (salary - 23885) * 0.20;
    } else if (salary <= 47059) {
        paye = 5043.65 + (salary - 35472) * 0.25;
    } else {
        paye = 8475.90 + (salary - 47059) * 0.30;
    }
    return Math.round(paye);
}
