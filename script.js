function calculate() {
    const mode = document.getElementById("mode").value;
    const inputValue = parseFloat(document.getElementById("grossSalary").value);

    if (isNaN(inputValue) || inputValue <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    let gross, net, paye, nssf, shif;

    if (mode === "net") {
        // Calculate Net Salary (from Gross)
        gross = inputValue;
        ({paye, nssf, shif, net} = calculateDeductions(gross));
    } else {
        // Estimate Gross Salary (from Net)
        net = inputValue;
        gross = net; // initial guess
        let iteration = 0;
        const maxIterations = 1000;

        while (iteration < maxIterations) {
            ({paye, nssf, shif, net: calcNet} = calculateDeductions(gross));
            if (Math.abs(calcNet - net) < 10) break;
            gross += (calcNet < net ? 100 : -50);
            iteration++;
        }
    }

    // Display results
    document.getElementById("result").innerHTML = `
        <h2>Results:</h2>
        <p>Gross Salary: KES ${gross.toLocaleString()}</p>
        <p>PAYE: KES ${paye.toLocaleString()}</p>
        <p>NSSF (2026): KES ${nssf.toLocaleString()}</p>
        <p>SHIF (2026): KES ${shif.toLocaleString()}</p>
        <p><strong>Net Salary: KES ${net.toLocaleString()}</strong></p>
    `;
}

function calculateDeductions(gross) {
    // PAYE bands
    let paye = 0;
    let remaining = gross;

    const band1 = Math.min(remaining, 24000);
    paye += band1 * 0.10;
    remaining -= band1;

    if (remaining > 0) {
        const band2 = Math.min(remaining, 8333);
        paye += band2 * 0.25;
        remaining -= band2;
    }
    if (remaining > 0) {
        const band3 = Math.min(remaining, 467667);
        paye += band3 * 0.30;
        remaining -= band3;
    }
    if (remaining > 0) {
        const band4 = Math.min(remaining, 300000);
        paye += band4 * 0.325;
        remaining -= band4;
    }
    if (remaining > 0) {
        paye += remaining * 0.35;
    }

    // Personal relief
    const personalRelief = 2400;
    paye = Math.max(paye - personalRelief, 0);

    // NSSF 2026
    let nssf = 0;
    if (gross > 9000) {
        nssf = gross * 0.06;
        if (nssf > 6480) nssf = 6480;
    }

    // SHIF
    let shif = gross * 0.0275;
    if (shif < 300) shif = 300;

    const net = gross - (paye + nssf + shif);

    return { paye, nssf, shif, net };
}
