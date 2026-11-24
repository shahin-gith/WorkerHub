import React, { useState } from 'react';
import { 
  PhoneCall, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldAlert, 
  Building2, 
  MapPin, 
  Clock, 
  LifeBuoy, 
  AlertOctagon,
  Search
} from 'lucide-react';
import { VERIFIED_RESOURCES, HelpResource } from '../../services/verifiedResources';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface WorkerHelpViewProps {
  language: Language;
}

export const WorkerHelpView: React.FC<WorkerHelpViewProps> = ({ language }) => {
  const t = getTranslation(language);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredResources = VERIFIED_RESOURCES.filter((res) => {
    const matchesCat = selectedCat === 'all' || res.category === selectedCat;
    const matchesSearch = 
      res.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.titleBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.descEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.descBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.phoneDisplay.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-amber-500" />
          {t.helpTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.helpSubtitle}
        </p>
      </div>

      {/* Official Government Independent Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Community Independence Notice:</span>
          {t.officialDisclaimer}
        </div>
      </div>

      {/* Emergency Immediate Action Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-red-600 text-white p-4 rounded-3xl flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-1.5 text-red-100 text-[11px] font-bold uppercase tracking-wider">
              <AlertOctagon className="w-4 h-4" />
              <span>Medical & Fire Emergency</span>
            </div>
            <div className="text-2xl font-black mt-1">SCDF 995</div>
            <div className="text-xs text-red-100 mt-0.5">
              Worksite injuries, falls, life threats (24/7 Free)
            </div>
          </div>
          <a
            href="tel:995"
            className="px-4 py-2 rounded-2xl bg-white text-red-700 font-extrabold text-xs shrink-0 shadow hover:bg-red-50 transition-colors"
          >
            {t.callNow}
          </a>
        </div>

        <div className="bg-blue-600 text-white p-4 rounded-3xl flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-1.5 text-blue-100 text-[11px] font-bold uppercase tracking-wider">
              <PhoneCall className="w-4 h-4" />
              <span>Police Emergency</span>
            </div>
            <div className="text-2xl font-black mt-1">Police 999</div>
            <div className="text-xs text-blue-100 mt-0.5">
              Immediate danger, assaults, crimes (24/7 Free)
            </div>
          </div>
          <a
            href="tel:999"
            className="px-4 py-2 rounded-2xl bg-white text-blue-700 font-extrabold text-xs shrink-0 shadow hover:bg-blue-50 transition-colors"
          >
            {t.callNow}
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search helpline or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Services' },
            { id: 'mom', label: 'MOM Ministry' },
            { id: 'embassy', label: 'Bangladesh Embassy' },
            { id: 'ngo', label: 'MWC / TWC2 / HOME' },
            { id: 'medical', label: 'Health Clinics' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedCat === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Resource Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredResources.map((res) => (
          <div
            key={res.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {language === 'bn' ? res.titleBn : res.titleEn}
                  </h3>
                  {language === 'bn' && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      {res.titleEn}
                    </div>
                  )}
                </div>

                {res.is24Hours && (
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded shrink-0">
                    24/7 Helpline
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                {language === 'bn' ? res.descBn : res.descEn}
              </p>

              {res.address && (
                <div className="flex items-start gap-1.5 text-[11px] text-slate-500 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{res.address}</span>
                </div>
              )}
            </div>

            {/* Contact Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                  {res.phoneDisplay}
                </span>
                <button
                  onClick={() => handleCopy(res.id, res.phone)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  title={t.copyNumber}
                >
                  {copiedId === res.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {res.website && (
                  <a
                    href={res.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Visit Official Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <a
                  href={`tel:${res.phone}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{t.callNow}</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
