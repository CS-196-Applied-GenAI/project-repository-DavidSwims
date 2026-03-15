Here is a detailed prompt you can paste directly into Figma Make:

Figma Make Prompt
Project: Northwestern Wildcat Social — a Twitter/X clone redesigned with Northwestern University branding.

Brand & Visual Identity
Color palette (strict):

Primary: #4E2A84 (Northwestern Purple — use for all primary buttons, active states, logo, links, accents)
Primary hover/dark: #3b1f63
Primary light tint: #ede9f7 (hover backgrounds, pill highlights)
Accent gold: #B6A369 (Northwestern gold — use sparingly for highlights, badges, active tab underlines)
Background: #FFFFFF
Surface/card: #F9F9FB
Border: #E5E7EB
Text primary: #111827
Text muted: #6B7280
Error: #DC2626
Success: #16A34A
Typography:

Font: Inter (or system sans-serif fallback)
Logo wordmark: "Wildcat" in bold purple, with a small Wildcat paw icon 🐾 beside it (replacing the Twitter 𝕏 bird)
Body: 15px/1.5 line height
Headings (feed header, modal titles): 20px bold
Icons: Use outlined Heroicons or Phosphor Icons throughout. No emoji in UI controls.

Tone: Clean, modern, collegiate. Should feel like Twitter's layout wearing Northwestern's colors.

App Layout (3-column, max-width 1280px, centered)
Sidebar (left):

Top: "🐾 Wildcat" logo link (purple, 28px bold)
Nav items (icon + label, full-width pill shape on hover in #ede9f7, text turns purple):
🏠 Home → /
👤 Profile → /profile/:username
"Post" button: large full-width pill, solid #4E2A84, white text, hover darkens to #3b1f63
Bottom: User avatar chip (small avatar circle + username + @handle) with a "Log out 🚪" option that appears on hover/click
Main content (center):

Sticky top bar: "Home" or "Profile" title, 20px bold, white background, slight bottom border, backdrop-filter: blur(12px), z-index: 10
Scrollable tweet list below
Right panel:

Sticky search bar at top
Search results dropdown (user cards)
Panel has no border on left in mobile breakpoint
Pages & Screens to Design
1. Landing / Auth Gate
Shown to unauthenticated users. Full-screen centered card:

Background: subtle Northwestern purple gradient or pattern
Large "🐾 Wildcat Social" wordmark
Tagline: "The Northwestern community, in real time."
"Sign in" button (purple pill) → opens Auth Modal
Blurred background content hint behind modal overlay
2. Auth Modal (Login + Register tabs)
Centered modal, white card, rounded 16px, shadow.

Toggle between Log in / Create account tabs (pill tabs, gold underline on active)
Login fields: Username, Password (show/hide toggle 👁), Submit button
Register fields: Username, Email, Password
Below username: real-time availability badge — green "✓ Available" / red "✗ Taken" (checked live with 300ms debounce via GET /api/users/search/query?q=:username)
Below password: Live password strength meter — 4-segment bar:
1 segment red = Too weak
2 segments orange = Fair
3 segments yellow = Good
4 segments green = Strong
Rules: 8+ chars → +1, upper+lowercase → +1, digit → +1, special char → +1
Error message area in red below form
Loading spinner on submit button
Close ✕ button top-right
3. Feed Page (/)
Sticky header: "Home"
Compose box at top of feed (avatar circle + "What's happening, Wildcat?" placeholder input, disabled-looking until clicked, opens Compose Modal on click)
Tweet list (infinite scroll, 20 per batch):
Spinner at bottom when loading more
"No tweets yet. Be the first to post!" empty state with paw icon
"New Tweets" toast: purple banner at top of feed when new tweets are detected polling GET /api/feed?limit=1&offset=0, clicking scrolls to top and refreshes
4. Compose Modal
Centered modal:

User avatar + textarea: "What's happening, Wildcat?"
Character counter bottom-right: x / 280
Normal: gray --gray-500
Warning (>252 chars, 90%): #f59e0b amber
Over limit (>280): #dc2626 red, submit disabled
Quote tweet context (if triggered from Quote action): nested tweet preview card inside modal with purple left-border
Submit "Post" button: purple pill, disabled if empty or over limit, loading spinner on submit
Close ✕ button
5. Tweet Card Component
White card, thin bottom border, padding 16px. On hover: very subtle #F9F9FB background.

Structure:

Avatar: 48px circle. If profile_pic_url set → <img>. Else → first letter of username, purple background, white text.
Like button: heart icon, toggle fill on click (optimistic UI). Count beside it.
Retweet button: retweet arrows icon, toggle purple on click (optimistic UI). Count beside it.
Quote Tweet button: quote icon — opens Compose Modal pre-loaded with this tweet as the quoted reference.
Delete button: trash icon, only shown if user.id === tweet.author.id. Clicking opens a Confirmation Modal ("Are you sure you want to delete this post?", Cancel + Delete in red).
Quoted/deleted tweet: if quoted_tweet.deleted === true, show italic gray placeholder: "This tweet has been deleted." inside the nested card.
Retweet label: if tweet is a retweet, show 🔁 [username] retweeted in small muted text above the card.
6. Profile Page (/profile/:username)
Sticky header: "Profile"
Profile Header card:
Banner area: solid #4E2A84 strip (or gradient), 150px tall
Avatar: 80px circle, white border, overlapping the banner bottom edge
Display name (bold), @username (muted), Bio text
Follow / Unfollow button (if not own profile): pill button, outlined purple = following, solid purple = not following. Calls POST /api/users/:id/follow (toggles).
Block / Unblock button: small text button or kebab menu option. Calls POST /api/users/:id/block (toggles).
Edit Profile button (if own profile): outlined purple pill → opens Edit Profile Modal
Stats row: Tweets count · Followers · Following · Likes
Tab bar: "Tweets" | "Likes" — gold underline on active tab
Tweet list below (same TweetCard component)
7. Edit Profile Modal
Fields: Display Name (maps to username), Bio (textarea, no limit but reasonable), Profile Picture URL (text input with preview if valid URL)
Password change section (optional, collapsible): New Password + strength meter
Save button → PUT /api/users/me with bearer token
Updates AuthContext user state on success
8. Delete Confirmation Modal
Simple centered modal:

"Delete post?" heading
"This action cannot be undone." subtext in muted gray
Two buttons: "Cancel" (outlined) | "Delete" (solid red #DC2626)
9. Search (Right Panel)
Search input with magnifier icon prefix, rounded pill shape
Dropdown appears below while typing (debounced 300ms → GET /api/users/search/query?q=:q)
Each result: avatar circle + Display Name bold + @username muted → links to /profile/:username
"No users found" empty state if no results
API Integration Map
All requests to /api/*. Token stored in localStorage as token. All protected endpoints send Authorization: Bearer <token> header.

UI Action	Method	Endpoint	Body / Params
Register	POST	/api/auth/register	{ username, email, password }
Login	POST	/api/auth/login	{ username, password } → returns { token, user }
Logout	POST	/api/auth/logout	Bearer token — then clear localStorage
Get current user	GET	/api/auth/me	Bearer token → { id, username, email, bio, profile_pic_url }
Update profile	PUT	/api/users/me	Bearer + { username?, bio?, profile_pic_url?, password? }
Load feed	GET	/api/feed?limit=20&offset=N	Bearer → { tweets: [...] }
Post tweet	POST	/api/tweets	Bearer + { content, parent_tweet_id? }
Delete tweet	DELETE	/api/tweets/:id	Bearer
Like/unlike toggle	POST	/api/tweets/:id/like	Bearer → { liked: bool }
Retweet/unretweet	POST	/api/tweets/:id/retweet	Bearer → { retweeted: bool }
Get profile	GET	/api/users/:username?tab=tweets\|likes	→ [{ id, username, bio, profile_pic_url, tweets[]
Search users	GET	/api/users/search/query?q=:q	→ { users: [{id, username, bio, profile_pic_url}] }
Follow/unfollow	POST	/api/users/:id/follow	Bearer → { following: bool }
Block/unblock	POST	/api/users/:id/block	Bearer → { blocked: bool }
Tweet object shape from API:

Auth context state: { user: { id, username, email, bio, profile_pic_url } | null, loading: bool }

Component Hierarchy (React)
Interaction Details
Optimistic UI: Likes and retweets update count and icon state instantly, rollback on API error.
Infinite scroll: Listen to window.scroll, trigger next page load when within 300px of bottom.
Debounce: Username availability and user search both use 300ms debounce.
Protected routes: Any page while unauthenticated shows the blurred Auth Gate with the modal on top.
Feed refresh event: A CustomEvent('feed-refresh') on window triggers a full reload of the feed from offset 0.
"New Tweets" toast: Poll GET /api/feed?limit=1&offset=0 every 30s, compare the top tweet's id against current — if newer, show the toast banner.
Block effect: After blocking, tweets from that user should disappear from the feed (the backend already filters them out on the next fetch).
Responsive Breakpoints
≥1024px: Full 3-column layout
768–1023px: Hide right panel; sidebar collapses to icon-only (no labels)
<768px: Hide sidebar entirely; show bottom navigation bar (Home, Profile, Post FAB in center)
Accessibility
All interactive elements have aria-label
Focus rings use outline: 2px solid #4E2A84
Color contrast: all text on purple backgrounds is white; gold accent only used for decorative underlines, never as sole indicator
Modal traps focus while open
