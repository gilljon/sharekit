import { defineShareableComponents } from "@sharekit/react";
import { blogPostShare } from "../../shareables/blog-post.js";
import "@sharekit/react/styles.css";

const BlogPost = defineShareableComponents(blogPostShare);

const mockData = {
  content: "This is the blog post content. Share with privacy controls.",
  authorBio: "Writer and developer. Building in public.",
  comments: [
    { id: "1", author: "Alice", text: "Great post!" },
    { id: "2", author: "Bob", text: "Thanks for sharing." },
  ],
  stats: { viewCount: 1250, likeCount: 89 },
};

export default function BlogPostPage() {
  return (
    <BlogPost.Provider data={mockData} params={{ postId: "1" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1>Blog Post</h1>
          <BlogPost.ShareButton label="Share" />
        </header>
        <BlogPost.Field name="content">
          <p>{mockData.content}</p>
        </BlogPost.Field>
        <BlogPost.Field name="authorBio">
          <p>{mockData.authorBio}</p>
        </BlogPost.Field>
        <BlogPost.Field name="comments">
          <ul>
            {mockData.comments.map((c) => (
              <li key={c.id}>{c.author}: {c.text}</li>
            ))}
          </ul>
        </BlogPost.Field>
        <BlogPost.Field name="stats.viewCount">
          <p>Views: {mockData.stats.viewCount}</p>
        </BlogPost.Field>
        <BlogPost.Field name="stats.likeCount">
          <p>Likes: {mockData.stats.likeCount}</p>
        </BlogPost.Field>
      </div>
    </BlogPost.Provider>
  );
}
