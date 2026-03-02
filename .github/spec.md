# Twitter (X) Backend Specification

## 1. User Authentication & Profile
- [cite_start]**Create Account**: Unique usernames and restricted passwords[cite: 2, 5].
- [cite_start]**Login/Logout**: Users must be logged in to perform any tasks or view content[cite: 4, 6, 7, 8].
- [cite_start]**Update Profile**: Users can edit their Bio, Username, and Profile Picture[cite: 9, 10].

## 2. Tweeting & Interactions
- [cite_start]**Post (Tweet)**: Create text posts with a character limit[cite: 11, 13].
- [cite_start]**Delete Post**: Users can remove their own posts[cite: 14].
- [cite_start]**Retweet/Unretweet**: Support for sharing and removing shared posts[cite: 25, 26].
- [cite_start]**Like/Unlike**: Users can like and remove likes from posts[cite: 23, 24].

## 3. Social Graph
- [cite_start]**Follow/Unfollow**: Users can subscribe to or unsubscribe from others[cite: 18, 19].
- [cite_start]**Block/Unblock**: Blocking prevents all mutual content visibility[cite: 20, 21, 22].

## 4. Feed & Display
- [cite_start]**View Feed**: Display recent tweets from most to least recent[cite: 15, 16].
- [cite_start]**Refresh Feed**: Ability to reload the tweet stream.

## 5. Technical Constraints
- [cite_start]**Database**: Must implement the structure provided by the instructor[cite: 27, 28].