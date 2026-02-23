/**
 * Example: Blog profile page with @sharekit components
 *
 * Wrapping existing components in <Field> makes the same page
 * work for both the authenticated owner view and shared public view.
 */
import { defineShareableComponents } from "@sharekit/react";
import { profileShare } from "./profile-shareable";

const Profile = defineShareableComponents(profileShare);

declare function BioCard(props: { bio: string }): JSX.Element;
declare function StatsGrid(props: { followers: number; posts: number; readTime: number }): JSX.Element;
declare function EarningsCard(props: { amount: number }): JSX.Element;
declare function TopPostsList(props: { posts: any[] }): JSX.Element;
declare function ViewsChart(props: { data: any }): JSX.Element;
declare function DemographicsChart(props: { data: any }): JSX.Element;
declare function ReferralChart(props: { data: any }): JSX.Element;
declare function EarningsBreakdown(props: { data: any }): JSX.Element;

export function ProfilePage({ data }: { data: any }) {
  return (
    <Profile.Provider data={data}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>My Profile</h1>
          <Profile.ShareButton label="Share Profile" />
        </header>

        <Profile.Field name="bio">
          <BioCard bio={data.bio} />
        </Profile.Field>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          <Profile.Field name="followerCount">
            <StatsGrid followers={data.followerCount} posts={0} readTime={0} />
          </Profile.Field>

          <Profile.Field name="postCount">
            <StatsGrid followers={0} posts={data.postCount} readTime={0} />
          </Profile.Field>

          <Profile.Field name="readTime">
            <StatsGrid followers={0} posts={0} readTime={data.totalReadMinutes} />
          </Profile.Field>
        </div>

        <Profile.Field name="earnings">
          <EarningsCard amount={data.earnings} />
        </Profile.Field>

        <Profile.Field name="topPosts">
          <TopPostsList posts={data.topPosts} />
        </Profile.Field>

        <Profile.Field name="analytics.viewsOverTime">
          <ViewsChart data={data.analytics?.viewsOverTime} />
        </Profile.Field>

        <Profile.Field name="analytics.readerDemographics">
          <DemographicsChart data={data.analytics?.demographics} />
        </Profile.Field>

        <Profile.Field name="analytics.referralSources">
          <ReferralChart data={data.analytics?.referrals} />
        </Profile.Field>

        <Profile.Field name="analytics.earningsBreakdown">
          <EarningsBreakdown data={data.analytics?.earningsBreakdown} />
        </Profile.Field>
      </div>
    </Profile.Provider>
  );
}
