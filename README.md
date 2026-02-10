# ClassFlow Backend 

This project is the backend service for an intelligent academic planner application. It manages user data, events, timetables, and leverages Google's Generative AI to create personalized study plans.

## 🚀 Features

*   **User Management**: Authentication and user profile handling.
*   **Event Management**: Create, read, update, and delete academic events.
*   **Timetable Integration**: Manage class schedules and study blocks.
*   **Intelligent Planning**: AI-powered generation of personalized study schedules using Google Gemini Pro.
*   **Category Management**: Organize tasks and events into categories.

## 🛠️ Technology Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB with Mongoose ODM
*   **AI Integration**: Google Generative AI (`@google/generative-ai`)
*   **Authentication**: JWT (JSON Web Tokens)
*   **Testing**: Jest and Supertest

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory (or copy `.env.example` if available) and add the following variables:

    ```env
    MONGO_URI=<your_mongodb_connection_string>
    GEMINI_API_KEY=<your_google_gemini_api_key>
    JWT_SECRET=<your_jwt_secret_key>
    PORT=5000 (Optional, defaults to 5000 in server.js)
    ```

## ▶️ Usage

### Start the Server

To start the server in development mode:

```bash
node src/server.js
```

The server will start on port **5000** (or the port defined in your configuration).

### API Endpoints

The API is structured around the following resources:

*   `/api/users` - User authentication and management
*   `/api/events` - Event CRUD operations
*   `/api/timetable` - Timetable management
*   `/api/categories` - Category management
*   `/api/intelligent` - AI-powered features (e.g., generate study plan)

## 🧪 Running Tests

To run the test suite:

```bash
npm test
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## License

[MIT](https://choosealicense.com/licenses/mit/)