import { jsPDF } from 'jspdf';
import { MonthlySummary, SingaporeCV, WorkShift } from '../types';

/**
 * Exports a monthly work time card as a clean, printable PDF document.
 */
export function exportTimeCardPDF(
  summary: MonthlySummary,
  companyName: string = 'Not Specified',
  workerName: string = 'Worker'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[summary.month - 1]} ${summary.year}`;

  // Header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('WORKERHUB — SINGAPORE WORK TIME CARD', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Monthly Work Record · ${monthLabel}`, 14, 20);

  // Worker & Company info
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Worker Name:', 14, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(workerName, 42, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('Company:', 14, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(companyName, 42, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Summary Month:', 120, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(monthLabel, 158, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Normal Hrs:', 120, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${summary.totalNormalHours.toFixed(1)} hrs`, 158, 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Total OT Hours:', 120, 48);
  doc.setFont('helvetica', 'normal');
  doc.text(`${summary.totalOtHours.toFixed(1)} hrs`, 158, 48);

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, 52, 196, 52);

  // Table header
  let y = 58;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y - 4, 182, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Date', 16, y + 1);
  doc.text('Worksite', 40, y + 1);
  doc.text('Hours (Start - End)', 95, y + 1);
  doc.text('Break', 135, y + 1);
  doc.text('Normal', 152, y + 1);
  doc.text('OT', 168, y + 1);
  doc.text('Total', 182, y + 1);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  summary.shifts.forEach((s: WorkShift) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setTextColor(15, 23, 42);
    doc.text(s.date, 16, y);
    doc.text(s.worksiteName ? s.worksiteName.substring(0, 24) : 'General Site', 40, y);
    doc.text(`${s.startTime} - ${s.endTime}`, 95, y);
    doc.text(`${s.breakDurationMinutes}m`, 135, y);
    doc.text(`${s.normalHours}h`, 152, y);
    doc.text(`${s.otHours}h`, 168, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${s.totalWorkingHours}h`, 182, y);
    doc.setFont('helvetica', 'normal');

    y += 5.5;
  });

  // Signature Block
  if (y > 240) {
    doc.addPage();
    y = 30;
  } else {
    y += 10;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(14, y + 15, 80, y + 15);
  doc.line(120, y + 15, 186, y + 15);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Worker Signature / Date', 14, y + 20);
  doc.text('Site Supervisor / Company Stamp', 120, y + 20);

  // Footer disclaimer
  doc.setFontSize(7);
  doc.text('Generated via WorkerHub Singapore. Records maintained for MOM reference and personal salary verification.', 14, 285);

  doc.save(`TimeCard_${monthLabel.replace(/\s+/g, '_')}_${workerName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Exports a Singapore CV as a PDF document.
 */
export function exportCvPDF(cv: SingaporeCV) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Top header banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const safeName = (cv.fullName || 'Worker').trim();
  doc.text(safeName.toUpperCase(), 14, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${cv.passType} Holder · ${cv.yearsInSingapore} Years Experience in Singapore · ${cv.nationality}`, 14, 22);
  doc.text(`Phone/WhatsApp: ${cv.contactNumber}  |  Location: ${cv.residentialArea}`, 14, 28);

  let y = 42;

  // Professional Summary
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFESSIONAL SUMMARY', 16, y + 4.5);

  y += 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const summaryLines = doc.splitTextToSize(cv.professionalSummary, 182);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 4.5 + 4;

  // Technical Skills
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CORE TECHNICAL SKILLS & CERTIFICATIONS', 16, y + 4.5);

  y += 10;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Key Skills: ${cv.skills.join(', ')}`, 14, y);
  y += 5;
  if (cv.drivingLicence.hasLicence) {
    doc.text(`Driving Licence: ${cv.drivingLicence.licenceClass}`, 14, y);
    y += 5;
  }
  const certStr = cv.certificates.map((c) => `${c.name} (${c.issuer}, ${c.year})`).join('; ');
  if (certStr) {
    const certLines = doc.splitTextToSize(`Safety Certifications: ${certStr}`, 182);
    doc.text(certLines, 14, y);
    y += certLines.length * 4.5;
  }

  y += 4;

  // Work Experience
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('SINGAPORE EMPLOYMENT EXPERIENCE', 16, y + 4.5);

  y += 9;

  cv.workExperience.forEach((exp) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${exp.role} — ${exp.company}`, 14, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(exp.duration, 160, y);

    y += 4.5;
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const respLines = doc.splitTextToSize(exp.responsibilities, 182);
    doc.text(respLines, 14, y);
    y += respLines.length * 4.5 + 3;
  });

  // Languages & Education
  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 2;
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('LANGUAGES & EDUCATION', 16, y + 4.5);

  y += 9;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const langStr = cv.languages.map((l) => `${l.name} (${l.level})`).join(' · ');
  doc.text(`Languages: ${langStr}`, 14, y);
  y += 5;

  const eduStr = cv.education.map((e) => `${e.qualification} - ${e.institution} (${e.year})`).join('; ');
  if (eduStr) {
    const eduLines = doc.splitTextToSize(`Education: ${eduStr}`, 182);
    doc.text(eduLines, 14, y);
  }

  doc.save(`Singapore_CV_${(cv.fullName || 'Worker').trim().replace(/\s+/g, '_')}.pdf`);
}

/**
 * Exports work shifts into a standard CSV file for spreadsheet import.
 */
export function exportShiftsToCSV(shifts: WorkShift[], month: number, year: number) {
  const headers = [
    'Date',
    'Company',
    'Worksite',
    'Start Time',
    'End Time',
    'Break (mins)',
    'Normal Hours',
    'OT Hours',
    'Total Working Hours',
    'Work Status',
    'Notes',
  ];

  const rows = shifts.map((s) => [
    `"${s.date}"`,
    `"${(s.companyName || '').replace(/"/g, '""')}"`,
    `"${(s.worksiteName || '').replace(/"/g, '""')}"`,
    `"${s.startTime}"`,
    `"${s.endTime}"`,
    s.breakDurationMinutes,
    s.normalHours,
    s.otHours,
    s.totalWorkingHours,
    `"${s.workStatus}"`,
    `"${(s.dailyNotes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `WorkerHub_TimeCard_${year}_${String(month).padStart(2, '0')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
