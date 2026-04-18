const fs = require("fs");
const path = require("path");

const globalRoot = require("child_process").execSync("npm root -g").toString().trim();
const docxPath = path.join(globalRoot, "docx");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak, TabStopType, TabStopPosition
} = require(docxPath);

// Helpers
const border = { style: BorderStyle.SINGLE, size: 4, color: "B0B0B0" };
const cellBorders = { top: border, bottom: border, left: border, right: border };

const dashedBorder = { style: BorderStyle.DASHED, size: 8, color: "9AA4B2" };
const imageBoxBorders = { top: dashedBorder, bottom: dashedBorder, left: dashedBorder, right: dashedBorder };

const PRIMARY = "1F4E79";
const ACCENT = "2E75B6";
const LIGHT_BG = "EAF2FA";
const MUTED = "5A6470";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text, bold: true, color: PRIMARY, size: 36, font: "Arial" })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 28, font: "Arial" })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, color: PRIMARY, size: 24, font: "Arial" })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 140, line: 300 },
    alignment: opts.align || AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts })],
  });
}
function pRuns(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 140, line: 300 },
    alignment: opts.align || AlignmentType.LEFT,
    children: runs,
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}
function bulletRuns(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 300 },
    children: runs,
  });
}
function num(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 100, line: 300 },
    children: [new TextRun({ text, font: "Arial", size: 22 })],
  });
}
function numRuns(runs, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { after: 100, line: 300 },
    children: runs,
  });
}

// Image placeholder box (dashed border with centered caption text)
function imagePlaceholder(caption, heightTwips = 3200) {
  const emptyLines = Math.max(2, Math.floor(heightTwips / 500));
  const innerChildren = [];
  for (let i = 0; i < Math.floor(emptyLines / 2); i++) {
    innerChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }
  innerChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "[ Insert Image Here ]", bold: true, color: MUTED, size: 24, font: "Arial" })],
  }));
  innerChildren.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80 },
    children: [new TextRun({ text: caption, italics: true, color: MUTED, size: 20, font: "Arial" })],
  }));
  for (let i = 0; i < Math.floor(emptyLines / 2); i++) {
    innerChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        height: { value: heightTwips, rule: "atLeast" },
        children: [
          new TableCell({
            borders: imageBoxBorders,
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: "F7F9FC", type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: innerChildren,
          }),
        ],
      }),
    ],
  });
}

function calloutBox(title, bodyText) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.SINGLE, size: 18, color: ACCENT },
              bottom: border, left: border, right: border,
            },
            width: { size: 9360, type: WidthType.DXA },
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, bold: true, color: PRIMARY, size: 24, font: "Arial" })],
              }),
              new Paragraph({
                spacing: { line: 300 },
                children: [new TextRun({ text: bodyText, size: 22, font: "Arial" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function spacer() { return new Paragraph({ children: [new TextRun("")] }); }

// Feature comparison table
function featureTable() {
  const headerRow = (cols) => new TableRow({
    tableHeader: true,
    children: cols.map((c, i) => new TableCell({
      borders: cellBorders,
      width: { size: i === 0 ? 3120 : 3120, type: WidthType.DXA },
      shading: { fill: PRIMARY, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({
        children: [new TextRun({ text: c, bold: true, color: "FFFFFF", size: 22, font: "Arial" })],
      })],
    })),
  });
  const row = (cols, stripe = false) => new TableRow({
    children: cols.map((c, i) => new TableCell({
      borders: cellBorders,
      width: { size: 3120, type: WidthType.DXA },
      shading: stripe ? { fill: "F2F6FB", type: ShadingType.CLEAR } : undefined,
      margins: { top: 90, bottom: 90, left: 140, right: 140 },
      children: [new Paragraph({
        children: [new TextRun({ text: c, size: 22, font: "Arial", bold: i === 0 })],
      })],
    })),
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 3120, 3120],
    rows: [
      headerRow(["Violation Type", "Triggered By", "Deduction Basis"]),
      row(["Excess Fuel Consumption", "Actual vs. expected litres", "Extra litres × fuel price"], true),
      row(["Excessive Speed", "Speed threshold breaches from telematics", "Policy-defined penalty"], false),
      row(["Excessive Idling", "Idle duration beyond limit", "Policy-defined penalty"], true),
    ],
  });
}

function stageTable() {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ["Stage", "What Happens", "Actor"].map(c => new TableCell({
      borders: cellBorders,
      width: { size: 3120, type: WidthType.DXA },
      shading: { fill: PRIMARY, type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, color: "FFFFFF", size: 22, font: "Arial" })] })],
    })),
  });
  const row = (cols, stripe = false) => new TableRow({
    children: cols.map((c, i) => new TableCell({
      borders: cellBorders,
      width: { size: 3120, type: WidthType.DXA },
      shading: stripe ? { fill: "F2F6FB", type: ShadingType.CLEAR } : undefined,
      margins: { top: 90, bottom: 90, left: 140, right: 140 },
      children: [new Paragraph({ children: [new TextRun({ text: c, size: 22, font: "Arial", bold: i === 0 })] })],
    })),
  });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [3120, 3120, 3120],
    rows: [
      headerRow,
      row(["Draft", "Letter created from candidate or manually; editable.", "Fleet Admin"], true),
      row(["Approved", "Manager-signed approval document uploaded.", "Manager"], false),
      row(["Pending Signed", "Signature requested from driver (single or bulk).", "System / Admin"], true),
      row(["Signed", "Signed copy uploaded back into the workflow.", "Admin"], false),
      row(["Acknowledged", "Driver acknowledges receipt — workflow complete.", "Driver"], true),
    ],
  });
}

// Build the document
const doc = new Document({
  creator: "FMS Product Team",
  title: "Warning Letter Module — Release Update",
  description: "Software release update blog post for the Warning Letter feature",
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, color: PRIMARY, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: ACCENT, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: PRIMARY, font: "Arial" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
          children: [
            new TextRun({ text: "FMS Release Notes", bold: true, color: PRIMARY, size: 20, font: "Arial" }),
            new TextRun({ text: "\tWarning Letter Module", color: MUTED, size: 20, font: "Arial" }),
          ],
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", color: MUTED, size: 18, font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 18, font: "Arial" }),
          ],
        })],
      }),
    },
    children: [
      // ===== Cover block =====
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { before: 200, after: 60 },
        children: [new TextRun({ text: "FMS PRODUCT BLOG  |  RELEASE UPDATE", bold: true, color: ACCENT, size: 20, font: "Arial", characterSpacing: 40 })],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: "Driving Accountability:", bold: true, color: PRIMARY, size: 48, font: "Arial" })],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: "The New Warning Letter Module", bold: true, color: "333333", size: 36, font: "Arial" })],
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [
          new TextRun({ text: "Published: April 2026", color: MUTED, size: 22, font: "Arial", italics: true }),
          new TextRun({ text: "        |        ", color: MUTED, size: 22, font: "Arial" }),
          new TextRun({ text: "Author: FMS Product Team", color: MUTED, size: 22, font: "Arial", italics: true }),
        ],
      }),
      imagePlaceholder("Cover image — suggestion: banner screenshot of the Warning Letter dashboard", 3600),
      spacer(),

      // ===== Intro =====
      p("Managing a fleet is as much about people as it is about vehicles. Fuel losses, reckless speeding, and prolonged idling silently erode margins and safety standards every single day. With this release, the FMS Warning Letter module transforms those scattered concerns into a structured, auditable workflow — one that turns raw consumption data into formal, signed, and acknowledged documentation."),
      p("This post walks through the problem we set out to solve, what the module now does, the reports it ships with, and a step-by-step guide to using it."),

      // ===== Section 1: The Problem =====
      h1("The Problem We Set Out to Solve"),
      p("Before this module, fleet managers relied on spreadsheets, email threads, and memory to chase down drivers who breached fuel or safety thresholds. The result was predictable:"),
      bullet("Violations slipped through the cracks because no one was systematically scanning consumption data."),
      bullet("Warnings that did get issued had no consistent format, no approval trail, and no proof of acknowledgement."),
      bullet("HR and finance had no single view of deductions, pending signatures, or repeat offenders."),
      bullet("Audits were painful — pulling evidence across months of scattered documents took days."),
      spacer(),
      calloutBox(
        "What success looks like",
        "Every breach of policy is detected automatically, documented on a branded letter, approved, signed, and acknowledged — with every step traceable from one screen."
      ),
      spacer(),
      imagePlaceholder("Suggested image — the \u201CCandidates\u201D report surfacing drivers who have crossed consumption thresholds", 3200),

      // ===== Section 2: Features =====
      h1("What the Module Does"),
      p("The Warning Letter module covers the full lifecycle of a disciplinary letter, from detection to acknowledgement. It is built around three violation types, each with its own threshold logic and deduction basis."),
      h2("Supported Violation Types"),
      featureTable(),
      spacer(),
      h2("Core Capabilities"),
      bulletRuns([
        new TextRun({ text: "Candidate detection\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "Automatically surfaces drivers whose consumption, speed, or idling exceeds policy for the selected period.", font: "Arial", size: 22 }),
      ]),
      bulletRuns([
        new TextRun({ text: "HTML preview before issue\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "The ", font: "Arial", size: 22 }),
        new TextRun({ text: "Preview", font: "Arial", size: 22, italics: true }),
        new TextRun({ text: " action renders the exact letter in-browser so nothing is sent blind.", font: "Arial", size: 22 }),
      ]),
      bulletRuns([
        new TextRun({ text: "Branded PDF generation\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "Letters render with the company letterhead and issuer details pulled from workflow settings.", font: "Arial", size: 22 }),
      ]),
      bulletRuns([
        new TextRun({ text: "Bulk signature requests\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "Select multiple letters and request driver signatures in one action.", font: "Arial", size: 22 }),
      ]),
      bulletRuns([
        new TextRun({ text: "Approval and signed-copy uploads\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "Attach manager approval and the driver\u2019s signed copy directly to the record.", font: "Arial", size: 22 }),
      ]),
      bulletRuns([
        new TextRun({ text: "Configurable settings\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "Fuel price per litre, issuer name and title, and a maximum warning threshold per driver are all admin-controlled.", font: "Arial", size: 22 }),
      ]),
      bulletRuns([
        new TextRun({ text: "Full audit trail\u00A0\u2014 ", bold: true, font: "Arial", size: 22 }),
        new TextRun({ text: "Every stage transition captures the actor and timestamp.", font: "Arial", size: 22 }),
      ]),
      spacer(),
      imagePlaceholder("Suggested image — the warning letter creation form with the \u201CPreview\u201D button visible", 3400),

      h2("Workflow Stages"),
      p("A warning letter progresses through five stages. The system enforces the order, so nothing slips out of sequence."),
      stageTable(),
      spacer(),
      imagePlaceholder("Suggested image — stage pills on the Warning Letter list page, showing Draft / Approved / Pending Signed / Signed / Acknowledged", 2800),

      // ===== Section 3: Reports =====
      h1("Reports Shipped With This Release"),
      p("Two new reports turn the workflow into insight for managers, HR, and finance."),

      h2("1. Warning Letter Analytics"),
      p("A full dashboard of issued letters and their business impact. It answers questions like: How much have we deducted this quarter? Which sites are driving most of the warnings? Which employees are repeat offenders? Where are letters getting stuck in the workflow?"),
      h3("What it shows"),
      bullet("Stage breakdown across Draft, Approved, Pending Signed, Signed, and Acknowledged."),
      bullet("Total deductions grouped by site and by vehicle type."),
      bullet("Employee ranking by warning count."),
      bullet("Monthly trend lines for issuance and deductions."),
      bullet("Average days between workflow transitions \u2014 a health-check on how long approvals and signatures actually take."),
      h3("Filters"),
      bullet("Date range, site, vehicle, vehicle type, employee (multi-select), letter type, workflow stage."),
      spacer(),
      imagePlaceholder("Suggested image — Warning Letter Analytics dashboard with charts and KPIs", 3800),

      h2("2. Warning Letter Candidates"),
      p("A proactive report. Instead of waiting for someone to notice a problem, this report lists employees whose consumption, speed, or idling already crosses the threshold but who do not yet have a letter for the period. Managers can go from this report straight into letter creation."),
      h3("What it shows"),
      bullet("Employees matching one or more violation types for the selected period."),
      bullet("The expected vs. actual metric that triggered the match."),
      bullet("Site, vehicle, and vehicle-type context for every row."),
      h3("Filters"),
      bullet("Date range, site, vehicles (multi-select), vehicle type, and letter types (multi-select across Excess Fuel, Excessive Speed, Excessive Idling)."),
      spacer(),
      imagePlaceholder("Suggested image — Candidates report with multi-select filters open", 3400),

      // ===== Section 4: How to use =====
      h1("How to Use It \u2014 Step by Step"),
      p("The procedure below walks through the most common path: finding candidates, issuing letters, and closing the loop with signatures and acknowledgement."),

      h3("Step 1 \u2014 Configure workflow settings"),
      num("Open Warning Letter Settings."),
      num("Set the fuel price per litre used for deduction calculations."),
      num("Enter the issuer name and title that should appear on every letter."),
      num("Set the maximum warning count per driver before escalation."),
      spacer(),
      imagePlaceholder("Suggested image — Warning Letter Settings screen", 2800),

      h3("Step 2 \u2014 Find candidates"),
      num("Navigate to Reports \u2192 Warning Letter Candidates."),
      num("Select the date range, site, vehicles, and the violation types you want to scan for."),
      num("Run the report \u2014 the grid returns drivers who have breached thresholds and do not yet have a letter for the period."),
      spacer(),
      imagePlaceholder("Suggested image — running the Candidates report and selecting rows to action", 3000),

      h3("Step 3 \u2014 Create the letter"),
      num("From the candidate grid (or the Warning Letters page directly), open the creation form."),
      num("Confirm the employee, vehicle, site, period, violation summary, and the expected vs. actual values \u2014 most fields are pre-filled from the detection."),
      numRuns([
        new TextRun({ text: "Click ", font: "Arial", size: 22 }),
        new TextRun({ text: "Preview", font: "Arial", size: 22, bold: true }),
        new TextRun({ text: " to render the final HTML letter with letterhead and deduction figure. Review carefully.", font: "Arial", size: 22 }),
      ]),
      num("Save \u2014 the letter is created in Draft stage."),
      spacer(),
      imagePlaceholder("Suggested image — the HTML preview modal with the rendered letter", 3600),

      h3("Step 4 \u2014 Get it approved"),
      num("Download the draft PDF and circulate it for manager sign-off."),
      num("Upload the signed approval document back to the letter record \u2014 the workflow advances to Approved."),
      spacer(),

      h3("Step 5 \u2014 Request driver signature"),
      num("From the list, select one or many letters and choose Request Signature."),
      num("The letters move to Pending Signed and the driver is notified."),
      spacer(),
      imagePlaceholder("Suggested image — bulk select with the \u201CRequest Signature\u201D action", 2800),

      h3("Step 6 \u2014 Close the loop"),
      num("Once the driver signs, upload the signed copy \u2014 the letter moves to Signed."),
      num("Record the driver\u2019s acknowledgement to close the workflow at Acknowledged."),
      num("The letter, approval document, signed copy, and timestamps are all preserved for audit."),
      spacer(),
      imagePlaceholder("Suggested image — a completed letter record showing all attached documents and the full stage timeline", 3400),

      // ===== Section 5: Recent enhancements =====
      h1("What\u2019s New in This Release"),
      p("Alongside the core module, this release ships several quality-of-life improvements:"),
      bullet("Inline HTML preview components with proper state management so previews stay in sync as the form is edited."),
      bullet("Improved date handling and clearer error messages when submitting or importing letters."),
      bullet("Historical probe snapshots are preserved across form edits, so context is not lost on long edits."),
      bullet("Consolidated permission checks, making it easier to grant the right level of access to each role."),
      bullet("A cleaner PDF rendering pipeline, reorganised into dedicated Builders, Core, and Renderers layers for faster future extension."),

      // ===== Section 6: Close =====
      h1("Closing Notes"),
      p("The Warning Letter module closes a long-standing gap between the data we already collect and the disciplinary action that data should drive. For managers it means less chasing. For HR and finance it means a clean audit trail. For drivers it means fair, consistent, well-documented treatment."),
      p("We\u2019d love your feedback after you run your first batch of letters through the workflow \u2014 especially on the reports and the candidate thresholds. Reach out to the FMS product team with questions, bugs, or ideas for the next iteration."),
      spacer(),
      calloutBox(
        "Try it next",
        "Run the Candidates report over the last 30 days for your busiest site, pick three drivers, and walk a letter end-to-end through to Acknowledged. That is the fastest way to feel what this module changes."
      ),
      spacer(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "\u2014 End of Release Update \u2014", italics: true, color: MUTED, size: 20, font: "Arial" })],
      }),
    ],
  }],
});

const outPath = path.resolve("C:/Users/kkagiri/Sources/Repo/Hyoung.FMS/Documentation/Warning_Letter_Release_Update.docx");
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log("Wrote:", outPath, "size:", buf.length);
});
