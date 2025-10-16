# Chat App - Real-Time Two-Person Messaging

A beautiful, modern web chat application built with Flask and Socket.IO for real-time two-person communication.

## Features

- 💬 Real-time messaging with WebSockets
- 🔐 User authentication (signup/login)
- 🟢 Online/offline status indicators
- ⌨️ Typing indicators
- 💾 Message history persistence
- 🎨 Modern, responsive UI with gradient design
- 📱 Mobile-friendly interface

## Tech Stack

- **Backend**: Flask, Flask-SocketIO, Flask-Login, Flask-SQLAlchemy
- **Frontend**: Vanilla JavaScript, Socket.IO Client
- **Database**: SQLite (local) / PostgreSQL (production)
- **Styling**: Custom CSS with modern design

## Local Development

### Prerequisites

- Python 3.8+
- pip

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd chat-app
```

2. Install dependencies
```bash
pip install -r requirements.txt
```

3. Run the application
```bash
python app.py
```

4. Open your browser and go to `http://localhost:5000`

### Testing Two-Person Chat

- Open the app in two different browsers or use an incognito/private window
- Create two different user accounts
- Start chatting!

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect the `render.yaml` file
4. Click "Apply" to deploy

### Option 2: Manual Setup

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 app:app`
4. Add Environment Variables:
   - `SECRET_KEY`: (generate a random secret key)
   - `DATABASE_URL`: (use Render PostgreSQL add-on)
5. Deploy!

## Environment Variables

- `SECRET_KEY`: Secret key for Flask sessions (required in production)
- `DATABASE_URL`: Database connection string (automatically set by Render)
- `PORT`: Port number (automatically set by Render)

## Project Structure

```
chat-app/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── render.yaml           # Render deployment config
├── templates/            # HTML templates
│   ├── base.html
│   ├── login.html
│   ├── signup.html
│   └── chat.html
├── static/
│   ├── css/
│   │   └── style.css    # Styling
│   └── js/
│       └── chat.js      # Real-time chat functionality
└── README.md
```

## Usage

1. **Sign Up**: Create a new account with a username and password
2. **Log In**: Enter your credentials
3. **Select User**: Click on a user in the sidebar to start chatting
4. **Send Messages**: Type and press Enter or click the send button
5. **Real-Time Updates**: See online status and typing indicators in real-time

## License

MIT License - feel free to use this project for learning or personal use.

