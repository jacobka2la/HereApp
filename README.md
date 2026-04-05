# Here

Here is a mobile-first React + Firebase life tracker for East Lansing. It is built to run on Vercel and feel like an actual app on a phone.

## What is included

- Email/password auth with unique usernames
- MSU-only bar list
- Hottest bar card on the home page
- Real-time check-ins
- Real-time vibe updates
- Cover range reporting
- Username-only comments with reactions
- Daily 4AM reset function example
- Firestore rules starter file
- Clean dark UI with subtle motion

## Stack

- React + Vite
- Firebase Auth
- Firestore
- Framer Motion
- Recharts
- Vercel-ready routing

## Run locally

```bash
npm install
npm run dev
```

## Firebase setup

1. Create a Firebase project.
2. Enable **Authentication > Email/Password**.
3. Create a **Firestore Database**.
4. In Firestore, create indexes if Firebase asks you to. The comments query may prompt an index on `barId + dayKey + createdAt`.
5. Publish the rules from `firestore.rules`.

## Collections used

- `bars`
- `users`
- `usernames`
- `checkins`
- `activeCheckins`
- `vibes`
- `coverReports`
- `comments`
- `commentReactions`

## Username rules

Allowed characters:
- lowercase letters
- numbers
- underscores

## Rate limits in the UI

- vibe change: 5 minutes
- cover update: 10 minutes
- comments: 60 seconds
- one active check-in at a time

## Hottest bar formula

The home page ranks bars using a live score based on:
- active check-ins
- fresh vibe votes
- comment reactions
- comment activity

## 4AM reset

The frontend reads data using a day key that flips at 4AM Eastern, so the app naturally moves to a new night. The included Firebase function shows how to hard reset the live collections at 4AM too.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repo into Vercel.
3. Deploy.
4. Make sure the root `vercel.json` file stays in place so routes work.
