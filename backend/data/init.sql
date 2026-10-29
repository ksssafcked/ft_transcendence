-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT COLLATE NOCASE UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    hue INTEGER NOT NULL,
    avatarUrl TEXT NOT NULL DEFAULT '/public/avatars/avatar_1.png'
);

-- Matches
CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    player1_id TEXT,
    player2_id TEXT,
    status TEXT CHECK(status IN ('waiting', 'playing', 'finished', 'abandoned')) DEFAULT 'waiting',
    score1 INTEGER,
    score2 INTEGER,
    winner_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player1_id) REFERENCES users(id),
    FOREIGN KEY(player2_id) REFERENCES users(id),
    FOREIGN KEY(winner_id) REFERENCES users(id)
);

-- Friends
CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    friend_id TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(friend_id) REFERENCES users(id)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    user_id TEXT,
    label VARCHAR(16) NOT NULL,
    date DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    PRIMARY KEY (user_id, label)
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('private', 'public', 'channel', 'group')) DEFAULT 'private',
    name TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Members
CREATE TABLE IF NOT EXISTS conversation_members (
    id TEXT PRIMARY KEY ,
    conversation_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK(type IN ('message', 'invite', 'image', 'file', 'system')) DEFAULT 'message',
    read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS blocks (
    id TEXT PRIMARY KEY,
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

INSERT INTO conversations (id, type, name)
VALUES (
    'game_broadcast',
    'public',
    'Salon des parties'
);