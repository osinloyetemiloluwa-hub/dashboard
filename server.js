/**
 * TECO Bot Backend Server
 * Fetches real Discord guild data for the dashboard
 */

const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const express = require('express');
const cors = require('cors');

// ============================================
// CONFIGURATION - SET YOUR VALUES HERE
// ============================================

const CONFIG = {
    // Your Discord Bot Token (keep this secret!)
    DISCORD_TOKEN: 'YOUR_BOT_TOKEN_HERE',

    // Your Guild/Server ID
    GUILD_ID: 'YOUR_GUILD_ID_HERE',

    // Channel IDs for specific stats (optional)
    CHANNEL_IDS: {
        totalMembers: 'MEMBER_COUNT_CHANNEL_ID',
        onlineMembers: 'ONLINE_COUNT_CHANNEL_ID'
    },

    // Port for the API server
    PORT: 3000
};

// ============================================
// DISCORD BOT SETUP
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

// Store cached data
let cachedData = {
    guildInfo: null,
    lastUpdated: null
};

// Bot ready event
client.once('ready', async () => {
    console.log(`✅ Bot logged in as ${client.user.tag}`);

    // Set bot status
    client.user.setActivity('TECO Analytics Dashboard', { type: ActivityType.Watching });

    // Fetch initial data
    await refreshData();
});

// Error handling
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

async function refreshData() {
    try {
        const guild = client.guilds.cache.get(CONFIG.GUILD_ID);

        if (!guild) {
            console.log('Guild not found. Make sure the bot is in the server.');
            return;
        }

        // Fetch members if not already fetched
        if (guild.memberCount && guild.members.cache.size < guild.memberCount) {
            await guild.members.fetch();
        }

        // Calculate online members
        const members = guild.members.cache;
        const onlineMembers = members.filter(m => m.presence?.status !== 'offline').size;
        const totalMembers = guild.memberCount;

        // Get member breakdown
        const memberBreakdown = {
            total: totalMembers,
            online: onlineMembers,
            offline: totalMembers - onlineMembers,
            bots: members.filter(m => m.user.bot).size,
            humans: members.filter(m => !m.user.bot).size
        };

        // Get role distribution (top 10 roles)
        const roleDistribution = [];
        const roleCounts = {};

        members.forEach(member => {
            member.roles.cache.forEach(role => {
                if (role.name !== '@everyone') {
                    roleCounts[role.name] = (roleCounts[role.name] || 0) + 1;
                }
            });
        });

        // Sort by count and take top 10
        Object.entries(roleCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([name, count]) => {
                roleDistribution.push({ name, count });
            });

        // Get channel info
        const channels = {
            text: guild.channels.cache.filter(c => c.type === 0).size,
            voice: guild.channels.cache.filter(c => c.type === 2).size,
            categories: guild.channels.cache.filter(c => c.type === 4).size,
            total: guild.channels.cache.size
        };

        // Get emoji count
        const emojis = guild.emojis.cache.size;

        // Update cached data
        cachedData = {
            guildInfo: {
                name: guild.name,
                id: guild.id,
                icon: guild.iconURL({ dynamic: true, size: 512 }),
                banner: guild.bannerURL({ size: 512 }),
                description: guild.description,
                createdAt: guild.createdAt,
                owner: {
                    id: guild.ownerId,
                    name: guild.members.cache.get(guild.ownerId)?.user.username || 'Unknown'
                },
                memberBreakdown,
                roleDistribution,
                channels,
                emojis,
                boost: {
                    level: guild.premiumTier,
                    count: guild.premiumSubscriptionCount || 0
                }
            },
            lastUpdated: new Date().toISOString()
        };

        console.log(`📊 Data refreshed: ${onlineMembers} online / ${totalMembers} total members`);

    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

// Auto-refresh data every 60 seconds
setInterval(refreshData, 60000);

// ============================================
// EXPRESS SERVER
// ============================================

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// API ENDPOINTS
// ============================================

/**
 * GET /api/status
 * Check if the bot is connected
 */
app.get('/api/status', (req, res) => {
    res.json({
        status: client.ws.status === 0 ? 'connected' : 'disconnected',
        ping: client.ws.ping,
        uptime: client.uptime,
        lastUpdated: cachedData.lastUpdated
    });
});

/**
 * GET /api/guild
 * Get full guild information
 */
app.get('/api/guild', async (req, res) => {
    if (!cachedData.guildInfo) {
        // Try to refresh data
        await refreshData();

        if (!cachedData.guildInfo) {
            return res.status(503).json({
                error: 'Guild data not available. Make sure the bot is connected and in the server.'
            });
        }
    }

    res.json(cachedData.guildInfo);
});

/**
 * GET /api/members
 * Get member statistics
 */
app.get('/api/members', async (req, res) => {
    if (!cachedData.guildInfo) {
        await refreshData();
    }

    if (!cachedData.guildInfo) {
        return res.status(503).json({ error: 'Data not available' });
    }

    res.json(cachedData.guildInfo.memberBreakdown);
});

/**
 * GET /api/roles
 * Get role distribution
 */
app.get('/api/roles', async (req, res) => {
    if (!cachedData.guildInfo) {
        await refreshData();
    }

    if (!cachedData.guildInfo) {
        return res.status(503).json({ error: 'Data not available' });
    }

    res.json(cachedData.guildInfo.roleDistribution);
});

/**
 * GET /api/channels
 * Get channel statistics
 */
app.get('/api/channels', async (req, res) => {
    if (!cachedData.guildInfo) {
        await refreshData();
    }

    if (!cachedData.guildInfo) {
        return res.status(503).json({ error: 'Data not available' });
    }

    res.json(cachedData.guildInfo.channels);
});

/**
 * POST /api/refresh
 * Force refresh the data
 */
app.post('/api/refresh', async (req, res) => {
    await refreshData();
    res.json({ success: true, lastUpdated: cachedData.lastUpdated });
});

/**
 * GET /api/widget
 * Get widget-compatible data (for Discord's widget)
 */
app.get('/api/widget', async (req, res) => {
    try {
        const guild = client.guilds.cache.get(CONFIG.GUILD_ID);

        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        res.json({
            id: guild.id,
            name: guild.name,
            instant_invite: 'https://discord.gg/' + guild.vanityURLCode || null,
            presence_count: guild.members.cache.filter(m => m.presence?.status !== 'offline').size
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(CONFIG.PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 TECO Bot Backend Server Started!                    ║
║                                                           ║
║   API Endpoints:                                         ║
║   • GET  /api/status   - Bot connection status          ║
║   • GET  /api/guild    - Full guild information         ║
║   • GET  /api/members  - Member statistics              ║
║   • GET  /api/roles    - Role distribution              ║
║   • GET  /api/channels - Channel statistics             ║
║   • POST /api/refresh  - Force data refresh            ║
║                                                           ║
║   Server running on port ${CONFIG.PORT}                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Login to Discord
    client.login(CONFIG.DISCORD_TOKEN)
        .catch(error => {
            console.error('❌ Failed to login to Discord:', error.message);
            console.log('\n⚠️  Please check your DISCORD_TOKEN in server.js');
        });
});
