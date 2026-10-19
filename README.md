# Mini Applicant Tracking System (ATS)

A full-stack Mini Applicant Tracking System built to manage candidates through different stages of the recruitment process.

## Features

- Add candidates
- View all candidates
- Edit candidate information
- Delete candidates
- Search candidates
- Filter candidates by hiring stage
- Update hiring stages
- Dashboard recruitment metrics
- MongoDB database integration
- REST API based backend

## Hiring Stages

- Applied
- Screening
- Interview
- Selected
- Rejected

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask
- REST APIs

### Database
- MongoDB Atlas
- PyMongo

## REST API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/candidates` | Get all candidates |
| POST | `/api/candidates` | Add a candidate |
| GET | `/api/candidates/<id>` | Get a candidate |
| PUT | `/api/candidates/<id>` | Update a candidate |
| DELETE | `/api/candidates/<id>` | Delete a candidate |
| GET | `/api/candidates/search?q=` | Search candidates |
| GET | `/api/dashboard` | Get dashboard metrics |

## Project Structure

```text
mini-ats/
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── templates/
│   └── index.html
├── app.py
├── requirements.txt
├── .gitignore
└── README.md