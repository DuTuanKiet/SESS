import { defineStore } from 'pinia';
import evaluatorService from '@/services/evaluatorService';

export const useEvaluatorStore = defineStore('evaluator', {
  state: () => ({
    assignments: [],
    currentEvaluation: null,
    currentProject: null,
    currentRubric: null,
    currentMeta: null,
    loading: false,
    error: null,
  }),

  getters: {
    isSubmitted: (state) => state.currentEvaluation?.status === 'SUBMITTED',
    totalScore: (state) => state.currentEvaluation?.totalScore || 0,
  },

  actions: {
    setError(message) {
      this.error = message || 'Đã xảy ra lỗi.';
    },
    clearError() {
      this.error = null;
    },

    async fetchAssignments() {
      this.loading = true;
      this.clearError();
      try {
        const res = await evaluatorService.getAssignments();
        this.assignments = Array.isArray(res?.data) ? res.data : [];
        return this.assignments;
      } catch (e) {
        this.setError(e.message || 'Không tải được danh sách phân công.');
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchWorkspace(evaluationId) {
      this.loading = true;
      this.clearError();
      try {
        const res = await evaluatorService.getWorkspace(evaluationId);
        const data = res?.data || {};
        this.currentEvaluation = data.evaluation || null;
        this.currentProject = data.project || null;
        this.currentRubric = data.rubric || null;
        this.currentMeta = data.meta || null;
        return data;
      } catch (e) {
        this.setError(e.message || 'Không tải không gian chấm điểm.');
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async submitEvaluation(evaluationId, payload) {
      this.loading = true;
      this.clearError();
      try {
        const res = await evaluatorService.submitEvaluation(evaluationId, payload);
        this.currentEvaluation = res?.data || res;
        return res;
      } catch (e) {
        this.setError(e.message || 'Không lưu được phiếu chấm điểm.');
        throw e;
      } finally {
        this.loading = false;
      }
    },

    resetWorkspace() {
      this.currentEvaluation = null;
      this.currentProject = null;
      this.currentRubric = null;
      this.currentMeta = null;
      this.clearError();
    },
  },
});
