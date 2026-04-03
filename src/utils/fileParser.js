// utils/fileParser.js
const XLSX = require("xlsx");
const fs = require("fs");
const csv = require("csv-parser");

// ─── Required Columns ─────────────────────────────────────────────────────────
// If any of these are missing/renamed in the uploaded file, an error is thrown.
const REQUIRED_COLUMNS = [
  "First Name","Full Address","Location","State"
];

// At least one column from each group must be present.
const REQUIRED_ONE_OF_GROUPS = [
  ["Email", "Contact Number"], // candidate must have at least one contact method
];

// ─── Column Mapping ───────────────────────────────────────────────────────────
const COLUMN_MAP = {
  f_name:          { columns: ["First Name"],    fallback: null },
  m_name:          { columns: ["Middle Name"],   fallback: null },
  l_name:          { columns: ["Last Name"],     fallback: null },
  candidate_email: { columns: ["Email"],         fallback: null },
  candidate_phone: { columns: ["Contact Number"],fallback: null },
  full_address:    { columns: ["Full Address"],  fallback: null }, // ← typo fixed
};

// ─── Validate COLUMN_MAP at startup ──────────────────────────────────────────
for (const [key, config] of Object.entries(COLUMN_MAP)) {
  if (!Array.isArray(config.columns)) {
    throw new Error(
      `COLUMN_MAP misconfiguration: "${key}" is missing a valid "columns" array. ` +
      `Found "${Object.keys(config).join(", ")}" instead.`
    );
  }
}

// ─── Header Validator ─────────────────────────────────────────────────────────
function validateHeaders(headers) {
  // Check strictly required columns
  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    const error = new Error(
      `Invalid file: The following required column(s) are missing or renamed: ` +
      `${missing.map((col) => `"${col}"`).join(", ")}. ` +
      `Please use the original template without modifying column headers.`
    );
    error.code = "INVALID_HEADERS";
    error.missingColumns = missing;
    throw error;
  }

  // Check "at least one of" groups
  for (const group of REQUIRED_ONE_OF_GROUPS) {
    const hasOne = group.some((col) => headers.includes(col));
    if (!hasOne) {
      const error = new Error(
        `Invalid file: At least one of the following column(s) must be present: ` +
        `${group.map((col) => `"${col}"`).join(", ")}.`
      );
      error.code = "INVALID_HEADERS";
      error.missingColumns = group;
      throw error;
    }
  }
}

// ─── Row Transformer ──────────────────────────────────────────────────────────
function transformRow(row) {
  const mapped = {};

  for (const [standardKey, { columns, fallback = null }] of Object.entries(COLUMN_MAP)) {
    const match = columns.find((col) => row[col] !== undefined && row[col] !== "");
    mapped[standardKey] = match ? String(row[match]).trim() : fallback;
  }

  return { ...row, ...mapped };
}

// ─── Parser ───────────────────────────────────────────────────────────────────
exports.parseFile = async (filePath, ext) => {
  let records = [];

  if (ext === "csv") {
    let headers = null;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("headers", (hdrs) => {
          headers = hdrs;
          try {
            validateHeaders(headers);
          } catch (err) {
            reject(err); // Stop stream immediately on bad headers
          }
        })
        .on("data", (row) => records.push(transformRow(row)))
        .on("end", resolve)
        .on("error", reject);
    });

  } else {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const headers = rows[0] || []; // First row = headers
    validateHeaders(headers);

    records = XLSX.utils.sheet_to_json(sheet).map(transformRow);
  }

  return records;
};