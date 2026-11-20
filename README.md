# BrightSteps — Front End

Vue 3 and Vite frontend for the CST3144 after-school classes coursework.

## Features

- Ten class cards with subject, location, price, remaining spaces, and an activity image when provided by the API (with an icon fallback).
- Search across class names, subjects, and locations.
- Sort by subject, location, price, or spaces in ascending and descending order.
- Add one space to the bag or remove one and return that space to the catalogue.
- Checkout form with letters-and-spaces name validation and digits-only phone validation.
- Promise-based `fetch` calls, grouped in `src/services/api.js`, for lessons, orders, and availability updates.
- Responsive layout, visible feedback, keyboard focus states, and reduced-motion support.

Advanced search remains a backend feature and is not called from this frontend.

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

The page uses reusable `CatalogControls` and `LessonCard` components. API requests and backend image URL resolution live in `src/services/api.js`.

- `GET /lessons` loads the live catalogue. Preview records remain available if the API cannot be reached. Lesson `image` paths are resolved against the API so the Express service can serve the coursework images.
- `POST /orders` submits the customer name, phone number, and a lesson ID for each reserved space.
- `PUT /lessons/:id` updates the remaining `spaces` value once for each selected lesson.

The Express service must allow requests from the deployed GitHub Pages origin. Align request fields and response shapes with the backend before final integration.

## GitHub Pages

The frontend is intended for its own repository, `cst3144-frontend`. A GitHub Actions workflow will build and publish the Vite output after repository setup.

`node_modules/`, build output, and local environment files are excluded by `.gitignore`.
