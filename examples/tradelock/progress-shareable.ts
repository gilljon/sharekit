/**
 * Example: Progress sharing definition for a trading journal
 *
 * Maps Tradelock's existing progress_shares table pattern to @shareable's
 * privacy schema. The granular boolean toggles (showPnl, showWinRate, etc.)
 * become field definitions, and the chartConfig JSONB becomes a field group.
 */
import { shareable } from "./shareable.config";

// Simulated data fetcher
declare function getProgressDataForUser(
  userId: string,
  dateFrom: Date,
  dateTo: Date,
): Promise<Record<string, unknown>>;

export const progressShare = shareable.define("progress", {
  // Maps to the existing showX boolean columns in progress_shares
  fields: {
    discipline: { label: "Discipline Score", default: true },
    observations: { label: "Observations", default: true },
    winRate: { label: "Win Rate", default: true },
    pnl: { label: "P&L Amounts", default: false }, // Sensitive -- off by default
    symbols: { label: "Symbols", default: false }, // Sensitive -- off by default
    commitments: { label: "Commitments", default: true },
    streaks: { label: "Streaks", default: true },

    // Maps to the existing chartConfig JSONB column
    charts: {
      label: "Charts",
      type: "group" as const,
      children: {
        equityCurve: { label: "Equity Curve", default: false, requires: "pnl" },
        calendarHeatmap: { label: "Calendar Heatmap", default: false, requires: "pnl" },
        tradeCalendar: { label: "Trade Calendar", default: true },
        streakAnalysis: { label: "Streak Analysis", default: true },
        rollingPerformance: { label: "Rolling Performance", default: false, requires: "pnl" },
        expectedValue: { label: "Expected Value", default: false, requires: "pnl" },
        feeAnalytics: { label: "Fee Analytics", default: false, requires: "pnl" },
        patternTimeOfDay: { label: "Time of Day", default: true },
        patternDayOfWeek: { label: "Day of Week", default: true },
        patternDuration: { label: "Duration", default: true },
        patternAssetType: { label: "Asset Type", default: true },
        patternEmotion: { label: "Emotion", default: true },
        topSymbols: { label: "Top Symbols", default: false, requires: "pnl" },
        disciplineAnalytics: { label: "Discipline Analytics", default: true },
        openPositionHeatmap: { label: "Open Position Heatmap", default: false },
        riskExposure: { label: "Risk Exposure", default: false },
        timeInTrade: { label: "Time in Trade", default: true },
        expirationTimeline: { label: "Expiration Timeline", default: false },
      },
    },
  },

  getData: async ({ ownerId, params }) => {
    const dateFrom = params.dateFrom ? new Date(params.dateFrom as string) : new Date();
    const dateTo = params.dateTo ? new Date(params.dateTo as string) : new Date();
    return getProgressDataForUser(ownerId, dateFrom, dateTo);
  },

  ogImage: ({ data, visibleFields, ownerName }) => {
    const d = data as Record<string, any>;
    return {
      title: `${ownerName}'s Trading Progress`,
      subtitle: "Shared via Tradelock",
      metrics: [
        visibleFields.discipline &&
          d.discipline?.score != null && {
            label: "Discipline",
            value: `${Math.round(d.discipline.score)}%`,
          },
        visibleFields.winRate &&
          d.performance?.winRate != null && {
            label: "Win Rate",
            value: `${d.performance.winRate.toFixed(1)}%`,
          },
        visibleFields.pnl &&
          d.performance?.totalPnl != null && {
            label: "P&L",
            value: `$${d.performance.totalPnl.toLocaleString()}`,
          },
        visibleFields.streaks &&
          d.performance?.bestStreak != null && {
            label: "Best Streak",
            value: `${d.performance.bestStreak}`,
          },
      ].filter(Boolean),
    };
  },
});
