# BrightSteps — Front End

Vue 3 and Vite frontend for the CST3144 after-school classes coursework.

## Features

- Ten class cards with subject, location, price, remaining spaces, and an activity image when provided by the API (with an icon fallback).
- Search across class names, subjects, and locations, with backend filters for minimum/maximum price and availability when the API is configured.
- Browse the teacher directory and open each teacher’s associated classes.
- Filter out fully booked classes and combine filters with sorting.
- Sort by subject, location, price, or spaces in ascending and descending order.
- Add one space to the bag or remove one and return that space to the catalogue.
- Checkout form with letters-and-spaces name validation and digits-only phone validation.
- Promise-based `fetch` calls, grouped in `src/services/api.js`, for lessons, backend search, teachers, orders, and availability updates.
- Responsive layout with a keyboard-operable mobile menu, visible feedback, keyboard focus states, and reduced-motion support.

## Run locally in VS Code

Use Node.js 24.12 or newer, then open the integrated terminal in this folder:

```sh
npm install
```

Copy `.env.example` to `.env.local`, set `VITE_API_URL` to the local Express API, then start Vite:

```sh
npm run dev
```

Restart the Vite server after changing `.env.local`. Do not commit `.env.local` or API credentials.

## Frontend API contract

The page uses reusable `SiteHeader`, `CatalogControls`, `LessonCard`, and `CartView` components. The header includes a mobile navigation menu. API requests and backend image URL resolution live in `src/services/api.js`.

- `GET /lessons` loads the live catalogue. Preview records remain available if the API cannot be reached. Lesson `image` paths are resolved against the API so the Express service can serve the coursework images.
- `GET /lessons/search` receives the text, price, and availability filters. Sorting stays in the frontend so all four sort options remain immediate.
- `GET /teachers` loads teacher cards, and `GET /teachers/:id/lessons` loads the selected teacher’s classes.
- `POST /orders` submits the customer name, phone number, and a lesson ID for each reserved space.
- `PUT /lessons/:id` updates the remaining `spaces` value once for each selected lesson.

If the API cannot be reached, the frontend continues to show preview lessons and teachers, with a visible status message.

## GitHub Pages

The frontend is in its own repository, `cst3144-frontend`. The workflow in `.github/workflows/deploy.yml` runs on pushes to `main`, installs from the lockfile, builds the Vue app, and deploys `dist` to GitHub Pages. Set the repository Actions variable `VITE_API_URL` to the deployed Express service URL to enable the live API.

`node_modules/`, build output, and local environment files are excluded by `.gitignore`.

