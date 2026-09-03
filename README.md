# Alcheris — public coursework edition

This repository is the deliberately small public version of Alcheris for a coursework submission. It retains the actual lesson-maker experience: authentication, a course catalogue, course and lesson management, page-based editor, and learner player.

Only these public block types are available: text/headings, image, video, multiple choice, true/false, and short-answer practice. Community, templates, block patterns, analytics, notebooks, mobile learning beats, AI and advanced block systems are intentionally excluded.

## Run locally

Start the Django API on `127.0.0.1:8000`:

```powershell
./.venv/Scripts/python.exe backend/manage.py migrate
./.venv/Scripts/python.exe backend/manage.py runserver 127.0.0.1:8000
```

In another terminal, start the frontend on `localhost:5173`:

```powershell
cd frontend
npm ci
npm run dev
```

Then open `http://localhost:5173`.

## Verification

```powershell
./.venv/Scripts/python.exe backend/manage.py test core
cd frontend; npm run build; npm run lint
```
