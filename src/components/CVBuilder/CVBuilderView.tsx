import React, { useState } from 'react';
import {
  FileCheck,
  Printer,
  Download,
  Trash2,
  Lightbulb,
  Import,
  Eye,
  Edit2,
  RotateCcw,
  X,
} from 'lucide-react';
import { SingaporeCV, CompanyHistoryItem, Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { exportCvPDF } from '../../services/pdfExportService';
import { PREFILLED_CV } from '../../services/storageService';

interface CVBuilderViewProps {
  language: Language;
  cv: SingaporeCV;
  onUpdateCV: (cv: SingaporeCV) => void;
  companyHistory: CompanyHistoryItem[];
}

export const CVBuilderView: React.FC<CVBuilderViewProps> = ({
  language,
  cv,
  onUpdateCV,
  companyHistory,
}) => {
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [cvNotice, setCvNotice] = useState<string | null>(null);

  // New item states
  const [newSkill, setNewSkill] = useState('');
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertYear, setNewCertYear] = useState('');

  // Import from Work History
  const handleImportHistory = () => {
    if (!companyHistory || companyHistory.length === 0) {
      setCvNotice('No employment records found in Work History yet. Add records there or edit jobs below.');
      return;
    }

    const imported = companyHistory.map((item) => ({
      id: `we-${item.id}`,
      company: item.companyName,
      role: item.jobTitle,
      duration: `${item.startDate} - ${item.isCurrent ? 'Present' : item.endDate || ''}`,
      responsibilities: item.responsibilities,
    }));

    onUpdateCV({
      ...cv,
      workExperience: imported,
    });
    setCvNotice(`Imported ${imported.length} employment record(s) from Work History.`);
  };

  const handlePrefillTemplate = () => {
    onUpdateCV({ ...PREFILLED_CV });
    setCvNotice('Starter Singapore worker CV template loaded. Edit any details to match your profile.');
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    onUpdateCV({
      ...cv,
      skills: [...cv.skills, newSkill.trim()],
    });
    setNewSkill('');
  };

  const handleRemoveSkill = (idx: number) => {
    onUpdateCV({
      ...cv,
      skills: cv.skills.filter((_, i) => i !== idx),
    });
  };

  const handleAddCert = () => {
    if (!newCertName.trim()) return;
    onUpdateCV({
      ...cv,
      certificates: [
        ...cv.certificates,
        {
          id: `ce-${Date.now()}`,
          name: newCertName.trim(),
          issuer: newCertIssuer.trim() || 'Accredited Provider',
          year: newCertYear.trim() || '2024',
        },
      ],
    });
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertYear('');
  };

  const handleRemoveCert = (id: string) => {
    onUpdateCV({
      ...cv,
      certificates: cv.certificates.filter((c) => c.id !== id),
    });
  };

  const handlePrintCV = () => {
    setActiveTab('preview');
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header & Controls */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-amber-500 shrink-0" />
            {t.cvTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.cvSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          <button
            onClick={() => exportCvPDF(cv)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>{t.downloadPdf}</span>
          </button>

          <button
            onClick={handlePrintCV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.printCV}</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {cvNotice && (
        <div className="no-print p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>{cvNotice}</span>
          <button
            onClick={() => setCvNotice(null)}
            className="p-1 text-amber-700 dark:text-amber-300 shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bengali Guidance Card */}
      <div className="no-print p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">{t.bengaliGuidanceTitle}:</span>
            {t.bengaliGuidanceBody}
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrefillTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0 self-start sm:self-center hover:bg-amber-50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Prefill Sample CV</span>
        </button>
      </div>

      {activeTab === 'editor' ? (
        /* CV Editor Form */
        <div className="no-print space-y-4">
          {/* Section 1: Personal Details */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              1. {t.personalDetails}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.fullName} *
                </label>
                <input
                  type="text"
                  value={cv.fullName}
                  onChange={(e) => onUpdateCV({ ...cv, fullName: e.target.value })}
                  placeholder="e.g. Mohammad Rahim Uddin"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.contactNumber} *
                </label>
                <input
                  type="text"
                  value={cv.contactNumber}
                  onChange={(e) => onUpdateCV({ ...cv, contactNumber: e.target.value })}
                  placeholder="+65 8123 4567"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.residentialArea}
                </label>
                <input
                  type="text"
                  value={cv.residentialArea}
                  onChange={(e) => onUpdateCV({ ...cv, residentialArea: e.target.value })}
                  placeholder="e.g. Tuas South / Jurong East"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.nationality}
                </label>
                <input
                  type="text"
                  value={cv.nationality}
                  onChange={(e) => onUpdateCV({ ...cv, nationality: e.target.value })}
                  placeholder="Bangladeshi"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.passType}
                </label>
                <select
                  value={cv.passType}
                  onChange={(e) => onUpdateCV({ ...cv, passType: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Work Permit">Work Permit</option>
                  <option value="S Pass">S Pass</option>
                  <option value="Employment Pass">Employment Pass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.yearsInSG}
                </label>
                <input
                  type="number"
                  min="0"
                  value={cv.yearsInSingapore}
                  onChange={(e) =>
                    onUpdateCV({ ...cv, yearsInSingapore: Number(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.professionalSummary}
              </label>
              <textarea
                rows={3}
                value={cv.professionalSummary}
                onChange={(e) => onUpdateCV({ ...cv, professionalSummary: e.target.value })}
                placeholder="Brief summary of your trade, years of experience, and safety commitment..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Section 2: Work Experience with Import History */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                2. Singapore Work Experience
              </h2>
              <button
                type="button"
                onClick={handleImportHistory}
                className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                <Import className="w-3.5 h-3.5" />
                <span>{t.importFromHistory}</span>
              </button>
            </div>

            <div className="space-y-3">
              {cv.workExperience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Job #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateCV({
                          ...cv,
                          workExperience: cv.workExperience.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={exp.company}
                      onChange={(e) => {
                        const copy = [...cv.workExperience];
                        copy[idx] = { ...copy[idx], company: e.target.value };
                        onUpdateCV({ ...cv, workExperience: copy });
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Welder)"
                      value={exp.role}
                      onChange={(e) => {
                        const copy = [...cv.workExperience];
                        copy[idx] = { ...copy[idx], role: e.target.value };
                        onUpdateCV({ ...cv, workExperience: copy });
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 2023 - Present)"
                      value={exp.duration}
                      onChange={(e) => {
                        const copy = [...cv.workExperience];
                        copy[idx] = { ...copy[idx], duration: e.target.value };
                        onUpdateCV({ ...cv, workExperience: copy });
                      }}
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    />
                  </div>

                  <textarea
                    rows={2}
                    placeholder="Key duties and achievements..."
                    value={exp.responsibilities}
                    onChange={(e) => {
                      const copy = [...cv.workExperience];
                      copy[idx] = { ...copy[idx], responsibilities: e.target.value };
                      onUpdateCV({ ...cv, workExperience: copy });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  onUpdateCV({
                    ...cv,
                    workExperience: [
                      ...cv.workExperience,
                      {
                        id: `we-${Date.now()}`,
                        company: '',
                        role: '',
                        duration: '2024 - Present',
                        responsibilities: '',
                      },
                    ],
                  });
                }}
                className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                + Add Another Experience
              </button>
            </div>
          </div>

          {/* Section 3: Technical Skills & Driving Licence */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Technical Skills & Driving Licences
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Technical Trade Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {cv.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(idx)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="e.g. Scaffolding, 3G Welding, Pipe Fitting"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 shrink-0"
                >
                  Add Skill
                </button>
              </div>
            </div>

            {/* Driving Licence */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.drivingLicence}
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cv.drivingLicence.hasLicence}
                    onChange={(e) => {
                      onUpdateCV({
                        ...cv,
                        drivingLicence: {
                          ...cv.drivingLicence,
                          hasLicence: e.target.checked,
                        },
                      });
                    }}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span className="text-xs font-semibold">Holds valid licence</span>
                </label>

                {cv.drivingLicence.hasLicence && (
                  <input
                    type="text"
                    placeholder="e.g. Singapore Class 3 / Class 4 / Forklift"
                    value={cv.drivingLicence.licenceClass}
                    onChange={(e) => {
                      onUpdateCV({
                        ...cv,
                        drivingLicence: {
                          ...cv.drivingLicence,
                          licenceClass: e.target.value,
                        },
                      });
                    }}
                    className="w-full max-w-xs px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                )}
              </div>
            </div>

            {/* Safety Certificates */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Safety & MOM Certificates (BCSS, CSOC, WAH, Rigger, Lifting)
              </label>
              <div className="space-y-1.5 mb-2">
                {cv.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center justify-between gap-2 text-xs p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white">{cert.name}</span>
                      <span className="text-slate-500 ml-2">
                        ({cert.issuer}, {cert.year})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCert(cert.id)}
                      className="text-slate-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Certificate Name (e.g. BCSS)"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  placeholder="Issuer (e.g. SCAL / BCA)"
                  value={newCertIssuer}
                  onChange={(e) => setNewCertIssuer(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  placeholder="Year (e.g. 2024)"
                  value={newCertYear}
                  onChange={(e) => setNewCertYear(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="button"
                  onClick={handleAddCert}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-slate-950"
                >
                  Add Cert
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Live CV Preview (Paper representation) */
        <div className="bg-white text-slate-900 p-5 sm:p-10 rounded-3xl border border-slate-300 shadow-xl max-w-3xl mx-auto space-y-5">
          <div className="border-b-2 border-slate-900 pb-4">
            <h2 className="text-xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950 break-words">
              {cv.fullName || 'Your Name'}
            </h2>
            <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap font-medium">
              <span>{cv.passType} Holder</span>
              <span>·</span>
              <span>{cv.yearsInSingapore} Years in Singapore</span>
              <span>·</span>
              <span>{cv.nationality}</span>
            </div>
            <div className="text-xs text-slate-700 mt-1 flex items-center gap-x-4 gap-y-1 flex-wrap">
              <span>
                <strong>Phone/WhatsApp:</strong> {cv.contactNumber}
              </span>
              <span>
                <strong>Location:</strong> {cv.residentialArea}
              </span>
              {cv.email && (
                <span>
                  <strong>Email:</strong> {cv.email}
                </span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 rounded-lg mb-2">
              Professional Summary
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">{cv.professionalSummary}</p>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 rounded-lg mb-2">
              Core Skills & Certifications
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                <strong>Key Technical Skills:</strong> {cv.skills.join(', ')}
              </div>
              {cv.drivingLicence.hasLicence && (
                <div>
                  <strong>Driving Licence:</strong> {cv.drivingLicence.licenceClass}
                </div>
              )}
              {cv.certificates.length > 0 && (
                <div>
                  <strong>Safety Certifications:</strong>{' '}
                  {cv.certificates
                    .map((c) => `${c.name} (${c.issuer}, ${c.year})`)
                    .join('; ')}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 rounded-lg mb-2">
              Singapore Employment Experience
            </h3>
            <div className="space-y-4">
              {cv.workExperience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-slate-900">
                    <span>
                      {exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span>
                    </span>
                    <span className="text-slate-500 font-normal">{exp.duration}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {exp.responsibilities}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 bg-slate-100 p-1.5 rounded-lg mb-2">
              Languages & Education
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                <strong>Languages:</strong>{' '}
                {cv.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}
              </div>
              <div>
                <strong>Education:</strong>{' '}
                {cv.education
                  .map((e) => `${e.qualification} - ${e.institution} (${e.year})`)
                  .join('; ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
