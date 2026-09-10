function extractGoogleStat(html, label) {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escapedLabel}<\\/div>\\s*<div class="dO6ijd">([^<]*)<\\/div>`,
    "i"
  );
  const match = html.match(pattern);
  if (!match?.[1]) return null;
  const cleaned = match[1].replace(/[₹$€£¥\s]/g, "").replace(/,/g, "");
  const value = parseFloat(cleaned);
  if (!isFinite(value)) return null;
  return value;
}

const HTML_EPS_NEGATIVE = `
<div class="SwQK7">P/E ratio</div><div class="dO6ijd">25.30</div>
<div class="SwQK7">EPS</div><div class="dO6ijd">₹-8.42</div>
`;
console.log(extractGoogleStat(HTML_EPS_NEGATIVE, "EPS"));
