from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os
import re


# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

app = Flask(__name__)


# ==========================================
# MONGODB CONNECTION
# ==========================================

mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise ValueError("MONGO_URI is missing from the .env file")

client = MongoClient(mongo_uri)

db = client["mini_ats"]

candidates_collection = db["candidates"]


# ==========================================
# VALID HIRING STAGES
# ==========================================

VALID_STAGES = [
    "Applied",
    "Screening",
    "Interview",
    "Selected",
    "Rejected"
]


# ==========================================
# HOME PAGE
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


# ==========================================
# TEST DATABASE CONNECTION
# ==========================================

@app.route("/test-db")
def test_db():

    try:

        client.admin.command("ping")

        return jsonify({
            "message": "MongoDB connected successfully!"
        }), 200

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500


# ==========================================
# CREATE CANDIDATE
# POST /api/candidates
# ==========================================

@app.route("/api/candidates", methods=["POST"])
def add_candidate():

    data = request.get_json(silent=True)

    if not data:

        return jsonify({
            "error": "Candidate data is required"
        }), 400


    # Get and clean required fields

    name = str(data.get("name", "")).strip()

    email = str(data.get("email", "")).strip().lower()


    if not name or not email:

        return jsonify({
            "error": "Name and email are required"
        }), 400


    # Basic email validation

    email_pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"

    if not re.match(email_pattern, email):

        return jsonify({
            "error": "Please enter a valid email address"
        }), 400


    # Prevent duplicate email

    existing_candidate = candidates_collection.find_one({
        "email": email
    })

    if existing_candidate:

        return jsonify({
            "error": "A candidate with this email already exists"
        }), 409


    # Validate hiring stage

    stage = data.get("stage", "Applied")

    if stage not in VALID_STAGES:

        return jsonify({
            "error": "Invalid hiring stage"
        }), 400


    # Validate experience

    try:

        experience = int(data.get("experience", 0))

        if experience < 0:
            raise ValueError

    except (ValueError, TypeError):

        return jsonify({
            "error": "Experience must be a positive number"
        }), 400


    # Clean skills

    skills = data.get("skills", [])

    if not isinstance(skills, list):
        skills = []


    candidate = {

        "name": name,

        "email": email,

        "phone": str(
            data.get("phone", "")
        ).strip(),

        "role": str(
            data.get("role", "")
        ).strip(),

        "skills": skills,

        "experience": experience,

        "stage": stage
    }


    result = candidates_collection.insert_one(
        candidate
    )


    return jsonify({

        "message":
            "Candidate added successfully",

        "id":
            str(result.inserted_id)

    }), 201


# ==========================================
# GET ALL CANDIDATES
# GET /api/candidates
# ==========================================

@app.route("/api/candidates", methods=["GET"])
def get_candidates():

    candidates = []


    for candidate in candidates_collection.find():

        candidate["_id"] = str(
            candidate["_id"]
        )

        candidates.append(candidate)


    return jsonify(candidates), 200


# ==========================================
# GET ONE CANDIDATE
# GET /api/candidates/<id>
# ==========================================

@app.route(
    "/api/candidates/<candidate_id>",
    methods=["GET"]
)
def get_candidate(candidate_id):

    try:

        candidate = candidates_collection.find_one({
            "_id": ObjectId(candidate_id)
        })

    except Exception:

        return jsonify({
            "error": "Invalid candidate ID"
        }), 400


    if not candidate:

        return jsonify({
            "error": "Candidate not found"
        }), 404


    candidate["_id"] = str(
        candidate["_id"]
    )


    return jsonify(candidate), 200


# ==========================================
# UPDATE CANDIDATE
# PUT /api/candidates/<id>
# ==========================================

@app.route(
    "/api/candidates/<candidate_id>",
    methods=["PUT"]
)
def update_candidate(candidate_id):

    data = request.get_json(silent=True)


    if not data:

        return jsonify({
            "error": "Update data is required"
        }), 400


    # Never allow MongoDB _id to be changed

    data.pop("_id", None)


    # Validate stage if it is being changed

    if "stage" in data:

        if data["stage"] not in VALID_STAGES:

            return jsonify({
                "error": "Invalid hiring stage"
            }), 400


    # Validate email if it is being changed

    if "email" in data:

        email = str(
            data["email"]
        ).strip().lower()

        email_pattern = (
            r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        )

        if not re.match(
            email_pattern,
            email
        ):

            return jsonify({
                "error":
                    "Please enter a valid email address"
            }), 400


        try:

            duplicate = candidates_collection.find_one({

                "email": email,

                "_id": {
                    "$ne": ObjectId(candidate_id)
                }

            })

        except Exception:

            return jsonify({
                "error": "Invalid candidate ID"
            }), 400


        if duplicate:

            return jsonify({
                "error":
                    "A candidate with this email already exists"
            }), 409


        data["email"] = email


    # Validate experience if supplied

    if "experience" in data:

        try:

            experience = int(
                data["experience"]
            )

            if experience < 0:
                raise ValueError

            data["experience"] = experience

        except (ValueError, TypeError):

            return jsonify({
                "error":
                    "Experience must be a positive number"
            }), 400


    try:

        result = candidates_collection.update_one(

            {
                "_id":
                    ObjectId(candidate_id)
            },

            {
                "$set": data
            }

        )

    except Exception:

        return jsonify({
            "error": "Invalid candidate ID"
        }), 400


    if result.matched_count == 0:

        return jsonify({
            "error": "Candidate not found"
        }), 404


    return jsonify({
        "message":
            "Candidate updated successfully"
    }), 200


# ==========================================
# DELETE CANDIDATE
# DELETE /api/candidates/<id>
# ==========================================

@app.route(
    "/api/candidates/<candidate_id>",
    methods=["DELETE"]
)
def delete_candidate(candidate_id):

    try:

        result = candidates_collection.delete_one({

            "_id":
                ObjectId(candidate_id)

        })

    except Exception:

        return jsonify({
            "error": "Invalid candidate ID"
        }), 400


    if result.deleted_count == 0:

        return jsonify({
            "error": "Candidate not found"
        }), 404


    return jsonify({
        "message":
            "Candidate deleted successfully"
    }), 200


# ==========================================
# DASHBOARD METRICS
# GET /api/dashboard
# ==========================================

@app.route(
    "/api/dashboard",
    methods=["GET"]
)
def dashboard_metrics():

    total = candidates_collection.count_documents(
        {}
    )

    applied = candidates_collection.count_documents({
        "stage": "Applied"
    })

    screening = candidates_collection.count_documents({
        "stage": "Screening"
    })

    interview = candidates_collection.count_documents({
        "stage": "Interview"
    })

    selected = candidates_collection.count_documents({
        "stage": "Selected"
    })

    rejected = candidates_collection.count_documents({
        "stage": "Rejected"
    })


    return jsonify({

        "total": total,

        "applied": applied,

        "screening": screening,

        "interview": interview,

        "selected": selected,

        "rejected": rejected

    }), 200


# ==========================================
# SEARCH CANDIDATES
# GET /api/candidates/search?q=Rahul
# ==========================================

@app.route(
    "/api/candidates/search",
    methods=["GET"]
)
def search_candidates():

    query = request.args.get(
        "q",
        ""
    ).strip()


    if not query:

        return jsonify([]), 200


    # Escape special regex characters
    safe_query = re.escape(query)


    cursor = candidates_collection.find({

        "$or": [

            {
                "name": {
                    "$regex": safe_query,
                    "$options": "i"
                }
            },

            {
                "email": {
                    "$regex": safe_query,
                    "$options": "i"
                }
            },

            {
                "role": {
                    "$regex": safe_query,
                    "$options": "i"
                }
            },

            {
                "skills": {
                    "$regex": safe_query,
                    "$options": "i"
                }
            }

        ]

    })


    results = []


    for candidate in cursor:

        candidate["_id"] = str(
            candidate["_id"]
        )

        results.append(candidate)


    return jsonify(results), 200


# ==========================================
# RUN APPLICATION
# ==========================================

if __name__ == "__main__":

    app.run(debug=True)