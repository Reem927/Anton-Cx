// ── Policy PDF Generator ──────────────────────────────────────────
// Generates a branded Anton Cx policy report PDF from extracted
// MedicalBenefitPolicy data. Uses Lato font, blue AI summary bubble,
// and per-payer breakdown tables.
//
// Designed to run server-side (API route) where we can read font
// files from the filesystem.

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import fs from 'fs';
import path from 'path';
import type { MedicalBenefitPolicy } from '../types/policy';

// ── Colors (Anton Cx design system) ──────────────────────────────

const NAVY    = [27, 58, 107] as const;   // #1B3A6B
const BLUE    = [46, 107, 230] as const;  // #2E6BE6
const BLUE_BG = [235, 240, 252] as const; // #EBF0FC
const GRAY    = [106, 117, 144] as const; // #6A7590
const LIGHT   = [247, 248, 252] as const; // #F7F8FC
const BORDER  = [232, 235, 242] as const; // #E8EBF2
const GREEN   = [15, 122, 64] as const;   // #0F7A40
const ORANGE  = [212, 136, 10] as const;  // #D4880A
const RED     = [176, 32, 32] as const;   // #B02020

// ── Font loading ─────────────────────────────────────────────────

let fontsLoaded = false;

function loadLatoFonts(doc: jsPDF) {
  if (fontsLoaded) {
    doc.setFont('Lato');
    return;
  }

  try {
    const fontsDir = path.join(process.cwd(), 'public', 'fonts');
    const regularPath = path.join(fontsDir, 'Lato-Regular.ttf');
    const boldPath = path.join(fontsDir, 'Lato-Bold.ttf');

    if (fs.existsSync(regularPath)) {
      const regularBase64 = fs.readFileSync(regularPath).toString('base64');
      doc.addFileToVFS('Lato-Regular.ttf', regularBase64);
      doc.addFont('Lato-Regular.ttf', 'Lato', 'normal');
    }

    if (fs.existsSync(boldPath)) {
      const boldBase64 = fs.readFileSync(boldPath).toString('base64');
      doc.addFileToVFS('Lato-Bold.ttf', boldBase64);
      doc.addFont('Lato-Bold.ttf', 'Lato', 'bold');
    }

    doc.setFont('Lato');
    fontsLoaded = true;
  } catch {
    // Fallback to Helvetica if font loading fails
    doc.setFont('helvetica');
  }
}

// ── Status helpers ───────────────────────────────────────────────

function statusLabel(status: string): string {
  switch (status) {
    case 'covered':          return 'COVERED';
    case 'not_covered':      return 'NOT COVERED';
    case 'no_policy_found':  return 'NO POLICY';
    case 'pharmacy_only':    return 'PHARMACY ONLY';
    default:                 return status.toUpperCase();
  }
}

function statusColor(status: string): readonly [number, number, number] {
  switch (status) {
    case 'covered':          return GREEN;
    case 'not_covered':      return RED;
    case 'no_policy_found':  return GRAY;
    case 'pharmacy_only':    return ORANGE;
    default:                 return GRAY;
  }
}

// ── Main PDF generator ───────────────────────────────────────────

export interface PolicyPdfOptions {
  drugName:    string;
  drugGeneric: string;
  jCode:       string;
  policies:    MedicalBenefitPolicy[];
  aiSummary:   string;
}

export function generatePolicyPdf(opts: PolicyPdfOptions): Buffer {
  const { drugName, drugGeneric, jCode, policies, aiSummary } = opts;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  loadLatoFonts(doc);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  const payers = [...new Set(policies.map(p => p.payer_name))];
  const now = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  // ── Page 1: Cover ────────────────────────────────────────────

  // Top accent bar
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, pageW, 3, 'F');

  // Brand
  let y = 20;
  doc.setFont('Lato', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BLUE);
  doc.text('ANTON CX', margin, y);

  doc.setFont('Lato', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Policy Intelligence Report', margin + 28, y);

  // Date
  doc.setFontSize(8);
  doc.text(now, pageW - margin, y, { align: 'right' });

  // Divider
  y += 6;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  // Drug title
  y += 14;
  doc.setFont('Lato', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...NAVY);
  doc.text(drugName, margin, y);

  // Generic + J-code
  y += 10;
  doc.setFont('Lato', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...GRAY);
  doc.text(`${drugGeneric}  ·  ${jCode || 'No J-code'}`, margin, y);

  // Stats row
  y += 12;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(margin, y - 5, contentW, 18, 3, 3, 'F');

  doc.setFont('Lato', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);

  const coveredCount = policies.filter(p => p.coverage_status === 'covered').length;
  const paCount = policies.filter(p => p.prior_auth_required).length;
  const stepCount = policies.filter(p => p.step_therapy_required).length;

  const stats = [
    `${policies.length} ${policies.length === 1 ? 'Policy' : 'Policies'}`,
    `${payers.length} ${payers.length === 1 ? 'Payer' : 'Payers'}`,
    `${coveredCount} Covered`,
    `${paCount} PA Required`,
    `${stepCount} Step Therapy`,
  ];

  const statSpacing = contentW / stats.length;
  stats.forEach((stat, i) => {
    doc.text(stat, margin + statSpacing * i + statSpacing / 2, y + 4, { align: 'center' });
  });

  // ── AI Summary bubble ──────────────────────────────────────

  y += 24;
  const bubblePadding = 10;
  const bubbleTextWidth = contentW - bubblePadding * 2 - 4;

  // Wrap summary text
  doc.setFont('Lato', 'normal');
  doc.setFontSize(9.5);
  const wrappedSummary = doc.splitTextToSize(aiSummary, bubbleTextWidth);
  const summaryHeight = wrappedSummary.length * 4.5;
  const bubbleH = summaryHeight + 26;

  // Bubble background
  doc.setFillColor(...BLUE_BG);
  doc.setDrawColor(196, 212, 248); // #C4D4F8
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, bubbleH, 4, 4, 'FD');

  // AI badge
  doc.setFillColor(...BLUE);
  doc.roundedRect(margin + bubblePadding, y + 7, 52, 7, 2, 2, 'F');
  doc.setFont('Lato', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('AI EXTRACTION SUMMARY', margin + bubblePadding + 3, y + 12);

  // Summary text
  doc.setFont('Lato', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...NAVY);
  doc.text(wrappedSummary, margin + bubblePadding + 2, y + 22);

  y += bubbleH + 10;

  // ── Payer overview table ────────────────────────────────────

  doc.setFont('Lato', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...NAVY);
  doc.text('Payer Coverage Overview', margin, y);
  y += 6;

  const overviewRows = policies.map(p => {
    const paLabel = p.prior_auth_required ? 'Yes' : 'No';
    const stLabel = p.step_therapy_required ? 'Yes' : 'No';
    const indicationList = Array.isArray(p.indications)
      ? p.indications.map(i => typeof i === 'string' ? i : i.diagnosis).join(', ')
      : '';
    return [
      p.payer_name,
      statusLabel(p.coverage_status),
      paLabel,
      stLabel,
      indicationList || '—',
      p.effective_date,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Payer', 'Status', 'PA Req', 'Step Therapy', 'Indications', 'Effective']],
    body: overviewRows,
    styles: {
      font: 'Lato',
      fontSize: 8.5,
      cellPadding: 3,
      lineColor: [...BORDER] as [number, number, number],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [...NAVY] as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [...LIGHT] as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 22 },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 22 },
    },
    didParseCell: (data) => {
      // Color the status column
      if (data.section === 'body' && data.column.index === 1) {
        const val = String(data.cell.raw);
        if (val === 'COVERED') data.cell.styles.textColor = [...GREEN] as [number, number, number];
        else if (val === 'NOT COVERED') data.cell.styles.textColor = [...RED] as [number, number, number];
        else if (val === 'NO POLICY') data.cell.styles.textColor = [...GRAY] as [number, number, number];
        else if (val === 'PHARMACY ONLY') data.cell.styles.textColor = [...ORANGE] as [number, number, number];
        else data.cell.styles.textColor = [...GRAY] as [number, number, number];
      }
    },
  });

  // ── Per-payer detail pages ──────────────────────────────────

  for (const policy of policies) {
    doc.addPage();

    // Top accent bar
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, pageW, 3, 'F');

    let py = 16;

    // Header
    doc.setFont('Lato', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...NAVY);
    doc.text(`${drugName} — ${policy.payer_name}`, margin, py);

    py += 7;
    doc.setFont('Lato', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(
      `Version ${policy.policy_version || '—'} · Effective ${policy.effective_date} · ${statusLabel(policy.coverage_status)}`,
      margin, py,
    );

    // Status color indicator
    const sc = statusColor(policy.coverage_status);
    const shortStatus = statusLabel(policy.coverage_status);
    const badgeW = Math.max(25, doc.getTextWidth(shortStatus) * 1.8 + 8);
    doc.setFillColor(...sc);
    doc.roundedRect(pageW - margin - badgeW, py - 5, badgeW, 7, 2, 2, 'F');
    doc.setFont('Lato', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(shortStatus, pageW - margin - badgeW / 2, py - 1, { align: 'center' });

    py += 10;
    doc.setDrawColor(...BORDER);
    doc.line(margin, py, pageW - margin, py);
    py += 8;

    // Detail sections
    const sections: [string, string[][]][] = [];

    // Coverage
    sections.push(['Coverage Details', [
      ['Coverage Status', statusLabel(policy.coverage_status)],
      ['Policy Type', policy.policy_type?.replace(/_/g, ' ') ?? '—'],
      ['Plan Types', policy.plan_types?.join(', ') ?? '—'],
      ['Formulary Tier', policy.formulary_tier?.replace(/_/g, ' ') ?? '—'],
      ['Drug Category', policy.drug_category || '—'],
    ]]);

    // Prior auth
    if (policy.prior_auth_required && policy.prior_auth) {
      const pa = policy.prior_auth;
      const paRows: string[][] = [
        ['Required', 'Yes'],
        ['Frequency', pa.pa_frequency?.replace(/_/g, ' ') ?? '—'],
        ['Prescriber Requirements', pa.prescriber_requirements ?? '—'],
        ['Performance Status', pa.performance_status ?? '—'],
        ['Prior Treatment Failure', pa.prior_treatment_failure ?? '—'],
        ['Renewal Criteria', pa.renewal_criteria ?? '—'],
      ];
      if (pa.biomarker_testing?.length) {
        paRows.push(['Biomarker Testing', pa.biomarker_testing.join(', ')]);
      }
      if (pa.lab_requirements?.length) {
        paRows.push(['Lab Requirements', pa.lab_requirements.join(', ')]);
      }
      sections.push(['Prior Authorization', paRows]);
    }

    // Step therapy
    if (policy.step_therapy_required && policy.step_therapy) {
      const st = policy.step_therapy;
      const stRows: string[][] = st.steps?.map((s, i) => [
        `Step ${i + 1}`,
        `${s.drug_name} (${s.drug_type?.replace(/_/g, ' ')})${s.min_trial_duration ? ` — min ${s.min_trial_duration}` : ''}`,
      ]) ?? [];
      if (st.bypass_conditions) {
        stRows.push(['Bypass', st.bypass_conditions]);
      }
      sections.push(['Step Therapy', stRows]);
    }

    // Indications
    if (Array.isArray(policy.indications) && policy.indications.length > 0) {
      const indRows: string[][] = policy.indications.map(ind => {
        if (typeof ind === 'string') return [ind, ''];
        const details: string[] = [];
        if (ind.stage_severity) details.push(ind.stage_severity);
        if (ind.line_of_therapy) details.push(ind.line_of_therapy);
        if (ind.biomarker_requirements?.length) details.push(ind.biomarker_requirements.join(', '));
        if (ind.combination_therapy) details.push(`combo: ${ind.combination_therapy}`);
        return [ind.diagnosis, details.join(' · ') || '—'];
      });
      sections.push(['Covered Indications', indRows]);
    }

    // Site of care
    if (policy.site_of_care) {
      const soc = policy.site_of_care;
      const socRows: string[][] = [];
      if (soc.allowed_sites?.length) socRows.push(['Allowed', soc.allowed_sites.map(s => s.replace(/_/g, ' ')).join(', ')]);
      if (soc.restricted_sites?.length) socRows.push(['Restricted', soc.restricted_sites.map(s => s.replace(/_/g, ' ')).join(', ')]);
      if (soc.preferred_site) socRows.push(['Preferred', soc.preferred_site.replace(/_/g, ' ')]);
      socRows.push(['SOS Program', soc.site_of_care_program ? 'Yes' : 'No']);
      sections.push(['Site of Care', socRows]);
    }

    // Dosing
    if (policy.dosing) {
      const d = policy.dosing;
      const doseRows: string[][] = [];
      if (d.dose_amount) doseRows.push(['Dose', d.dose_amount]);
      if (d.dose_calculation) doseRows.push(['Calculation', d.dose_calculation.replace(/_/g, ' ')]);
      if (d.frequency) doseRows.push(['Frequency', d.frequency]);
      if (d.max_quantity) doseRows.push(['Max Quantity', d.max_quantity]);
      if (d.max_treatment_duration) doseRows.push(['Max Duration', d.max_treatment_duration]);
      if (d.max_cycles) doseRows.push(['Max Cycles', String(d.max_cycles)]);
      if (doseRows.length) sections.push(['Dosing & Quantity', doseRows]);
    }

    // Render sections as tables
    for (const [title, rows] of sections) {
      if (rows.length === 0) continue;

      // Check if we need a new page (leave 40mm buffer)
      if (py > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        doc.setFillColor(...BLUE);
        doc.rect(0, 0, pageW, 3, 'F');
        py = 16;
      }

      doc.setFont('Lato', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(title, margin, py);
      py += 4;

      autoTable(doc, {
        startY: py,
        margin: { left: margin, right: margin },
        body: rows,
        showHead: false,
        styles: {
          font: 'Lato',
          fontSize: 8.5,
          cellPadding: 2.5,
          lineColor: [...BORDER] as [number, number, number],
          lineWidth: 0.2,
          textColor: [...NAVY] as [number, number, number],
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 42, textColor: [...GRAY] as [number, number, number] },
        },
        alternateRowStyles: {
          fillColor: [...LIGHT] as [number, number, number],
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      py = (doc as any).lastAutoTable.finalY + 8;
    }

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...BORDER);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFont('Lato', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text('Generated by Anton Cx · Policy Intelligence Platform', margin, pageH - 8);
    doc.text(`${drugName} · ${policy.payer_name}`, pageW - margin, pageH - 8, { align: 'right' });
  }

  // Add footer to page 1
  doc.setPage(1);
  const pageH = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...BORDER);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFont('Lato', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text('Generated by Anton Cx · Policy Intelligence Platform', margin, pageH - 8);
  doc.text(now, pageW - margin, pageH - 8, { align: 'right' });

  // Return as Buffer
  return Buffer.from(doc.output('arraybuffer'));
}
