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
      this.error = message || '�� x?y ra l?i.';
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
        this.setError(e?.response?.data?.message || e.message || 'Kh�ng t?i du?c danh s�ch ph�n c�ng.');
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
        this.setError(e?.response?.data?.message || e.message || 'Kh�ng t?i du?c kh�ng gian ch?m di?m.');
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async submitEvaluation(evaluationId, payload) {
      this.loading = true;
      this.clearError();
      try {
        // BR06: optimistic concurrency � send current evaluation version with save/submit
        const versionPayload = { ...payload };
        if (this.currentEvaluation && (versionPayload.expectedVersion ?? versionPayload.__v ?? versionPayload.evaluationVersion) == null) {
          if (this.currentEvaluation.__v != null) versionPayload.__v = this.currentEvaluation.__v;
          if (this.currentEvaluation.updatedAt) versionPayload.lastKnownUpdatedAt = this.currentEvaluation.updatedAt;
        }
        const res = await evaluatorService.submitEvaluation(evaluationId, versionPayload);
        this.currentEvaluation = res?.data || res;
        return res;
      } catch (e) {
        this.setError(e?.response?.data?.message || e.message || 'Kh�ng luu du?c phi?u ch?m di?m.');
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
