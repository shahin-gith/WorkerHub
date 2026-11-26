import React, { useState, useMemo } from 'react';
import {
  Star,
  Plus,
  ShieldCheck,
  X,
  Search,
  ThumbsUp,
  Building2,
  MapPin,
  Trash2,
} from 'lucide-react';
import { CompanyReview, Language } from '../../types';
import { getTranslation } from '../../services/i18n';
import { OFFLINE_SINGAPORE_COMPANIES, OfflineCompanyEntry } from '../../services/offlineDirectoryData';

interface CompanyReviewsViewProps {
  language: Language;
  reviews: CompanyReview[];
  onSubmitReview: (
    review: Omit<CompanyReview, 'id' | 'status' | 'createdAt' | 'likesCount' | 'likedByMe' | 'userId' | 'isOwn'>
  ) => void;
  onLikeReview: (id: string) => void;
  onDeleteReview: (id: string) => void;
}

export const CompanyReviewsView: React.FC<CompanyReviewsViewProps> = ({
  language,
  reviews,
  onSubmitReview,
  onLikeReview,
  onDeleteReview,
}) => {
  const t = getTranslation(language);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [reviewFilterQuery, setReviewFilterQuery] = useState('');

  const [companyQuery, setCompanyQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All');

  const [formData, setFormData] = useState<{
    companyName: string;
    industry: CompanyReview['industry'];
    ratingWorkEnv: number;
    ratingSalaryPayment: number;
    ratingAccommodation: number;
    ratingManagement: number;
    title: string;
    comment: string;
    employmentStatus: CompanyReview['employmentStatus'];
  }>({
    companyName: '',
    industry: 'Construction',
    ratingWorkEnv: 4,
    ratingSalaryPayment: 5,
    ratingAccommodation: 4,
    ratingManagement: 4,
    title: '',
    comment: '',
    employmentStatus: 'Current Worker',
  });

  const matchingCompanies = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    return OFFLINE_SINGAPORE_COMPANIES.filter((c) => {
      const matchesIndustry = selectedIndustry === 'All' || c.industry === selectedIndustry;
      if (!matchesIndustry) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }).slice(0, q ? 12 : 6);
  }, [companyQuery, selectedIndustry]);

  const visibleReviews = useMemo(() => {
    const q = reviewFilterQuery.trim().toLowerCase();
    return reviews.filter((r) => {
      if (r.status === 'flagged') return false;
      if (!q) return true;
      return (
        r.companyName.toLowerCase().includes(q) ||
        r.industry.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q)
      );
    });
  }, [reviews, reviewFilterQuery]);

  const handleSelectCompany = (company: OfflineCompanyEntry) => {
    setFormData((prev) => ({
      ...prev,
      companyName: company.name,
      industry: company.industry || 'Construction',
    }));
    setIsSubmitModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.comment.trim()) return;

    onSubmitReview({
      companyName: formData.companyName.trim(),
      industry: formData.industry,
      ratingWorkEnv: formData.ratingWorkEnv,
      ratingSalaryPayment: formData.ratingSalaryPayment,
      ratingAccommodation: formData.ratingAccommodation,
      ratingManagement: formData.ratingManagement,
      title: formData.title.trim() || `${formData.industry} Experience`,
      comment: formData.comment.trim(),
      employmentStatus: formData.employmentStatus,
    });

    setIsSubmitModalOpen(false);
    setFormData({
      companyName: '',
      industry: 'Construction',
      ratingWorkEnv: 4,
      ratingSalaryPayment: 5,
      ratingAccommodation: 4,
      ratingManagement: 4,
      title: '',
      comment: '',
      employmentStatus: 'Current Worker',
    });
    setStatusNotice('Your company review is saved offline to this device.');
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto px-3 sm:px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500 shrink-0" />
            {t.reviewsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.reviewsSubtitle}
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t.submitReviewBtn}</span>
        </button>
      </div>

      {/* Offline Singapore Company Directory Search */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Singapore Company Directory (Works 100% Offline)
            </h2>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {OFFLINE_SINGAPORE_COMPANIES.length} Employers Included
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Singapore company (e.g. Seatrium, Woh Hup, Kimly, Tuas)..."
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="All">All Industries</option>
            <option value="Construction">Construction</option>
            <option value="Marine Shipyard">Marine Shipyard</option>
            <option value="Process">Process</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Services">Services</option>
          </select>
        </div>

        {matchingCompanies.length === 0 ? (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-300">
              Company "{companyQuery}" not in offline directory yet. Add a review for it directly!
            </span>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, companyName: companyQuery.trim() }));
                setIsSubmitModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0"
            >
              Review "{companyQuery.trim()}"
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {matchingCompanies.map((company) => (
              <div
                key={company.name}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {company.name}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 shrink-0">
                      {company.industry}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-start gap-1">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                    <span>{company.address}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {company.description}
                  </p>
                </div>

                <div className="flex justify-end pt-1 border-t border-slate-200/70 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  >
                    Write Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Policy Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>{t.reviewDisclaimer}</div>
      </div>

      {statusNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-xs font-bold ml-3">
            {t.close}
          </button>
        </div>
      )}

      {/* Filter Saved Reviews */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">
          Saved Reviews ({visibleReviews.length})
        </h2>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter reviews by company or keyword..."
            value={reviewFilterQuery}
            onChange={(e) => setReviewFilterQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-3">
        {visibleReviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              No reviews match yet. Pick a Singapore company above and save your experience!
            </p>
          </div>
        ) : (
          visibleReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white break-words">
                      {rev.companyName}
                    </h3>
                    <span className="text-[11px] text-slate-500">· {rev.industry}</span>
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                    {rev.employmentStatus}
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 shrink-0">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* 4 Category Ratings Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">{t.reviewWorkEnv}</span>
                  {renderStars(rev.ratingWorkEnv)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {t.reviewSalaryPayment}
                  </span>
                  {renderStars(rev.ratingSalaryPayment)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {t.reviewAccommodation}
                  </span>
                  {renderStars(rev.ratingAccommodation)}
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5">
                    {t.reviewManagement}
                  </span>
                  {renderStars(rev.ratingManagement)}
                </div>
              </div>

              {rev.title && (
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  "{rev.title}"
                </h4>
              )}

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words">
                {rev.comment}
              </p>

              {/* Interactive Footer: Like Button + Delete */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => onLikeReview(rev.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                    rev.likedByMe
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({rev.likesCount || 0})</span>
                </button>

                {rev.isOwn && (
                  <button
                    type="button"
                    onClick={() => onDeleteReview(rev.id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 font-semibold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submit Review Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                {t.submitReviewBtn}
              </h2>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.company} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.industry}
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        industry: e.target.value as CompanyReview['industry'],
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Construction">Construction</option>
                    <option value="Marine Shipyard">Marine Shipyard</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Process">Process</option>
                    <option value="Services">Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employment Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Current Worker', 'Former Worker'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, employmentStatus: status })}
                      className={`py-1.5 text-xs font-semibold rounded-xl border ${
                        formData.employmentStatus === status
                          ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewWorkEnv}: {formData.ratingWorkEnv}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.ratingWorkEnv}
                    onChange={(e) =>
                      setFormData({ ...formData, ratingWorkEnv: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewSalaryPayment}: {formData.ratingSalaryPayment}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.ratingSalaryPayment}
                    onChange={(e) =>
                      setFormData({ ...formData, ratingSalaryPayment: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewAccommodation}: {formData.ratingAccommodation}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.ratingAccommodation}
                    onChange={(e) =>
                      setFormData({ ...formData, ratingAccommodation: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.reviewManagement}: {formData.ratingManagement}/5
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.ratingManagement}
                    onChange={(e) =>
                      setFormData({ ...formData, ratingManagement: Number(e.target.value) })
                    }
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title / One-Line Summary
                </label>
                <input
                  type="text"
                  placeholder="Summary of your experience"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.reviewComment} *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share constructive feedback on workplace conditions, safety gears, food/living arrangements..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-sm"
                >
                  Post Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
