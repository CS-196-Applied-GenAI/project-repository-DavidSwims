# prompt.md - Twitter/X Clone Backend Implementation

## 🟢 Phase 1: Foundation & Environment

### Prompt 1.1: Project Initialization & Coverage Config
`Initialize a Node.js project. Create a package.json with express, mysql2, dotenv, bcrypt, jsonwebtoken, and cors. Set up Jest and Supertest. IMPORTANT: Configure Jest in package.json to include "collectCoverage": true and set "coverageThreshold" to {"global": {"branches": 80, "functions": 80, "lines": 80, "statements": 80}}. Create a basic server.js with a 'GET /' route and write a test that ensures 100% coverage for this initial file.`

### Prompt 1.2: Database Connection & Error Handling
`Create a db.js file that exports a MySQL connection pool using mysql2/promise. Use .env for credentials. Write a test-db.js script to verify the connection. Also, write a unit test for db.js that mocks a connection failure to ensure your error-handling logic is covered in the 80% requirement.`

### Prompt 1.3: Health Check & Branch Coverage
`In server.js, implement 'GET /api/health'. Write two tests: 1. Success (DB connected, returns 200). 2. Failure (DB connection error, returns 500). This is required to cover the catch/error branches for the 80% coverage grade. Add express.json() and cors() middleware.`

---

## 🔵 Phase 2: Identity & Security

### Prompt 2.1: User Registration & Validation Edge Cases
`Implement 'POST /api/auth/register'. Requirements: unique username, hashed password (bcrypt). You MUST write tests for: 1. Successful registration (201). 2. Duplicate username (400). 3. Missing required fields (400). These tests ensure all validation branches are covered for the 80% threshold.`

### Prompt 2.2: Login & Failed Credential Branches
`Implement 'POST /api/auth/login'. Logic: Compare bcrypt hashes and return a JWT. Write tests for: 1. Valid login (returns token). 2. Wrong password (401). 3. User not found (401). Testing these failure states is critical for code coverage points.`

### Prompt 2.3: Middleware & Protected Route Coverage
`Create 'authenticateToken' middleware. Implement a protected 'GET /api/auth/me' route. Write tests for: 1. Valid token (200). 2. Missing token (401). 3. Invalid/Expired token (403). Ensure the tests trigger the 'catch' block in the middleware to maximize branch coverage.`

---

## 🟡 Phase 3: The Content Engine

### Prompt 3.1: Tweet Creation & Character Limits
`Implement 'POST /api/tweets' (protected). Logic: 280-character limit, optional 'parent_tweet_id'. Write tests for: 1. Valid tweet. 2. Exactly 280 characters. 3. 281 characters (should fail 400). 4. Valid Quote Tweet. These boundary tests are necessary for the 80% coverage requirement.`

### Prompt 3.2: Secure Deletion & Permissions
`Implement 'DELETE /api/tweets/:id' (protected). Logic: Only the owner can delete. Write tests for: 1. Successful deletion by owner. 2. Attempted deletion by non-owner (403). 3. Tweet not found (404). This covers the authorization logic branches.`

### Prompt 3.3: Toggle Logic (Likes/Retweets)
`Implement 'POST /api/tweets/:id/like' and 'POST /api/tweets/:id/retweet' as toggles. Write tests that: 1. Like a tweet (record created). 2. Like the same tweet again (record deleted). This ensures both the 'if' (create) and 'else' (delete) paths are covered in your coverage report.`

---

## 🟠 Phase 4: Social Graph & Privacy

### Prompt 4.1: Follow Logic & Self-Follow Prevention
`Implement 'POST /api/users/:id/follow' (protected). Write tests for: 1. Successful follow. 2. Successful unfollow (toggle). 3. Error when trying to follow self (400). Testing the self-follow 'if' statement is required for branch coverage.`

### Prompt 4.2: Hard Block & Cleanup Logic
`Implement 'POST /api/users/:id/block' (protected). Logic: Blocking must delete any existing 'follows' between the two users. Write a test that: 1. Establishes a follow. 2. Blocks the user. 3. Verifies the follow is gone. This covers the cleanup logic path.`

---

## 🔴 Phase 5: The Read Side & Final Audit

### Prompt 5.1: Profile & Tab Coverage
`Implement 'GET /api/users/:username' with '/tweets' and '/likes' sub-routes. Write tests for: 1. User found. 2. User not found (404). 3. User with no likes (empty array). Testing the 404 and empty states is vital for hitting 80% coverage.`

### Prompt 5.2: Hybrid Feed & Block Filtering
`Implement 'GET /api/feed' (protected). Logic: Followed tweets first, then global, excluding blocked users. Write tests for: 1. User with follows. 2. User with NO follows (should return global). 3. Verification that blocked tweets are hidden. This covers the complex SQL logic paths.`

### Prompt 5.3: Final Coverage Audit (10-Point Goal)
`Run 'npm test -- --coverage'. Look at the coverage report. If any file is below 80%, identify the 'Uncovered Lines' and write specific unit tests to trigger those lines (e.g., error handlers or secondary validation). Do not stop until the total coverage is above 80%.`