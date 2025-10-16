from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///chat.db")

# Fix for Render PostgreSQL URLs
if app.config["SQLALCHEMY_DATABASE_URI"].startswith("postgres://"):
    app.config["SQLALCHEMY_DATABASE_URI"] = app.config["SQLALCHEMY_DATABASE_URI"].replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

# Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_online = db.Column(db.Boolean, default=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    
    sender = db.relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = db.relationship("User", foreign_keys=[receiver_id], backref="received_messages")

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Routes
@app.route("/")
def index():
    if current_user.is_authenticated:
        return redirect(url_for("chat"))
    return redirect(url_for("login"))

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if current_user.is_authenticated:
        return redirect(url_for("chat"))
    
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        if User.query.filter_by(username=username).first():
            return render_template("signup.html", error="Username already exists")
        
        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        return redirect(url_for("chat"))
    
    return render_template("signup.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("chat"))
    
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for("chat"))
        
        return render_template("login.html", error="Invalid username or password")
    
    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    current_user.is_online = False
    db.session.commit()
    logout_user()
    return redirect(url_for("login"))

@app.route("/chat")
@login_required
def chat():
    users = User.query.filter(User.id != current_user.id).all()
    return render_template("chat.html", users=users, current_user=current_user)

@app.route("/api/users")
@login_required
def get_users():
    users = User.query.filter(User.id != current_user.id).all()
    return jsonify([{
        "id": user.id,
        "username": user.username,
        "is_online": user.is_online
    } for user in users])

@app.route("/api/messages/<int:user_id>")
@login_required
def get_messages(user_id):
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()
    
    # Mark messages as read
    unread_messages = Message.query.filter_by(
        sender_id=user_id,
        receiver_id=current_user.id,
        is_read=False
    ).all()
    for msg in unread_messages:
        msg.is_read = True
    db.session.commit()
    
    return jsonify([{
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "timestamp": msg.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "is_read": msg.is_read
    } for msg in messages])

# Socket.IO events
@socketio.on("connect")
def handle_connect():
    if current_user.is_authenticated:
        current_user.is_online = True
        db.session.commit()
        emit("user_status", {
            "user_id": current_user.id,
            "username": current_user.username,
            "is_online": True
        }, broadcast=True)

@socketio.on("disconnect")
def handle_disconnect():
    if current_user.is_authenticated:
        current_user.is_online = False
        db.session.commit()
        emit("user_status", {
            "user_id": current_user.id,
            "username": current_user.username,
            "is_online": False
        }, broadcast=True)

@socketio.on("send_message")
def handle_message(data):
    if not current_user.is_authenticated:
        return
    
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    
    if not receiver_id or not content:
        return
    
    message = Message(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=content
    )
    db.session.add(message)
    db.session.commit()
    
    message_data = {
        "id": message.id,
        "sender_id": message.sender_id,
        "receiver_id": message.receiver_id,
        "content": message.content,
        "timestamp": message.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "sender_username": current_user.username
    }
    
    emit("new_message", message_data, broadcast=True)

@socketio.on("typing")
def handle_typing(data):
    if not current_user.is_authenticated:
        return
    
    emit("user_typing", {
        "user_id": current_user.id,
        "username": current_user.username,
        "receiver_id": data.get("receiver_id"),
        "is_typing": data.get("is_typing", False)
    }, broadcast=True)

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
