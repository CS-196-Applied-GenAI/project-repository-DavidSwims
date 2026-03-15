# Wildcatwitter

![Node.js](https://img.shields.io/badge/Node.js-Express-43853D?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)
![Coverage](https://img.shields.io/badge/Coverage-92.03%25-brightgreen)
![Course Project](https://img.shields.io/badge/CS196-Full--Stack%20Project-4B2E83)

Wildcatwitter is a full-stack Twitter-style social app built for the CS 196 Applied Generative AI course project. It includes account creation, login, a personalized feed, profile editing, tweet creation, likes, retweets, comments, follow/unfollow, block/unblock, and integration tests for the backend behavior.

## Highlights

- Full-stack social app with authenticated user flows
- Real MySQL-backed persistence for profiles, tweets, follows, blocks, likes, and retweets
- Profile image upload support with local file selection
- Persistent interaction state across navigation
- Backend test coverage above the project threshold

## Overview

This repository contains:

- A Node.js + Express backend with JWT authentication and MySQL persistence
- A React + Vite frontend for the client experience
- Jest + Supertest backend and integration tests with coverage reporting

The application is designed to run end-to-end locally with the frontend talking to the backend through a Vite development proxy.

## Screenshots

This section is structured for GitHub so screenshots can be dropped in later under a `docs/screenshots/` folder.

Suggested screenshots to add:

- Login / create account screen
- Home feed with tweets and interactions
- Profile page with edit profile flow
- Comment or reply flow on a tweet

Example layout:

```markdown
![Login Screen](docs/screenshots/login.png)
![Home Feed](docs/screenshots/feed.png)
![Profile Page](docs/screenshots/profile.png)
![Comment Flow](docs/screenshots/comment.png)
```

If you want this section fully populated, add those image files to the repository and the links above will render automatically on GitHub.

## Features

- Create an account with unique username validation
- Log in and log out with JWT-based authentication
- Protected app access for authenticated users only
- Personalized feed with up-to-date tweet data
- View and edit your profile
- Upload a profile picture from local files
- Create tweets and comments
- Delete your own tweets
- Like and unlike tweets
- Retweet and unretweet tweets
- Follow and unfollow other users
- Block and unblock users
- Click into another user profile directly from a tweet
- Persist tweet interaction state across navigation

## Project Structure

```text
backend/
	db.js
	server.js
	middleware/
	routes/
frontend/
	src/
	package.json
server.test.js
db.test.js
fullstack.integration.test.js
package.json
```

## Tech Stack

### Backend

- Node.js
- Express
- MySQL with mysql2
- JWT authentication
- bcrypt password hashing
- multer for profile image uploads

### Frontend

- React
- Vite
- React Router
- Lucide icons

### Testing

- Jest
- Supertest
- Istanbul coverage reporting

## API Summary

The backend exposes a small REST API under `/api`.

### Authentication

- `POST /api/auth/register` - create a new account
- `POST /api/auth/login` - authenticate and receive a JWT
- `POST /api/auth/logout` - log out on the client side
- `GET /api/auth/me` - fetch the current authenticated user

### Feed and Tweets

- `GET /api/feed` - fetch the personalized feed
- `POST /api/tweets` - create a tweet or comment
- `DELETE /api/tweets/:id` - delete your own tweet
- `POST /api/tweets/:id/like` - toggle like/unlike
- `POST /api/tweets/:id/retweet` - toggle retweet/unretweet

### Users and Profiles

- `GET /api/users/:username` - fetch a user profile and tweets/likes
- `PUT /api/users/me` - update your profile fields
- `POST /api/users/me/profile-picture` - upload a profile image
- `GET /api/users/search/query?q=...` - search users by username
- `GET /api/users/check-username?username=...` - check username availability
- `GET /api/users/:id/relationship` - fetch follow/block relationship state
- `POST /api/users/:id/follow` - follow or unfollow a user
- `POST /api/users/:id/block` - block or unblock a user

### Response Style

- JSON responses throughout
- Protected endpoints require `Authorization: Bearer <token>`
- Errors return an `error` field with a readable message

## Requirements

Before running the project, make sure you have:

- Node.js 18+ installed
- npm installed
- A MySQL database available locally or remotely
- A root `.env` file with valid database and auth settings

## Environment Variables

Create a `.env` file in the repository root.

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=twitter_clone
DB_PORT=3306
JWT_SECRET=replace_with_a_secure_secret
PORT=3000
```

Notes:

- The `.env` file is intentionally ignored by git.
- You must provide valid credentials for the backend to start successfully.
- The database schema and seed data must exist in the target MySQL database.

## Installation

Install backend dependencies from the repository root:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running the App

### 1. Start the backend

From the repository root:

```bash
npm start
```

The backend runs on port 3000 by default.

### 2. Start the frontend

In a separate terminal:

```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`.

### 3. Open the app

Open the local frontend URL shown by Vite in your browser.

## Quick Start

```bash
npm install
cd frontend && npm install
cd ..
npm start
```

Then, in a second terminal:

```bash
cd frontend
npm run dev
```

## Available Scripts

### Root scripts

- `npm start` - start the backend server
- `npm test` - run Jest tests with coverage
- `npm run test-db` - test database connectivity

### Frontend scripts

- `npm run dev` - start the frontend development server
- `npm run build` - build the frontend for production

## Testing

Run the full test suite from the repository root:

```bash
npm test -- --runInBand
```

If you want to explicitly request coverage output:

```bash
npm test -- --coverage --runInBand
```

The HTML coverage report is generated under:

```text
coverage/lcov-report/index.html
```

## Current Coverage

At the latest recorded run, the project reports approximately:

- 92.03% statements
- 87.41% branches
- 96.55% functions
- 92.01% lines

## Troubleshooting

### Backend fails to start

- Check that the `.env` file exists in the repository root
- Verify MySQL credentials and host are correct
- Run `npm run test-db` from the root to verify connectivity

### Frontend loads but API calls fail

- Confirm the backend is running on port 3000
- Confirm the frontend is running through Vite dev server
- Check that the browser requests are hitting `/api/...`

### Fresh clone does not run immediately

This is expected if the clone does not include:

- the `.env` file
- valid DB credentials
- the database schema/data

## Course Context

This project was completed as the culminating integration assignment for the CS 196 Applied Generative AI course. It focuses on joining a backend, frontend, and database into a working full-stack application with test coverage and a recordable user flow.

## Repository Notes

- `coverage/` is gitignored
- `node_modules/` is gitignored
- `.env` is gitignored
- `frontend/dist/` is gitignored

## License

This repository is an academic course project submission.
