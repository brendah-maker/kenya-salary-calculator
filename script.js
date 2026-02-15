function calculate() {
    const mode = document.getElementById("mode").value;
    const grossSalary = parseFloat(document.getElementById("grossSalary").value);
    const grossSalary2 = parseFloat(document.getElementById("grossSalary2").value);

    if (isNaN(grossSalary)) {
        alert("Please enter a valid salary");
        return;
    }

    // ===== 1️⃣ Calculate deductions (Kenya 2026 example) =====
    const nssf = Math.min(2000, grossSalary * 0.06); // Max NSSF 2000 KES
    const shif = grossSalary * 0.01; // 1% SHIF
    const housingLevy = grossSalary * 0.01; // 1% Housing Levy
    const paye = calculatePAYE(grossSalary); // PAYE calculation
    const netSalary = grossSalary - (nssf + shif + housingLevy + paye);

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
}

// ===== PAYE CALCULATION FUNCTION (Example 2026 rates) =====
function calculatePAYE(salary) {
    let paye = 0;

    if (salary <= 12298) {
        paye = salary * 0.10;
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
