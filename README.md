# BikeFix - Bicycle Repair Marketplace

BikeFix is a mobile-first bicycle repair marketplace that connects users with local bicycle repair services. This project is built using FastAPI for the backend, providing a RESTful API for managing bicycle listings, repair requests, and user accounts.

## Project Structure

```
BikeFix
├── backend
│   ├── app
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api
│   │   │   ├── __init__.py
│   │   │   ├── routers
│   │   │   │   ├── __init__.py
│   │   │   │   ├── listings.py
│   │   │   │   ├── repairs.py
│   │   │   │   └── users.py
│   │   ├── core
│   │   │   ├── __init__.py
│   │   │   └── config.py
│   │   ├── models
│   │   │   ├── __init__.py
│   │   │   └── schemas.py
│   │   ├── services
│   │   │   ├── __init__.py
│   │   │   └── marketplace.py
│   │   └── tests
│   │       ├── __init__.py
│   │       └── test_main.py
│   ├── requirements.txt
│   └── Dockerfile
├── README.md
```

## Features

- **Bicycle Listings**: Users can create, read, update, and delete bicycle listings.
- **Repair Requests**: Users can submit repair requests and track their status.
- **User Management**: Users can register, log in, and manage their profiles.

## Getting Started

### Prerequisites

- Python 3.9 or higher
- Docker (optional, for containerization)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd BikeFix/backend
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

### Running the Application

To run the FastAPI application, use the following command:
```
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker

To build and run the application using Docker, execute the following commands:
```
docker build -t bikefix .
docker run -d -p 80:80 bikefix
```

## API Endpoints

- `GET /`: Welcome message
- `GET /listings`: Retrieve a list of bike listings
- `GET /repairs`: Retrieve a list of repair requests
- `GET /users`: Retrieve a list of users

## License

This project is licensed under the MIT License. See the LICENSE file for details.