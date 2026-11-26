import { jsPDF } from 'jspdf';
import { SingaporeCV } from '../types';

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
  doc.setFillColor(15, 23, 42);
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
