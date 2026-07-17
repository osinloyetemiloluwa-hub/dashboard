# TECO Bot Dashboard - Setup Guide

## Overview

This project connects your TECO Bot dashboard to real Discord guild data, replacing fake data with live statistics.

## Prerequisites

- Node.js 16.11.0 or higher
- A Discord Bot Token
- Your Guild/Server ID

---

## Step 1: Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Go to the **"Bot"** section in the left sidebar
4. Click **"Reset Token"** to get your bot token
5. **IMPORTANT**: Copy and save your bot token securely (you won't see it again!)
6. Under **"Privileged Gateway Intents"**, enable:
   - ✅ **SERVER MEMBERS INTENT**
   - ✅ **PRESENCE INTENT**

## Step 2: Add Bot to Your Server

1. Go to the **"OAuth2"** > **"URL Generator"** section
2. Check these scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. In **"Bot Permissions"**, check:
   - ✅ View Server Insights
   - ✅ View Channels
   - ✅ Read Message History
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

## Step 3: Get Your Server ID

1. Open Discord
2. Go to **User Settings** > **Advanced** > Enable **Developer Mode**
3. Right-click on your server name
4. Click **"Copy Server ID"**

## Step 4: Configure the Backend

1. Open `config.js` (or edit `server.js` directly):

```javascript
const CONFIG = {
    // Paste your bot token from Step 1
    DISCORD_TOKEN: 'MTIz456...your-token-here',

    // Paste your server ID from Step 3
    GUILD_ID: '123456789012345678',

    PORT: 3000
};
```

## Step 5: Install and Run

```bash
# Navigate to the backend folder
cd TECO-Bot-Backend

# Install dependencies
npm install

# Start the server
npm start
```

You should see:
```
🚀 TECO Bot Backend Server Started!
   API Endpoints:
   • GET  /api/status   - Bot connection status
   • GET  /api/guild    - Full guild information
   • GET  /api/members  - Member statistics
   ...
```

## Step 6: Update Dashboard API URL

In your dashboard's `index.html`, update the API URL:

```javascript
// For local development:
const API_BASE_URL = 'http://localhost:3000';

// For production (after deploying backend):
const API_BASE_URL = 'https://your-backend-url.com';
```

## Step 7: Open the Dashboard

Open `index.html` in your browser or serve it with any static server.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Bot connection status, ping, uptime |
| `/api/guild` | GET | Full guild information |
| `/api/members` | GET | Member statistics breakdown |
| `/api/roles` | GET | Top roles distribution |
| `/api/channels` | GET | Channel statistics |
| `/api/refresh` | POST | Force data refresh |
| `/api/health` | GET | Server health check |

---

## Example API Response

```json
{
  "name": "Elite Circle",
  "id": "123456789012345678",
  "memberBreakdown": {
    "total": 5420,
    "online": 312,
    "offline": 5108,
    "bots": 45,
    "humans": 5375
  },
  "channels": {
    "text": 28,
    "voice": 12,
    "categories": 8,
    "total": 48
  },
  "boost": {
    "level": 2,
    "count": 15
  }
}
```

---

## Deploying the Backend

### Option 1: Railway (Recommended)
1. Create account at [railway.app](https://railway.app)
2. New Project > Deploy from GitHub
3. Connect your repo with the backend code
4. Add environment variables:
   - `DISCORD_TOKEN` = your bot token
   - `GUILD_ID` = your server ID
5. Deploy!

### Option 2: Render
1. Create account at [render.com](https://render.com)
2. New > Blueprint
3. Connect your repo
4. Add environment variables
5. Deploy!

### Option 3: VPS/Server
```bash
# SSH into your server
ssh user@your-server

# Clone your repo
git clone https://github.com/your-repo.git
cd your-repo/TECO-Bot-Backend

# Install and run with PM2
npm install
npm install -g pm2
pm2 start server.js --name teco-bot
pm2 save
pm2 startup
```

---

## Troubleshooting

### Bot shows "Disconnected"
- Check your bot token is correct
- Make sure the bot is in your server
- Enable **SERVER MEMBERS INTENT** and **PRESENCE INTENT**

### CORS Error in browser
- Make sure the backend is running
- Check the `API_BASE_URL` matches your backend URL

### "Guild not found"
- Double-check your `GUILD_ID`
- Make sure the bot has access to the server

### Member count is 0
- The bot needs **SERVER MEMBERS INTENT** enabled
- Try kicking and re-adding the bot

---

## Security Notes

- **NEVER** commit your `config.js` or `server.js` with real tokens to GitHub
- Use environment variables for production
- Keep your bot token secret - anyone with it can control your bot

---

## Files Included

```
TECO-Bot-Backend/
├── package.json       # Dependencies
├── server.js         # Main backend server
├── config.example.js # Configuration template
└── README.md         # This file

TECO-Bot-Dashboard/
└── index.html        # Frontend dashboard
```

---

## Support

If you need help:
1. Check the Discord bot has the right permissions
2. Verify the bot token is valid
3. Make sure the bot is in the server
4. Check the console for error messages
