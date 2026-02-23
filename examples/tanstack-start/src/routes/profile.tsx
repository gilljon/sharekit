import { defineShareableComponents } from "@sharekit/react";
import { createFileRoute } from "@tanstack/react-router";
import { profileShare } from "../shareables/profile.js";
import "@sharekit/react/styles.css";

const Profile = defineShareableComponents(profileShare);

const mockData = {
  bio: "Trading enthusiast. Building in public.",
  followerCount: 1240,
  earnings: 4200,
  analytics: {
    viewsOverTime: [100, 150, 200, 180, 220],
    earningsBreakdown: { subscriptions: 3000, sponsors: 1200 },
  },
};

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <Profile.Provider data={mockData}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>My Profile</h1>
          <Profile.ShareButton label="Share" />
        </header>
        <Profile.Field name="bio">
          <p>{mockData.bio}</p>
        </Profile.Field>
        <Profile.Field name="followerCount">
          <p>Followers: {mockData.followerCount}</p>
        </Profile.Field>
        <Profile.Field name="earnings">
          <p>Earnings: ${mockData.earnings}</p>
        </Profile.Field>
        <Profile.Field name="analytics.viewsOverTime">
          <p>Views: {mockData.analytics.viewsOverTime.join(", ")}</p>
        </Profile.Field>
        <Profile.Field name="analytics.earningsBreakdown">
          <p>
            Breakdown: subs ${mockData.analytics.earningsBreakdown.subscriptions}, sponsors $
            {mockData.analytics.earningsBreakdown.sponsors}
          </p>
        </Profile.Field>
      </div>
    </Profile.Provider>
  );
}
