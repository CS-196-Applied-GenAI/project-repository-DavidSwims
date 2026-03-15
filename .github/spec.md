# Project Specification: Twitter/X Clone (Web)

## 1. Project Overview
A full-stack Twitter/X clone featuring real-time interactions, a hybrid discovery feed, and strict access control. This application is built as a web-based platform with a focus on snappy UI/UX and consistent data integrity.

---

## 2. Tech Stack & Infrastructure
* **Platform:** Web Application (React or Next.js recommended).
* **Backend:** Node.js with Express (interfacing with MySQL).
* **Database:** MySQL (utilizing the provided schema from `CS196-Database`).
* **Authentication:** * Traditional Email/Password system.
    * **JWT (JSON Web Tokens)** for session management (stored in `localStorage` or `httpOnly` cookies).
    * Strict protected routes: Unauthenticated users are shown a **Login/Signup modal** over a blurred background and cannot view content.



---

## 3. Core Features & Logic

### A. Authentication & User Management
* **Account Creation:** * Unique `@username` required.
    * Passwords: Minimum 8 characters with a **Live Password Strength Meter**.
    * Real-time **Username Availability check** (debounced) during registration and profile updates.
* **Logout:** Immediate JWT clearance. Redirects to landing; cached data visibility during transition is acceptable.

### B. The Feed (Global + Discovery)
* **Hybrid Logic:** * Primary feed prioritizes tweets from users the current user follows.
    * Empty space or remaining feed is filled with "Global" tweets from all users to ensure the feed is never empty.
* **Loading:** * **Infinite Scroll:** Loads 20 tweets per batch as the user scrolls.
    * **Refresh:** A **"New Tweets" toast** appears at the top when new posts are detected; clicking it scrolls to the top and refreshes content.



### C. Tweeting & Interactions
* **Composition:** * A **Floating "+" Action Button** (FAB) opens a global "Compose" modal accessible from any page.
    * **Character Limit:** Strict 280-character limit with a live `x/280` text counter.
* **Engagement:**
    * **Likes & Retweets:** Use **Optimistic UI Updates** to toggle states instantly.
    * **Quote Tweets:** Reuses the Compose modal, embedding the original tweet as a nested reference.
* **Deletion:** * Triggers a **Confirmation Modal** ("Are you sure?").
    * If a tweet is deleted, Quote Tweets referencing it remain but display a placeholder: *"This tweet has been deleted."*

### D. User Profiles & Social
* **Profile Layout:** * Displays Bio, Username, and Profile Picture (via **Image URL**).
    * **Tabs:** Separate tabs for "Tweets" (original content) and "Likes."
    * **Stats:** Static counts for "Followers" and "Following" (non-clickable in V1).
* **Discovery:** A **Live Search** bar filters users by `@username` instantly as the user types.



---

## 4. Safety & Privacy
* **Blocking (Hard Block):** * Blocked users cannot see the blocker’s content, and vice-versa.
    * Upon blocking, all existing interactions (Likes/Retweets) between the two users are automatically hidden from their respective views.

---

## 5. Database Mapping (MySQL)
* **Users:** `id`, `username` (unique), `email`, `password_hash`, `bio`, `profile_pic_url`.
* **Tweets:** `id`, `user_id`, `content` (280 max), `parent_tweet_id` (for Quote Tweets/Replies), `created_at`.
* **Interactions:** Tables for `likes`, `follows`, and `blocks` to manage relational states.