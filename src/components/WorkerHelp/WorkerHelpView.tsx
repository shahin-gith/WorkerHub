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
} from 'lucide-react';
import { VERIFIED_RESOURCES } from '../../services/verifiedResources';
import { OFFLINE_HELP_GUIDES } from '../../services/offlineDirectoryData';
import { HelpArticle, Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { copyToClipboard } from '../../utils/clipboard';

interface WorkerHelpViewProps {
  language: Language;
  articles: HelpArticle[];
  actorId: string;
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

export const WorkerHelpView: React.FC<WorkerHelpViewProps> = ({
  language,
  articles,
  actorId,
  onPostArticle,
  onLikeArticle,
  onDeleteArticle,
}) => {
  const t = getTranslation(language);

  const [sectionTab, setSectionTab] = useState<'all' | 'articles' | 'helplines'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [articleQuery, setArticleQuery] = useState('');
  const [articleCatFilter, setArticleCatFilter] = useState<string>('all');

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
      setArticleNotice('Your article was saved offline to WorkerHub Help.');
    } catch (err: unknown) {
      setArticleNotice((err as Error).message || 'Failed to save article.');
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
    const combined = [...articles, ...OFFLINE_HELP_GUIDES];
    const q = articleQuery.trim().toLowerCase();
    return combined.filter((art) => {
      const catOk = articleCatFilter === 'all' || art.category === articleCatFilter;
      if (!catOk) return false;
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.content.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q)
      );
    });
  }, [articles, articleQuery, articleCatFilter]);

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
          { id: 'articles', label: `Offline Guides (${allArticles.length})` },
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

      {/* ARTICLES & OFFLINE SEARCH SECTION */}
      {(sectionTab === 'all' || sectionTab === 'articles') && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Search Offline Worker Guides & Saved Notes
                </h2>
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                100% Available Offline
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search topic (e.g. salary, WICA, passport, dormitory, remittance)..."
                  value={articleQuery}
                  onChange={(e) => setArticleQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={articleCatFilter}
                onChange={(e) => setArticleCatFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="all">All Topics</option>
                <option value="salary">Salary & OT</option>
                <option value="safety">Safety & WICA</option>
                <option value="housing">Dormitory & Housing</option>
                <option value="remittance">Remittance</option>
                <option value="medical">Medical</option>
                <option value="general">General / Permits</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allArticles.map((art) => {
              const isCustom = !art.id.startsWith('guide-');
              const isExpanded = expandedArticleId === art.id;
              const isOwner = Boolean(art.isOwner || (actorId && art.userId === actorId));

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
                      {isCustom ? (
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
                        <span className="text-slate-400">Offline Guide</span>
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
                          <span>Reference</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {isCustom && isOwner && (
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
      )}

      {/* HELPLINES & EMERGENCY SECTION */}
      {(sectionTab === 'all' || sectionTab === 'helplines') && (
        <div className="space-y-4">
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

      {/* Post Article Modal */}
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
                  placeholder="e.g. How to check Work Permit status or Dormitory clinic"
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
                  {postingArticle ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
