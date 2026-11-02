"""Tests for the AI recommendation service.  Run: python -m pytest ML/service"""
from fastapi.testclient import TestClient

from app import app

client = TestClient(app)


def car(id, category="Sedan", brand="Toyota", model="Corolla", fuel="petrol", transmission="automatic",
        seats=5, rate=1200, year=2022, branch=1):
    return {"id": id, "brand": brand, "model": model, "year": year, "category": category, "fuel_type": fuel,
            "transmission": transmission, "seats": seats, "daily_rate": rate, "branch_id": branch}


FLEET = [
    car(1, "Economy", "Hyundai", "Accent", rate=850),
    car(2, "Sedan", "Toyota", "Corolla", rate=1200),
    car(3, "SUV", "Kia", "Sportage", fuel="hybrid", rate=1900, year=2023),
    car(4, "SUV", "Hyundai", "Tucson", rate=1800, transmission="manual"),
    car(5, "Luxury", "BMW", "5 Series", rate=3500, year=2024),
    car(6, "Luxury", "Tesla", "Model 3", fuel="electric", rate=3000, year=2023),
    car(7, "SUV", "Nissan", "X-Trail", rate=1600, seats=7),
]


def rank(prefs, limit=6, cars=FLEET):
    response = client.post("/rank", json={"preferences": prefs, "cars": cars, "limit": limit})
    assert response.status_code == 200, response.text
    return response.json()


def test_health():
    body = client.get("/health").json()
    assert body["status"] == "ok" and 0 <= body["alpha"] <= 1


def test_category_and_budget_are_respected():
    ranking = rank({"category": "SUV", "budget": 1850})["ranking"]
    ids = [r["id"] for r in ranking]
    assert set(ids) == {4, 7}  # the only SUVs within budget
    assert all("Within your budget" in " ".join(r["reasons"]) for r in ranking)


def test_constraints_relax_with_a_note_instead_of_returning_nothing():
    ranking = rank({"category": "SUV", "budget": 500})["ranking"]
    assert ranking, "should fall back to alternatives"
    assert "relax" in ranking[0]["reasons"][0].lower() or "no " in ranking[0]["reasons"][0].lower()


def test_seats_and_transmission():
    ranking = rank({"seats": 7, "transmission": "automatic"})["ranking"]
    assert ranking[0]["id"] == 7


def test_scores_are_sorted_and_bounded():
    ranking = rank({"budget": 2000}, limit=7)["ranking"]
    scores = [r["score"] for r in ranking]
    assert scores == sorted(scores, reverse=True)
    assert all(0 <= s <= 1 for s in scores)


def test_empty_preferences_and_empty_fleet():
    assert len(rank({}, limit=3)["ranking"]) == 3
    assert rank({}, cars=[])["ranking"] == []


def test_invalid_input_is_rejected():
    assert client.post("/rank", json={"cars": [{"id": 1}]}).status_code == 422
    assert client.post("/rank", json={"preferences": {"fuel_type": "coal"}, "cars": FLEET}).status_code == 422
