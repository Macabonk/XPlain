// Normalize Math Functions
function normalizeMathFunctions(expr) {
  return expr
    .replace(/\^/g, "**")
    .replace(/(?<!Math\.)\b(sin|cos|tan|asin|acos|atan|log10|log|exp|sqrt|abs)\b/g, "Math.$1")
    .replace(/\bpi\b/gi, "Math.PI")
    .replace(/\be\b/gi, "Math.E");
}

// Fraction Parser
function parseFraction(input) {
  if (!input.includes("/")) return Number(input);
  const parts = input.split("/").map(Number);
  return parts.length === 2 && parts[1] !== 0 ? parts[0] / parts[1] : NaN;
}

// ✅ Safe number formatter (handles NaN as 0)
function safe(val, decimals) {
  return isNaN(val) ? (0).toFixed(decimals) : val.toFixed(decimals);
}

// Show/hide relevant fields
document.getElementById("method").addEventListener("change", function () {
  const method = this.value;
  document.getElementById("gx").style.display = method === "fixed" ? "block" : "none";
  document.getElementById("gxLabel").style.display = method === "fixed" ? "block" : "none";
  document.getElementById("x1").style.display = method === "secant" ? "block" : "none";
  document.getElementById("x1Label").style.display = method === "secant" ? "block" : "none";
  document.getElementById("derivativeLabel").style.display = method === "newton" ? "block" : "none";
  document.getElementById("derivativeDisplay").style.display = method === "newton" ? "block" : "none";
});

// Show derivative when f(x) is typed
document.getElementById("function").addEventListener("input", function () {
  const raw = this.value.trim();
  const stripped = normalizeMathFunctions(raw).replace(/Math\./g, '');
  try {
    const derivative = math.derivative(stripped, 'x').toString();
    document.getElementById("derivativeDisplay").innerText = derivative;
  } catch {
    document.getElementById("derivativeDisplay").innerText = "Unable to compute derivative.";
  }
});

// Root Finder Logic
document.getElementById("iterationForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const method = document.getElementById("method").value;
  const useFraction = document.getElementById("useFraction").checked;
  const fRaw = document.getElementById("function").value.trim();
  const gxStr = document.getElementById("gx").value.trim();
  const x0Input = document.getElementById("x0").value.trim();
  const x1Input = document.getElementById("x1").value.trim();
  const iterations = parseInt(document.getElementById("iterations").value);
  const decimals = parseInt(document.getElementById("decimals").value);

  let x0 = useFraction ? parseFraction(x0Input) : Number(x0Input);
  if (isNaN(x0)) return alert("Invalid input for x₀.");

  let x1 = null;
  if (method === "secant") {
    x1 = useFraction ? parseFraction(x1Input) : Number(x1Input);
    if (isNaN(x1)) return alert("Invalid input for x₁.");
  }

  const fNorm = normalizeMathFunctions(fRaw);
  const f = new Function("x", "return " + fNorm);
  const df = x => (f(x + 1e-5) - f(x)) / 1e-5;

  const result = document.getElementById("result");
  const explanation = document.getElementById("explanation");
  result.innerHTML = "";
  explanation.innerText = "";

  let data = [];
  let explain = "";

  if (method === "fixed") {
    const gx = new Function("x", "return " + normalizeMathFunctions(gxStr));
    explain += "Fixed Point Iteration Formula: xₙ₊₁ = g(xₙ)\n";
    let current = x0;
    for (let i = 0; i < iterations; i++) {
      const gval = gx(current);
      const err = Math.abs((gval - current) / gval) * 100;
      data.push([i + 1, safe(current, decimals), safe(gval, decimals), safe(err, decimals)]);
      explain += `Iteration ${i + 1}:\n  Formula: xₙ₊₁ = g(xₙ) = g(${safe(current, decimals)}) = ${safe(gval, decimals)}\n  Relative Error = ${safe(err, decimals)}%\n\n`;
      current = gval;
    }
    displayTable(["i", "x", "g(x)", "Relative Error (%)"], data);
  } else if (method === "newton") {
    explain += "Newton-Raphson Formula: xₙ₊₁ = xₙ - f(xₙ)/f'(xₙ)\n";
    let current = x0;
    for (let i = 0; i < iterations; i++) {
      const fx = f(current);
      const dfx = df(current);
      const next = current - fx / dfx;
      const err = Math.abs((next - current) / next) * 100;
      data.push([i + 1, safe(current, decimals), safe(fx, decimals), safe(dfx, decimals), safe(err, decimals)]);
      explain += `Iteration ${i + 1}:\n  Formula: xₙ₊₁ = ${safe(current, decimals)} - ${safe(fx, decimals)}/${safe(dfx, decimals)} = ${safe(next, decimals)}\n  Relative Error = ${safe(err, decimals)}%\n\n`;
      current = next;
    }
    displayTable(["i", "x", "f(x)", "f'(x)", "Relative Error (%)"], data);
  } else {
    explain += "Secant Formula: xₙ₊₁ = xₙ - f(xₙ)*(xₙ - xₙ₋₁)/(f(xₙ) - f(xₙ₋₁))\n";
    let a = x0, b = x1;
    for (let i = 0; i < iterations; i++) {
      const fa = f(a), fb = f(b);
      const next = b - fb * (b - a) / (fb - fa);
      const err = Math.abs((next - b) / next) * 100;
      data.push([i + 1, safe(a, decimals), safe(b, decimals), safe(fa, decimals), safe(fb, decimals), safe(err, decimals)]);
      explain += `Iteration ${i + 1}:\n  xₙ₊₁ = ${safe(b, decimals)} - ${safe(fb, decimals)}*(${safe(b, decimals)} - ${safe(a, decimals)}) / (${safe(fb, decimals)} - ${safe(fa, decimals)}) = ${safe(next, decimals)}\n  Relative Error = ${safe(err, decimals)}%\n\n`;
      a = b;
      b = next;
    }
    displayTable(["i", "xₐ", "xᵦ", "f(xₐ)", "f(xᵦ)", "Relative Error (%)"], data);
  }

  explanation.innerText = explain;
});

function displayTable(headers, data) {
  let tableHTML = "<table><thead><tr>";
  headers.forEach(header => tableHTML += `<th>${header}</th>`);
  tableHTML += "</tr></thead><tbody>";
  data.forEach(row => {
    tableHTML += "<tr>";
    row.forEach(cell => tableHTML += `<td>${cell}</td>`);
    tableHTML += "</tr>";
  });
  tableHTML += "</tbody></table>";
  document.getElementById("result").innerHTML = tableHTML;
}

// Toggle Mode
document.getElementById("switchToDiff").addEventListener("click", () => {
  const root = document.getElementById("rootFinderSection");
  const diff = document.getElementById("diffSection");
  const img = document.querySelector("#switchToDiff img");

  if (diff.style.display === "none") {
    root.style.display = "none";
    diff.style.display = "block";
    img.src = "img/switchR.png";
  } else {
    root.style.display = "block";
    diff.style.display = "none";
    img.src = "img/switchN.png";
  }
});

// Numerical Differentiation Logic
document.getElementById("diffForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const exprStr = document.getElementById("diffFunc").value.trim().replace(/\^/g, "**");
  const xInput = document.getElementById("diffX").value.trim();
  const hInput = document.getElementById("diffH").value.trim();
  const decimals = parseInt(document.getElementById("diffDecimals").value);

  try {
    const x = math.evaluate(xInput);
    const h = math.evaluate(hInput);
    const node = math.parse(exprStr);
    const code = node.compile();
    const fx = xVal => code.evaluate({ x: xVal });

    const f_x = fx(x);
    const f_xh = fx(x + h);
    const f_xmh = fx(x - h);

    const forward = (f_xh - f_x) / h;
    const backward = (f_x - f_xmh) / h;
    const central = (f_xh - f_xmh) / (2 * h);

    const symbolic = math.derivative(exprStr, 'x');
    const exact = symbolic.evaluate({ x });

    const err = approx => Math.abs((approx - exact) / exact) * 100;

    let tableHTML = `
      <div><strong>Function:</strong> f(x) = ${exprStr}</div>
      <div><strong>x =</strong> ${safe(x, decimals)}, <strong>h =</strong> ${h}</div>
      <br>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Approximation</th>
            <th>Relative Error (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Exact Derivative</td>
            <td>${safe(exact, decimals)}</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Forward Difference</td>
            <td>${safe(forward, decimals)}</td>
            <td>${safe(err(forward), decimals)}%</td>
          </tr>
          <tr>
            <td>Backward Difference</td>
            <td>${safe(backward, decimals)}</td>
            <td>${safe(err(backward), decimals)}%</td>
          </tr>
          <tr>
            <td>Central Difference</td>
            <td>${safe(central, decimals)}</td>
            <td>${safe(err(central), decimals)}%</td>
          </tr>
        </tbody>
      </table>
    `;

    document.getElementById("diffResult").innerHTML = tableHTML;
  } catch {
    alert("Error parsing function or inputs. Please check syntax.");
  }
});

// Info Popup
const infoIcon = document.getElementById("info-icon");
const infoPop = document.getElementById("info-pop");
const closeBtn = document.getElementById("closeBtn");

infoIcon.addEventListener("click", () => {
  infoPop.style.display = "flex";
});

closeBtn.addEventListener("click", () => {
  infoPop.style.display = "none";
});

infoPop.addEventListener("click", (e) => {
  if (e.target === infoPop) {
    infoPop.style.display = "none";
  }
});
