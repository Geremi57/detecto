from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_get_history_returns_records():
    response = client.get("/history")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_history_accepts_pagination():
    response = client.get("/history?limit=10&offset=0")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_history_rejects_invalid_limit():
    response = client.get("/history?limit=0")

    assert response.status_code == 422


def test_get_history_rejects_large_limit():
    response = client.get("/history?limit=101")

    assert response.status_code == 422