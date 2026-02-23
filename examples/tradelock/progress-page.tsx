/**
 * Example: How the Tradelock progress page would use @shareable components
 *
 * This replaces the hand-built share modal with auto-generated privacy toggles
 * from the field schema, while keeping the existing UI components.
 */
import { defineShareableComponents } from "@shareable/react";
import { progressShare } from "./progress-shareable";

const Progress = defineShareableComponents(progressShare);

// Simulated existing components
declare function WinRateCard(props: { value: number }): JSX.Element;
declare function PnLChart(props: { data: any }): JSX.Element;
declare function DisciplineScore(props: { score: number }): JSX.Element;
declare function StreakDisplay(props: { current: number; best: number }): JSX.Element;
declare function ObservationsPanel(props: { observations: any }): JSX.Element;
declare function CommitmentsPanel(props: { commitments: any }): JSX.Element;
declare function EquityCurveChart(props: { data: any }): JSX.Element;
declare function CalendarHeatmap(props: { data: any }): JSX.Element;

/**
 * Before @shareable:
 * - Hand-built ShareModal with 15+ manual toggle switches
 * - Manual privacy filtering in getSharedProgressByToken()
 * - Separate shared view page duplicating layout code
 * - ~800 lines of share modal UI code
 *
 * After @shareable:
 * - Privacy schema defined once in progress-shareable.ts
 * - Toggle UI auto-generated from schema
 * - Same component tree renders both authenticated and shared views
 * - ~50 lines of integration code
 */
export function ProgressPage({ data }: { data: any }) {
  return (
    <Progress.Provider
      data={data}
      params={{ dateFrom: data.dateRange?.from, dateTo: data.dateRange?.to }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Progress</h1>
          {/* Replaces the entire hand-built share modal */}
          <Progress.ShareButton label="Share Progress" />
        </header>

        {/* Each Field conditionally renders based on privacy toggles in shared view */}
        <Progress.Field name="discipline">
          <DisciplineScore score={data.discipline?.score} />
        </Progress.Field>

        <Progress.Field name="winRate">
          <WinRateCard value={data.performance?.winRate} />
        </Progress.Field>

        <Progress.Field name="pnl">
          <PnLChart data={data.performance} />
        </Progress.Field>

        <Progress.Field name="streaks">
          <StreakDisplay
            current={data.performance?.currentStreak}
            best={data.performance?.bestStreak}
          />
        </Progress.Field>

        <Progress.Field name="observations">
          <ObservationsPanel observations={data.observations} />
        </Progress.Field>

        <Progress.Field name="commitments">
          <CommitmentsPanel commitments={data.commitments} />
        </Progress.Field>

        {/* Chart fields with dependencies -- equityCurve requires pnl */}
        <Progress.Field name="charts.equityCurve">
          <EquityCurveChart data={data.insightsData?.equityCurve} />
        </Progress.Field>

        <Progress.Field name="charts.calendarHeatmap">
          <CalendarHeatmap data={data.insightsData?.calendarHeatmap} />
        </Progress.Field>
      </div>
    </Progress.Provider>
  );
}

/**
 * The shared view uses the exact same component tree.
 * SharedView (from @shareable/next or future @shareable/tanstack-start) wraps
 * the page in a Provider with isShared=true and the privacy-filtered data.
 *
 * No duplicate shared view page needed.
 */
export function SharedProgressPage({ data, visibleFields, ownerName, viewCount }: any) {
  return (
    <Progress.Provider
      data={data}
      isShared
      visibleFields={visibleFields}
      ownerName={ownerName}
      viewCount={viewCount}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>
        <header>
          <p>Shared by {ownerName}</p>
          <p>{viewCount} views</p>
        </header>

        {/* Same Field components -- they auto-hide based on visibleFields */}
        <Progress.Field name="discipline">
          <DisciplineScore score={data.discipline?.score} />
        </Progress.Field>

        <Progress.Field name="winRate">
          <WinRateCard value={data.performance?.winRate} />
        </Progress.Field>

        <Progress.Field name="pnl">
          <PnLChart data={data.performance} />
        </Progress.Field>

        <Progress.Field name="streaks">
          <StreakDisplay
            current={data.performance?.currentStreak}
            best={data.performance?.bestStreak}
          />
        </Progress.Field>

        <Progress.Field name="observations">
          <ObservationsPanel observations={data.observations} />
        </Progress.Field>

        <Progress.Field name="commitments">
          <CommitmentsPanel commitments={data.commitments} />
        </Progress.Field>

        <Progress.Field name="charts.equityCurve">
          <EquityCurveChart data={data.insightsData?.equityCurve} />
        </Progress.Field>

        <Progress.Field name="charts.calendarHeatmap">
          <CalendarHeatmap data={data.insightsData?.calendarHeatmap} />
        </Progress.Field>
      </div>
    </Progress.Provider>
  );
}
