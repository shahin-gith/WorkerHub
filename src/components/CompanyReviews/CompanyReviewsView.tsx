import React, { useState } from 'react';
import {
  Star,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Flag,
  X,
  Lock,
} from 'lucide-react';
import { AuthUser, CompanyReview, Language } from '../../types';
import { getTranslation } from '../../services/i18n';

interface CompanyReviewsViewProps {
  language: Language;
  reviews: CompanyReview[];
  authUser: AuthUser | null;
  onOpenAccountModal: () => void;
  onSubmitReview: (review: Omit<CompanyReview, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  onModerateReview: (id: string, status: 'approved' | 'flagged') => Promise<void>;
  onReportReview: (id: string) => Promise<void>;
  onDeleteReview: (id: string) => Promise<void>;
}

export const CompanyReviewsView: React.FC<CompanyReviewsViewProps> = ({
  language,
  reviews,
  authUser,
  onOpenAccountModal,
  onSubmitReview,
  onModerateReview,
  onReportReview,
  onDeleteReview,
}) => {
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<'approved' | 'moderation'>('approved');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

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

  const isAdmin = authUser?.role === 'admin';
  const approvedReviews = reviews.filter((r) => r.status === 'approved');
  const pendingReviews = reviews.filter((r) => r.status === 'pending');

  const handleOpenSubmit = () => {
    if (!authUser) {
      onOpenAccountModal();
      return;
    }
    setIsSubmitModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.comment.trim()) return;

    setSubmitting(true);
    try {
      await onSubmitReview({
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
      setStatusNotice('Your review was submitted to the moderation queue and will be published after verification.');
    } catch (err: unknown) {
      setStatusNotice((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-700'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 pb-20 max-w-5xl mx-auto px-4 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            {t.reviewsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.reviewsSubtitle}
          </p>
        </div>

        <button
          onClick={handleOpenSubmit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors shadow-sm self-start sm:self-auto"
        >
          {authUser ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
          <span>{authUser ? t.submitReviewBtn : 'Sign In to Write Review'}</span>
        </button>
      </div>

      {/* Community Guidelines Policy Notice */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
            Fair & Moderated Community Guidelines:
          </span>
          {t.reviewDisclaimer}
        </div>
      </div>

      {statusNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
          <span>{statusNotice}</span>
          <button onClick={() => setStatusNotice(null)} className="text-xs font-bold ml-3">
            {t.close}
          </button>
        </div>
      )}

      {/* Tabs: Approved vs Admin-Only Moderation Queue */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'approved'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {t.tabCommunityReviews} ({approvedReviews.length})
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'moderation'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{t.tabModerationQueue}</span>
            {pendingReviews.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingReviews.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Content Feed */}
      <div className="space-y-3">
        {activeTab === 'approved' || !isAdmin ? (
          approvedReviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No published reviews yet. Be the first verified worker to share your experience.
              </p>
            </div>
          ) : (
            approvedReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-amber-400 dark:hover:border-amber-600/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {rev.companyName}
                      </h3>
                      <span className="text-[11px] text-slate-500">· {rev.industry}</span>
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                      {rev.employmentStatus}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400">
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
                    <span className="text-[10px] text-slate-500 block mb-0.5">{t.reviewSalaryPayment}</span>
                    {renderStars(rev.ratingSalaryPayment)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{t.reviewAccommodation}</span>
                    {renderStars(rev.ratingAccommodation)}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">{t.reviewManagement}</span>
                    {renderStars(rev.ratingManagement)}
                  </div>
                </div>

                {rev.title && (
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    "{rev.title}"
                  </h4>
                )}

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {rev.comment}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <span>Worker opinion / personal experience</span>
                  {authUser && (
                    <button
                      onClick={() => onReportReview(rev.id)}
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200">
              Admin Moderation Queue: Verify that submissions contain no personal contact phone numbers or abusive claims before approving.
            </div>

            {pendingReviews.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Moderation queue is clean. No pending reviews.
                </p>
              </div>
            ) : (
              pendingReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{rev.companyName}</span>
                      <span className="text-xs text-slate-500 ml-2">({rev.industry})</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold">
                      Pending Review
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onDeleteReview(rev.id)}
                      className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50"
                    >
                      {t.moderateReject}
                    </button>
                    <button
                      onClick={() => onModerateReview(rev.id, 'approved')}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                    >
                      {t.moderateApprove}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Submit Review Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
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
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value as CompanyReview['industry'] })}
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

              {/* 4 Ratings Sliders */}
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
                    onChange={(e) => setFormData({ ...formData, ratingWorkEnv: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, ratingSalaryPayment: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, ratingAccommodation: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, ratingManagement: Number(e.target.value) })}
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
                  placeholder="Share constructive feedback on workplace conditions, safety gears, food/living arrangements... (Do NOT post phone numbers)"
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
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 transition-all shadow-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit for Moderation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
