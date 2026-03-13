# plan.md - Twitter/X Clone Backend Implementation

## 🟢 Phase 1: Foundation & Environment
*Goal: Set up the infrastructure, verify MySQL connectivity, and establish the 80% coverage baseline.*

### Step 1.1: Project Initialization & Testing Config
* Initialize Node.js (`npm init -y`).
* Install: `express`, `mysql2`, `dotenv`, `bcrypt`, `jsonwebtoken`, `cors`.
* Dev Installs: `jest`, `supertest`, `nodemon`.
* **Configuration:** Set up `jest.config.js` or `package.json` to collect coverage and set a 80% threshold for branches and lines.
* **Test:** Create a `server.js` and a test to confirm the server is reachable.
* **Coverage Target:** 100% for initial setup files.

### Step 1.2: Database Connection Pool
* Create `db.js` utility using `mysql2/promise`.
* **Test:** Write a script/test to run `SELECT 1 + 1` to verify the pool is active. Handle connection error branches in tests.

### Step 1.3: Health Check & Global Middleware
* Implement `GET /api/health`.
* **Testing:** Test for both successful DB connection (200) and failed DB connection (500) to cover error branches.
* **Goal:** Establish a "green" baseline with coverage reporting enabled.

---

## 🔵 Phase 2: Identity & Security
*Goal: Handle user registration, login, and secure routes while testing edge cases.*

### Step 2.1: User Registration (Edge Case Focus)
* Implement `POST /api/auth/register`.
* **Testing:** Verify success (201), duplicate username (400), and missing fields (400). 
* **Coverage Check:** Ensure all validation `if` statements are triggered.

### Step 2.2: JWT Issuance & Login
* Implement `POST /api/auth/login`.
* **Testing:** Test valid login, wrong password, and non-existent user.
* **Coverage Check:** Verify the `bcrypt.compare` failure branch is tested.

### Step 2.3: Auth Middleware & Route Protection
* Create `authenticateToken` middleware.
* **Testing:** Test route with no token (401), malformed token (403), and valid token.
* **Coverage Check:** Ensure the `jwt.verify` error catch block is executed.

---

## 🟡 Phase 3: The Content Engine
*Goal: Enable Posting and Interacting with strict validation coverage.*

### Step 3.1: Tweet Creation (Boundary Testing)
* Implement `POST /api/tweets`.
* **Testing:** Valid tweet, exactly 280-char tweet, 281-char failure, and Quote Tweet logic.
* **Coverage Check:** Ensure the character length check branch is 100% covered.

### Step 3.2: Secure Deletion
* Implement `DELETE /api/tweets/:id`.
* **Testing:** Owner can delete, non-owner is blocked (403), tweet doesn't exist (404).
* **Coverage Check:** Test the "not found" and "unauthorized" branches.

### Step 3.3: Likes & Retweets (Logic Toggles)
* Implement `POST /api/tweets/:id/like` and `POST /api/tweets/:id/retweet`.
* **Testing:** Toggle logic (click once to add, click again to remove).
* **Coverage Check:** Ensure both the `INSERT` and `DELETE` paths are executed in tests.

---

## 🟠 Phase 4: Social Graph & Privacy
*Goal: Manage follows and the "Hard Block" safety requirements.*

### Step 4.1: Follow/Unfollow Logic
* Implement `POST /api/users/:id/follow`.
* **Testing:** Successful follow, unfollow, and prevent self-follow (400).
* **Coverage Check:** Verify the self-follow prevention branch is tested.

### Step 4.2: The "Hard Block" Implementation
* Implement `POST /api/users/:id/block`.
* **Critical Logic:** Blocking triggers immediate deletion of existing follows.
* **Testing:** Verify a block removes existing follow records for both users.
* **Coverage Check:** Verify the cleanup logic (the DELETE query) is executed.

---

## 🔴 Phase 5: The Read Side & Final Audit
*Goal: Hybrid feed logic and final 80%+ coverage verification.*

### Step 5.1: Profile Retrieval & Tabs
* Implement `GET /api/users/:username` with separate `/tweets` and `/likes` feeds.
* **Testing:** Return data for existing user, 404 for missing user.
* **Coverage Check:** Ensure the empty state (user has 0 likes) is covered.

### Step 5.2: The Hybrid Feed Query
* Implement `GET /api/feed` with block filtering.
* **Testing:** Feed for user with follows, user with no follows (global), and verifying blocked content is hidden.
* **Coverage Check:** Ensure all complex JOIN/UNION logic branches are tested.

### Step 5.3: Search & Pagination
* Add `limit` and `offset` to feed/search.
* **Testing:** Page 1 vs Page 2 results; search with valid/invalid strings.

### Step 5.4: Final Coverage Audit (The 10-Point Check)
* **Action:** Run `npm test -- --coverage`.
* **Audit:** Identify any files below 80%. Write targeted unit tests for specific uncovered lines until the average is >80%.