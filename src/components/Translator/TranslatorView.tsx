import React, { useState, useMemo } from 'react';
import { 
  Languages, 
  Search, 
  Copy, 
  Check, 
  ArrowRightLeft, 
  Volume2, 
  BookOpen, 
  Sparkles,
  Info
} from 'lucide-react';
import { WORKPLACE_PHRASES, PhraseItem } from '../../services/translatorPhrases';
import { Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface TranslatorViewProps {
  language: Language;
}

export const TranslatorView: React.FC<TranslatorViewProps> = ({ language }) => {
  const t = getTranslation(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick custom translation box
  const [direction, setDirection] = useState<'en-to-bn' | 'bn-to-en'>('bn-to-en');
  const [inputText, setInputText] = useState('');
  const [quickTranslation, setQuickTranslation] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTextTranslate = () => {
    if (!inputText.trim()) return;
    // Client-side exact or keyword matching from dictionary
    const found = WORKPLACE_PHRASES.find((p) => {
      const q = inputText.toLowerCase().trim();
      return p.en.toLowerCase().includes(q) || p.bn.includes(q) || p.pronounce.includes(q);
    });

    if (found) {
      setQuickTranslation(direction === 'en-to-bn' ? `${found.bn} (${found.pronounce})` : found.en);
    } else {
      setQuickTranslation(
        direction === 'en-to-bn' 
          ? `[Dictionary match]: "${inputText}" — (Prepared for Google Translate / Gemini API integration)`
          : `[Dictionary match]: "${inputText}" — (Prepared for Google Translate / Gemini API integration)`
      );
    }
  };

  const filteredPhrases = useMemo(() => {
    return WORKPLACE_PHRASES.filter((p) => {
      const matchesCat = selectedCat === 'all' || p.category === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        p.en.toLowerCase().includes(q) ||
        p.bn.includes(q) ||
        p.pronounce.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCat]);

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Languages className="w-6 h-6 text-amber-500" />
          {t.translatorTitle}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.translatorSubtitle}
        </p>
      </div>

      {/* Notice on Real API separation */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
            Offline Verified Workplace Dictionary:
          </span>
          Includes standard Singapore construction, safety, medical, and MOM phrases with Bengali phonetic pronunciation for zero-barrier worksite communication. Ready to connect external Translation APIs.
        </div>
      </div>

      {/* Quick Lookup & Translate Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{t.customTranslation}</span>
          </div>

          <button
            onClick={() => {
              setDirection(direction === 'en-to-bn' ? 'bn-to-en' : 'en-to-bn');
              setInputText('');
              setQuickTranslation(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
          >
            <span>{direction === 'en-to-bn' ? 'English → Bengali' : 'Bengali (বাংলা) → English'}</span>
            <ArrowRightLeft className="w-3 h-3 text-amber-500" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={direction === 'en-to-bn' ? 'Type English phrase (e.g. Safety harness)...' : 'বাংলায় লিখুন (যেমন: সেফটি বেল্ট)...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTextTranslate()}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
          <button
            onClick={handleTextTranslate}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-sm"
          >
            Translate
          </button>
        </div>

        {quickTranslation && (
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900 dark:text-white">
              {quickTranslation}
            </span>
            <button
              onClick={() => handleCopy('quick', quickTranslation)}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              title="Copy"
            >
              {copiedId === 'quick' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Phrasebook Filters & Search */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.searchPhrase}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: t.categoryAll },
            { id: 'safety', label: t.categorySafety },
            { id: 'work', label: t.categoryWork },
            { id: 'medical', label: t.categoryMedical },
            { id: 'salary', label: t.categorySalary },
            { id: 'dorm', label: t.categoryDorm },
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

      {/* Categorized Phrases List */}
      <div className="space-y-3">
        {filteredPhrases.map((phrase) => (
          <div
            key={phrase.id}
            className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
          >
            <div className="space-y-1">
              {/* English */}
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {phrase.en}
              </div>

              {/* Bengali Meaning */}
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {phrase.bn}
              </div>

              {/* Bengali Phonetic Pronunciation Guide */}
              <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5 mt-1">
                <Volume2 className="w-3.5 h-3.5 shrink-0" />
                <span>উচ্চারণ: {phrase.pronounce}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => handleCopy(phrase.id, phrase.en)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={t.copyPhrase}
              >
                {copiedId === phrase.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy EN</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
