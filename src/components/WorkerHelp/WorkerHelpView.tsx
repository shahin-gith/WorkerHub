import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  MapPin,
  LifeBuoy,
  AlertOctagon,
  Search,
  BookOpen,
  Plus,
  ThumbsUp,
  Trash2,
  X,
  Loader2,
  Globe,
  AlertCircle,
} from 'lucide-react';
import { VERIFIED_RESOURCES } from '../../services/verifiedResources';
import { HelpArticle, HelpSearchResult, Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { apiClient } from '../../services/apiClient';
import { copyToClipboard } from '../../utils/clipboard';

interface WorkerHelpViewProps {
  language: Language;
  articles: HelpArticle[];
  deviceUserId?: string | null;
  onPostArticle: (article: {
    title: string;
    category: HelpArticle['category'];
    summary: string;
    content: string;
    language: Language;
    sourceUrl?: string;
  }) => Promise<void>;
  onLikeArticle: (id: string) => Promise<void>;
  onDeleteArticle: (id: string) => Promise<void>;
}

const STARTER_ARTICLES: HelpArticle[] = [
  {
    id: 'guide-salary-ot',
    title: 'Singapore Salary, Payslip & Overtime Rights (Work Permit)',
    category: 'salary',
    summary:
      'Every worker covered by the Employment Act must receive itemised payslips and salary within 7 days after the salary period.',
    content:
      'Keep daily records of your start time, end time, breaks, and rest days. Your employer must issue itemised payslips showing basic salary, allowances, overtime pay, and deductions. If salary is delayed or unpaid, call TADM / MOM (6438 5122) or MWC early.',
    language: 'en',
    authorLabel: 'WorkerHub Guide',
    sourceUrl: 'https://www.mom.gov.sg/employment-practices/salary',
    likesCount: 0,
    createdAt: 1700000000000,
  },
  {
    id: 'guide-wica-injury',
    title: 'What to Do After a Worksite Injury (WICA & Medical Leave)',
    category: 'safety',
    summary:
      'Report workplace accidents immediately to your supervisor, seek medical care, and never sign papers you do not understand.',
    content:
      'Under Singapore WICA rules, work-related injuries are eligible for medical leave wages and medical expense coverage by the employer insurer. Always request a copy of your MC and hospital discharge summary, and keep photos/messages in your Document Vault.',
    language: 'en',
    authorLabel: 'WorkerHub Guide',
    sourceUrl: 'https://www.mom.gov.sg/workplace-safety-and-health/work-injury-compensation',
    likesCount: 0,
    createdAt: 1700000000001,
  },
  {
    id: 'guide-bangla-rights',
    title: 'বেতন, ওভারটাইম ও ছুটির নিয়ম — প্রবাসী কর্মীদের জরুরি গাইড',
    category: 'salary',
    summary:
      'মাস শেষ হওয়ার ৭ দিনের মধ্যে বেতন এবং প্রতি মাসে আইটেমাইজড পে-স্লিপ পাওয়া আপনার অধিকার।',
    content:
      'প্রতিদিনের কাজের সময়, ব্রেক এবং ওভারটাইম নিয়মিত টাইম কার্ডে লিখে রাখুন। পে-স্লিপ ও ওয়ার্ক পারমিটের ছবি ডকুমেন্ট ভল্টে সংরক্ষণ করুন। বেতন বকেয়া হলে বা পাসপোর্ট আটকে রাখলে MOM (6438 5122) অথবা MWC হেল্পলাইনে যোগাযোগ করুন।',
    language: 'bn',
    authorLabel: 'WorkerHub গাইড',
    sourceUrl: 'https://www.mom.gov.sg/passes-and-permits/work-permit-for-foreign-worker',
    likesCount: 0,
    createdAt: 1700000000002,
  },
  {
    id: 'guide-remit-safe',
    title: 'Safe Remittance & Avoiding Scams in Singapore',
    category: 'remittance',
    summary:
      'Only send money through MAS-licensed remittance operators or official Singapore bank apps.',
    content:
      'Never transfer money through unverified social media agents promising unusually high BDT exchange rates. Always keep official remittance receipts and track every transfer inside your Finance Tracker.',
    language: 'en',
    authorLabel: 'WorkerHub Guide',
    sourceUrl: 'https://www.mas.gov.sg/',
    likesCount: 0,
    createdAt: 1700000000003,
  },
];

export const WorkerHelpView: React.FC<WorkerHelpViewProps> = ({
  language,
  articles,
  deviceUserId,
  onPostArticle,
  onLikeArticle,
  onDeleteArticle,
}) => {
  const t = getTranslation(language);

  const [sectionTab, setSectionTab] = useState<'all' | 'articles' | 'helplines'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Google Article Search state
  const [articleQuery, setArticleQuery] = useState('');
  const [searchingArticles, setSearchingArticles] = useState(false);
  const [articleSearchError, setArticleSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<HelpSearchResult | null>(null);

  // Post Article Modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postingArticle, setPostingArticle] = useState(false);
  const [articleNotice, setArticleNotice] = useState<string | null>(null);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState<{
    title: string;
    category: HelpArticle['category'];
    summary: string;
    content: string;
    sourceUrl: string;
  }>({
    title: '',
    category: 'general',
    summary: '',
    content: '',
    sourceUrl: '',
  });

  const handleCopy = async (id: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSearchMoreArticles = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = articleQuery.trim();
    if (q.length < 2) {
      setArticleSearchError('Enter a topic (e.g. Work Permit renewal, WICA medical leave, dormitory rights).');
      return;
    }
    setSearchingArticles(true);
    setArticleSearchError(null);
    try {
      const res = await apiClient.searchHelpArticles(q, language);
      setSearchResult(res);
    } catch (err: unknown) {
      setArticleSearchError((err as Error).message || 'Could not search articles right now.');
      setSearchResult(null);
    } finally {
      setSearchingArticles(false);
    }
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim()) return;

    setPostingArticle(true);
    try {
      await onPostArticle({
        title: postForm.title.trim(),
        category: postForm.category,
        summary:
          postForm.summary.trim() || postForm.content.trim().substring(0, 140),
        content: postForm.content.trim(),
        language,
        sourceUrl: postForm.sourceUrl.trim() || undefined,
      });
      setIsPostModalOpen(false);
      setPostForm({
        title: '',
        category: 'general',
        summary: '',
        content: '',
        sourceUrl: '',
      });
      setArticleNotice('Your article was posted to WorkerHub Help.');
    } catch (err: unknown) {
      setArticleNotice((err as Error).message || 'Failed to publish article.');
    } finally {
      setPostingArticle(false);
    }
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

  const allArticles = useMemo(() => {
    return [...articles, ...STARTER_ARTICLES];
  }, [articles]);

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-amber-500 shrink-0" />
            {t.helpTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.helpSubtitle}
          </p>
        </div>

        <button
          onClick={() => setIsPostModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Article / Guide</span>
        </button>
      </div>

      {/* Section Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Help & Articles' },
          { id: 'articles', label: `Articles & Search (${allArticles.length})` },
          { id: 'helplines', label: `Emergency & Helplines (${VERIFIED_RESOURCES.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSectionTab(tab.id as 'all' | 'articles' | 'helplines')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors ${
              sectionTab === tab.id
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {articleNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
          <span>{articleNotice}</span>
          <button onClick={() => setArticleNotice(null)} className="text-xs font-bold shrink-0">
            {t.close}
          </button>
        </div>
      )}

      {/* Official Government Independent Disclaimer */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Community Independence Notice:</span>
          {t.officialDisclaimer}
        </div>
      </div>

      {/* ARTICLES & LIVE SEARCH SECTION */}
      {(sectionTab === 'all' || sectionTab === 'articles') && (
        <div className="space-y-4">
          {/* Find More Articles via Live Google Search */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Find More Singapore Worker Articles (Live Search)
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">MOM, NGO & Community Guides</span>
            </div>

            <form
              onSubmit={handleSearchMoreArticles}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search topic (e.g. MOM salary claim, WICA injury, Work Permit transfer)..."
                  value={articleQuery}
                  onChange={(e) => setArticleQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={searchingArticles}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shrink-0 disabled:opacity-50"
              >
                {searchingArticles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Finding Articles...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Articles</span>
                  </>
                )}
              </button>
            </form>

            {articleSearchError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{articleSearchError}</span>
              </div>
            )}

            {searchResult && (
              <div className="space-y-3 pt-1">
                {searchResult.summaryText && (
                  <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {searchResult.summaryText}
                  </div>
                )}

                {searchResult.articles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {searchResult.articles.map((art, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                              {art.title}
                            </h3>
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                              {art.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                            {art.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                          <span className="text-[10px] text-slate-500 truncate">
                            {art.sourceName || 'Verified Source'}
                          </span>
                          {art.url && (
                            <a
                              href={art.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
                            >
                              <span>Read Article</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {searchResult.groundingLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold">Reference Links:</span>
                    {searchResult.groundingLinks.slice(0, 5).map((lnk, idx) => (
                      <a
                        key={idx}
                        href={lnk.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>{lnk.title}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Community & Starter Guides Grid */}
          <div className="space-y-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 px-1">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Worker Guides & Community Articles ({allArticles.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allArticles.map((art) => {
                const isCommunity = !art.id.startsWith('guide-');
                const isExpanded = expandedArticleId === art.id;
                const isOwner = Boolean(
                  art.isOwner || (deviceUserId && art.userId === deviceUserId)
                );

                return (
                  <div
                    key={art.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          {art.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {art.authorLabel}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isExpanded ? art.content : art.summary}
                      </p>

                      {art.content.length > art.summary.length && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedArticleId(isExpanded ? null : art.id)
                          }
                          className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          {isExpanded ? 'Show Less' : 'Read Full Guide'}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                      <div className="flex items-center gap-2">
                        {isCommunity ? (
                          <button
                            type="button"
                            onClick={() => onLikeArticle(art.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-colors ${
                              art.likedByMe
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{art.likesCount || 0}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">Starter Guide</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {art.sourceUrl && (
                          <a
                            href={art.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                          >
                            <span>Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {isCommunity && isOwner && (
                          <button
                            type="button"
                            onClick={() => onDeleteArticle(art.id)}
                            className="text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HELPLINES & EMERGENCY SECTION */}
      {(sectionTab === 'all' || sectionTab === 'helplines') && (
        <div className="space-y-4">
          {/* Emergency Immediate Action Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-red-600 text-white p-4 rounded-3xl flex items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-1.5 text-red-100 text-[11px] font-bold uppercase tracking-wider">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
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

            <div className="bg-blue-600 text-white p-4 rounded-3xl flex items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center gap-1.5 text-blue-100 text-[11px] font-bold uppercase tracking-wider">
                  <PhoneCall className="w-4 h-4 shrink-0" />
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
      )}

      {/* Post Community Article Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                Post Worker Guide or Article
              </h2>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to check CPF/Work Permit status or best Dormitory clinic"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={postForm.category}
                    onChange={(e) =>
                      setPostForm({
                        ...postForm,
                        category: e.target.value as HelpArticle['category'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="salary">Salary & OT</option>
                    <option value="safety">Safety & WICA</option>
                    <option value="medical">Medical & Clinics</option>
                    <option value="housing">Dormitory & Housing</option>
                    <option value="remittance">Remittance & Banking</option>
                    <option value="general">General Tip</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reference Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.mom.gov.sg/..."
                    value={postForm.sourceUrl}
                    onChange={(e) => setPostForm({ ...postForm, sourceUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Summary
                </label>
                <input
                  type="text"
                  placeholder="One-sentence overview for workers"
                  value={postForm.summary}
                  onChange={(e) => setPostForm({ ...postForm, summary: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Article Content *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write helpful steps, tips, or guidance for fellow workers..."
                  value={postForm.content}
                  onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={postingArticle}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition-all shadow-sm"
                >
                  {postingArticle ? 'Publishing...' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
