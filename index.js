const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Alpha King is Online! 🚀');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    msgRetryCounterCache,
    delay
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const config = require('./config');
const qrcode = require('qrcode-terminal');
const fs = require('fs'); // මේක index.js එකේ උඩම තියෙන්න ඕනේ ෆයිල් කියවන්න
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fluentFfmpeg = require('fluent-ffmpeg');
fluentFfmpeg.setFfmpegPath(ffmpegPath);



function runtime(seconds) {
    seconds = Number(seconds);
    var d = Math.floor(seconds / (3600 * 24));
    var h = Math.floor(seconds % (3600 * 24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // අනවශ්‍ය messages පෙන්වීම නතර කරයි
        browser: [config.botName, "Safari", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR එකක් ආවොත් ඒක terminal එකේ print කරන්න මෙන්න මේ කෑල්ල ඕනේ
        if (qr) {
            console.log("-----------------------------------------");
            console.log("Alpha King QR Code එක පහතින් තියෙනවා.");
            qrcode.generate(qr, { small: true }); // මෙන්න මේ පේළිය තමයි QR එක අඳින්නේ
            console.log("WhatsApp එකෙන් Scan කරන්න Anu.");
            console.log("-----------------------------------------");
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('සම්බන්ධතාවය බිඳ වැටුණා. නැවත උත්සාහ කරනවා...');
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('--- Alpha King සාර්ථකව සම්බන්ධ වුණා! ---');
        }
    });

    const cmdList = {
    main: ['alive', 'menu', 'getid', 'ping', 'info', 'coucom'],
    ai: ['ai'],
    media: ['img', 'sticker', 'removebg', 'gif'],
    download: ['ytdlmp3', 'ytdlmp4', 'fbdlmp3', 'fbdlmp4'],
    finder: ['song', 'movie', 'game'],
    request: ['reqmovie', 'reqgame', 'reqcomm'],
    admin: ['kick', 'promote', 'demote', 'mute', 'unmute'],
    owner: ['stop', 'restart']
};

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const mText = msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const command = mText.toLowerCase().split(' ')[0].slice(config.prefix.length);
        

        // 1. Group ID එක ලබා ගැනීමේ විධානය (ඕනෑම තැනක වැඩ කරයි)
        if (mText === `${config.prefix}getid`) {
            await sock.sendMessage(remoteJid, { text: `මෙම ස්ථානයේ ID එක: ${remoteJid}` }, { quoted: msg });
            return;
        }

        // 2. Work Mode පරීක්ෂා කිරීම (Groups වල පමණක් වැඩ කිරීමට)
        if (config.workMode === "groups" && !isGroup) return;

        // 3. Allowed Groups වල පමණක් වැඩ කිරීම (ID එක ලිස්ට් එකේ තිබේ නම් පමණි)
        if (isGroup && !config.allowedGroups.includes(remoteJid)) {
            // මෙතන return දැම්මොත් ලිස්ට් එකේ නැති ගෲප් වල බොට් වැඩ කරන්නේ නැහැ.
            // නමුත් මුලින්ම ID එක ගන්න ඕන නිසා අපි දැනට මේක check නොකර ඉමු.
        }

        // --- Commands Start Here ---

   


        if (mText.startsWith(config.prefix)) {
            const command = mText.slice(config.prefix.length).trim().split(' ')[0].toLowerCase();
            
            switch (command) {

//----------------------------------------------------------------------------------------------------------------------------

                //01 Alive

                case 'alive':
            const aliveMsg = `
╭━━━━〔 *${config.botName.toUpperCase()}* 〕━━━━┈⊷
┃
┃  *Hey ${config.ownerName}!* ┃  *I am online and ready to serve.* 🚀
┃
┃ ┏━━━━━━━━━━━━━━┈⊷
┃ ┃ ◈ *Status:* Online
┃ ┃ ◈ *Version:* 1.0.0
┃ ┃ ◈ *Platform:* Linux (Cloud)
┃ ┃ ◈ *Developer:* ${config.ownerName}
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ Type* _${config.prefix}menu_  *to see my all commands.
┃
╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (fs.existsSync(config.logoPath)) {
                await sock.sendMessage(remoteJid, {
                    image: { url: config.logoPath },
                    caption: aliveMsg
                }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: aliveMsg }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

                //02 Menu

                case 'menu':
            const menuMsg = `
╭━━━━〔 *${config.botName.toUpperCase()}* 〕━━━━┈⊷
┃
┃  *Hello ${config.ownerName}!*
┃  *Here is my command list:*
┃
┃ ┏━━━◈ *MAIN COMMANDS*━━━┈⊷
┃ ┃ ➥ *${config.prefix}alive* - Check bot status
┃ ┃ ➥ *${config.prefix}menu* - Show all commands
┃ ┃ ➥ *${config.prefix}getid* - Get group ID
┃ ┃ ➥ *${config.prefix}ping* - Bot speed test
┃ ┃ ➥ *${config.prefix}info* - Get bot info
┃ ┃ ➥ *${config.prefix}coucom* - Count all commands of this bot
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *AI COMMANDS*━━━┈⊷
┃ ┃ ➥ *${config.prefix}ai* - Chat with AI (Coming Soon)
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *Media COMMANDS*━━━┈⊷
┃ ┃ ➥ *${config.prefix}img* - Generate images (Coming Soon)
┃ ┃ ➥ *${config.prefix}sticker* / *${config.prefix}s* - Creat sticker
┃ ┃ ➥ *${config.prefix}removebg* / *${config.prefix}rbg* - Remove background of picture
┃ ┃ ➥ *${config.prefix}gif* - Creat gif
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *DOWNLOADER COMMANDS*━━━┈⊷
┃ ┃ ➥ *${config.prefix}ytdlmp3* - Download YT videos as mp3 (Coming Soon)
┃ ┃ ➥ *${config.prefix}ytdlmp4* - Download YT videos as mp4 (Coming Soon)
┃ ┃ ➥ *${config.prefix}fbdlmp3* - Download FB videos as mp3 (Coming Soon)
┃ ┃ ➥ *${config.prefix}fbdlmp4* - Download FB videos as mp4 (Coming Soon)
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *FINDER COMMANDS*━━━┈⊷
┃ ┃ ➥ *${config.prefix}song* - Find song in YT
┃ ┃ ➥ *${config.prefix}movie* - Find movies
┃ ┃ ➥ *${config.prefix}game* - Find games
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *REQUEST COMMANDS*━━━┈⊷
┃ ┃ ➥ *${config.prefix}reqmovie* - Request a movie
┃ ┃ ➥ *${config.prefix}reqgame* - Request a game
┃ ┃ ➥ *${config.prefix}reqcmd* - Request a command
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *ADMIN COMMANDS* (Only Admin)━━━┈⊷
┃ ┃ ➥ *${config.prefix}kick* - Remove an user (Coming Soon)
┃ ┃ ➥ *${config.prefix}promote* - Make group admin (Coming Soon)
┃ ┃ ➥ *${config.prefix}demote* - Remove fom admin (Coming Soon)
┃ ┃ ➥ *${config.prefix}mute* - Mute this group (Coming Soon)
┃ ┃ ➥ *${config.prefix}unmute* - Unmute this group (Coming Soon)
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *Bot COMMANDS* (only Owner)━━━┈⊷
┃ ┃ ➥ *${config.prefix}stop* - Stop bot (Coming Soon)
┃ ┃ ➥ *${config.prefix}restart* - Restatrt bot (Coming Soon)
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃  *Made by ❤️ Anu*
╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (fs.existsSync(config.logoPath)) {
                await sock.sendMessage(remoteJid, {
                    image: { url: config.logoPath },
                    caption: menuMsg
                }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: menuMsg }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

            // 03 Ping

            case 'ping':
            const start = new Date().getTime();
            
            // වත්මන් දිනය සහ වෙලාව සකස් කිරීම
            const date = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString();
            
            // Runtime එක ලබා ගැනීම (process.uptime() එකෙන් තත්පර ගණන ලැබෙනවා)
            const upTime = runtime(process.uptime());

            const pingMsg = `
╭━━━━〔 *${config.botName.toUpperCase()}* 〕━━━━┈⊷
┃
┃ ◈ *Speed:* ${new Date().getTime() - start}ms
┃ ◈ *Runtime:* ${upTime}
┃ ◈ *Date:* ${date}
┃ ◈ *Time:* ${time}
┃ ◈ *Status:* Active ⚡
┃
╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (fs.existsSync(config.logoPath)) {
                await sock.sendMessage(remoteJid, {
                    image: { url: config.logoPath },
                    caption: pingMsg
                }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: pingMsg }, { quoted: msg });
            }
            break;
                
//----------------------------------------------------------------------------------------------------------------------------

// 05 Info

case 'info':
            const infoStart = new Date().getTime();
            const infoDate = new Date().toLocaleDateString();
            const infoTime = new Date().toLocaleTimeString();
            const infoUptime = runtime(process.uptime());
            
            // RAM පාවිච්චිය ගණනය කිරීම (MB වලින්)
            const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
            const totalMemory = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2);

            const infoMsg = `
╭━━━━〔 *${config.botName.toUpperCase()} - INFO* 〕━━━━┈⊷
┃
┃ ┏━━━◈ *SYSTEM INFO* ━━━┈⊷
┃ ┃ ➥ *Name:* ${config.botName}
┃ ┃ ➥ *Developer:* ${config.ownerName}
┃ ┃ ➥ *Prefix:* ${config.prefix}
┃ ┃ ➥ *Version:* 1.0.0
┃ ┃ ➥ *Platform:* Linux (Codespace)
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *STATUS INFO* ━━━┈⊷
┃ ┃ ➥ *Speed:* ${new Date().getTime() - infoStart}ms
┃ ┃ ➥ *Runtime:* ${infoUptime}
┃ ┃ ➥ *RAM:* ${usedMemory}MB / ${totalMemory}MB
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *DATE & TIME* ━━━┈⊷
┃ ┃ ➥ *Date:* ${infoDate}
┃ ┃ ➥ *Time:* ${infoTime}
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃  *Made with ❤️ by Anu*
╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (fs.existsSync(config.logoPath)) {
                await sock.sendMessage(remoteJid, {
                    image: { url: config.logoPath },
                    caption: infoMsg
                }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: infoMsg }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 06 Coucom

case 'coucom':
            // ඔටෝ ගණනය කිරීම්
            const allCmds = Object.values(cmdList).flat(); // සියලුම කමාන්ඩ් එක ලැයිස්තුවකට ගැනීම
            const total = allCmds.length;
            
            // දැනට අපි හදලා තියෙන කමාන්ඩ් ලිස්ට් එක (මේකට අලුත් ඒව හදද්දි එකතු කරන්න)
            const activeCmds = ['alive', 'menu', 'getid', 'ping', 'info', 'coucom', 'reqmovie', 'sticker', 'removebg', 'gif', 'song', 'movie', 'game']; 
            
            const completed = activeCmds.length;
            const comingSoon = total - completed;
            const userCmds = total - (cmdList.admin.length + cmdList.owner.length); // Admin සහ Owner හැර අනිත් ඔක්කොම User Commands විදියට ගන්නවා
            const adminCmds = cmdList.admin.length;
            const ownerCmds = cmdList.owner.length;

            const coucomMsg = `
╭━━━━〔 *${config.botName.toUpperCase()} - COMMANDS STATS* 〕━━━━┈⊷
┃
┃ ┏━━━◈ *COMMAND PROGRESS* ━━━┈⊷
┃ ┃ ➥ 📊 *Total Commands:* ${total}
┃ ┃ ➥ ✅ *Completed:* ${completed}
┃ ┃ ➥ ⏳ *Coming Soon:* ${comingSoon}
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃ ┏━━━◈ *COMMAND ROLES* ━━━┈⊷
┃ ┃ ➥ 👤 *User Commands:* ${userCmds}
┃ ┃ ➥ 🛡️ *Admin Commands:* ${adminCmds}
┃ ┃ ➥ 👑 *Owner Commands:* ${ownerCmds}
┃ ┗━━━━━━━━━━━━━━┈⊷
┃
┃  *Current Development: ${Math.round((completed / total) * 100)}% Complete*
┃  *Made with ❤️ by Anu*
╰━━━━━━━━━━━━━━━━━━┈⊷`;

            if (fs.existsSync(config.logoPath)) {
                await sock.sendMessage(remoteJid, {
                    image: { url: config.logoPath },
                    caption: coucomMsg
                }, { quoted: msg });
            } else {
                await sock.sendMessage(remoteJid, { text: coucomMsg }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 07 Sticker

case 'sticker':
        case 's':
            try {
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const targetMsg = msg.message?.imageMessage || msg.message?.videoMessage || quoted?.imageMessage || quoted?.videoMessage;

                if (!targetMsg) {
                    return await sock.sendMessage(remoteJid, { text: "Anu, පින්තූරයකට හෝ වීඩියෝවකට රිප්ලයි කරන්න. නැත්නම් කැප්ෂන් එකේ .sticker කියලා දාන්න." }, { quoted: msg });
                }

                if ((targetMsg.seconds || 0) > 10) {
                    return await sock.sendMessage(remoteJid, { text: "වීඩියෝ එක තත්පර 10කට වඩා වැඩියි Anu!" }, { quoted: msg });
                }

                // 1. මුලින්ම පණිවිඩයට React එකක් දාමු
                await sock.sendMessage(remoteJid, { react: { text: "⏳", key: msg.key } });

                // 2. "Processing" මැසේජ් එකක් යවමු
                const waitMsg = await sock.sendMessage(remoteJid, { text: "_Alpha King ස්ටිකරය නිර්මාණය කරමින් පවතී... කරුණාකර රැඳී සිටින්න._ 🎨" }, { quoted: msg });

                const stream = await downloadContentFromMessage(targetMsg, targetMsg.seconds ? 'video' : 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const sticker = new Sticker(buffer, {
                    pack: config.botName,
                    author: config.ownerName,
                    type: StickerTypes.FULL,
                    quality: 70
                });

                const stickerBuffer = await sticker.toBuffer();

                // 3. ස්ටිකර් එක යවන අතරතුර අර Processing මැසේජ් එක අයින් කරමු (Delete)
                await sock.sendMessage(remoteJid, { delete: waitMsg.key });

                // 4. ස්ටිකර් එක යවමු
                await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });
                
                // 5. වැඩේ ඉවරයි කියලා පෙන්වන්න තවත් React එකක්
                await sock.sendMessage(remoteJid, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.error(e);
                await sock.sendMessage(remoteJid, { text: "අයියෝ! ස්ටිකර් එක හදන්න බැරි වුණා. ආයෙත් උත්සාහ කරන්න." }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

//08 Gif

case 'gif':
            try {
                // 1. මැසේජ් එකේ වර්ගය හඳුනාගනිමු
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const isVideo = msg.message?.videoMessage;
                const isQuotedVideo = quoted?.videoMessage;
                const isImage = msg.message?.imageMessage || quoted?.imageMessage;

                // 2. පින්තූරයක් නම් - "පොටෝ බෑ" කියලා කියමු
                if (isImage) {
                    return await sock.sendMessage(remoteJid, { 
                        text: "අපෝ සයුරු, පින්තූර GIF කරන්න බෑනේ! කරුණාකර වීඩියೋ එකක් එවන්න. 🚫" 
                    }, { quoted: msg });
                }

                // 3. වීඩියෝ එකක් නැත්නම් - "වීඩියෝ එකක් දාන්න" කියලා කියමු
                if (!isVideo && !isQuotedVideo) {
                    return await sock.sendMessage(remoteJid, { 
                        text: "Anu, කරුණාකර වීඩියෝ එකකට රිප්ලයි එකක් හෝ වීඩියෝ කැප්ෂන් එකක් විදියට .gif කමාන්ඩ් එක භාවිතා කරන්න. 🎥" 
                    }, { quoted: msg });
                }

                const targetVideo = isVideo || isQuotedVideo;

                // 4. තත්පර 8 සීමාව පරීක්ෂා කිරීම
                if (targetVideo.seconds > 8) {
                    return await sock.sendMessage(remoteJid, { 
                        text: "මේ වීඩියෝ එක දිග වැඩියි Anu! තත්පර 8කට වඩා අඩු වීඩියෝ එකක් එවන්න. ⏳" 
                    }, { quoted: msg });
                }

                // 5. වැඩේ පටන් ගත්තා කියලා පෙන්වන්න React එකක්
                await sock.sendMessage(remoteJid, { react: { text: "⚙️", key: msg.key } });

                // 6. වීඩියෝව ඩවුන්ලෝඩ් කිරීම
                const stream = await downloadContentFromMessage(targetVideo, 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // 7. GIF එකක් විදියට (Muted Auto-playing Video) යැවීම
                await sock.sendMessage(remoteJid, { 
                    video: buffer, 
                    caption: `*Alpha King GIF System* ✅`,
                    gifPlayback: true 
                }, { quoted: msg });

                // 8. සාර්ථකයි කියලා පෙන්වන්න React එකක්
                await sock.sendMessage(remoteJid, { react: { text: "🪄", key: msg.key } });

            } catch (e) {
                console.error("GIF Error:", e);
                await sock.sendMessage(remoteJid, { text: "GIF එක හදද්දී මොකක් හරි වැරදුණා සයුරු." }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 9 Removebg

case 'removebg':
        case 'rbg':
            try {
                const { removeBackgroundFromImageBase64 } = require('remove.bg');
                const pushName = msg.pushName || 'User';
                
                // රිප්ලයි එකක්ද නැද්ද බලමු
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const isImage = msg.message?.imageMessage || quoted?.imageMessage;

                if (!isImage) {
                    return await sock.sendMessage(remoteJid, { 
                        text: `🖼️ හලෝ ${pushName}, බැක්ග්‍රවුන්ඩ් එක අයින් කරන්න නම් පින්තූරයකට රිප්ලයි කරන්න හෝ පින්තූරයක් සමඟ කමාන්ඩ් එක භාවිතා කරන්න.` 
                    }, { quoted: msg });
                }

                // Reaction සහ "Processing" මැසේජ් එක
                await sock.sendMessage(remoteJid, { react: { text: "✂️", key: msg.key } });
                const waitMsg = await sock.sendMessage(remoteJid, { text: `_පින්තූරයේ පසුබිම ඉවත් කරමින් පවතී... කරුණාකර රැඳී සිටින්න._` }, { quoted: msg });

                // පින්තූරය ඩවුන්ලෝඩ් කරමු
                const stream = await downloadContentFromMessage(isImage, 'image');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                // Remove.bg හරහා බැක්ග්‍රවුන්ඩ් එක අයින් කරමු
                const result = await removeBackgroundFromImageBase64({
                    base64img: buffer.toString('base64'),
                    apiKey: config.removeBgApiKey, // config එකේ දාපු key එක
                    size: 'auto',
                    type: 'auto',
                });

                const resultBuffer = Buffer.from(result.base64img, 'base64');

                // අර මැසේජ් එක Delete කරලා රිසල්ට් එක යවමු
                await sock.sendMessage(remoteJid, { delete: waitMsg.key });
                await sock.sendMessage(remoteJid, { 
                    image: resultBuffer, 
                    caption: `*Alpha King Background Remover* ✅\n_Requested by: ${pushName}_` 
                }, { quoted: msg });

                await sock.sendMessage(remoteJid, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.error("RemoveBG Error:", e);
                await sock.sendMessage(remoteJid, { 
                    text: `❌ පින්තූරයේ පසුබිම ඉවත් කිරීමට නොහැකි විය. ඔබේ API Key එක පරීක්ෂා කරන්න.` 
                }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 10 Song

case 'song':
            try {
                const yts = require('yt-search');
                const text = mText.split(' ').slice(1).join(' ');
                const pushName = msg.pushName || 'User';

                if (!text) {
                    return await sock.sendMessage(remoteJid, { 
                        text: `🔍 හලෝ ${pushName}, ඔබට සෙවිය යුතු සිංදුවේ නම ලබා දෙන්න.` 
                    }, { quoted: msg });
                }

                await sock.sendMessage(remoteJid, { react: { text: "🔍", key: msg.key } });
                
                // මෙන්න මෙතනදී අපි යූසර්ගේ ටෙක්ස්ට් එකට " song" කෑල්ල එකතු කරනවා
                const searchQuery = `${text} song`; 
                const search = await yts(searchQuery);
                const results = search.videos.slice(0, 15); 

                if (results.length === 0) {
                    return await sock.sendMessage(remoteJid, { text: "❌ මට කිසිදු සිංදුවක් සොයාගත නොහැකි විය." }, { quoted: msg });
                }

                let listMsg = `🎵 *ALPHA KING SONG SEARCH* 🎵\n\n_Results for: ${text}_\n\n`;

                results.forEach((video, index) => {
                    listMsg += `*${index + 1}. ${video.title}*\n`;
                    listMsg += `🕒 කාලය: ${video.timestamp} | 👀 Views: ${video.views}\n`;
                    listMsg += `🔗 Link: ${video.url}\n\n`;
                });

                listMsg += `_ඔබට අවශ්‍ය සිංදුවේ Link එක භාවිතා කර Download කරගන්න._ ✅`;

                await sock.sendMessage(remoteJid, { 
                    image: { url: results[0].thumbnail }, 
                    caption: listMsg 
                }, { quoted: msg });

                await sock.sendMessage(remoteJid, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.error("Search Error:", e);
                await sock.sendMessage(remoteJid, { text: "❌ සෙවීමේදී දෝෂයක් ඇති විය." }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 11 Movie

case 'movie':
            try {
                const fs = require('fs');
                const text = mText.split(' ').slice(1).join(' ').toLowerCase();
                const pushName = msg.pushName || 'User';

                if (!text) {
                    return await sock.sendMessage(remoteJid, { 
                        text: `🎬 හලෝ ${pushName}, ඔබට අවශ්‍ය චිත්‍රපටයේ නම ලබා දෙන්න.` 
                    }, { quoted: msg });
                }

                // JSON ෆයිල් එක කියවමු
                const moviesData = JSON.parse(fs.readFileSync('./movies.json', 'utf-8'));

                // සර්ච් කරමු (නම හෝ Keywords ගැලපෙන ඒවා)
                const results = moviesData.filter(m => 
                    m.name.toLowerCase().includes(text) || 
                    (m.keywords && m.keywords.some(k => k.toLowerCase().includes(text)))
                );

                if (results.length > 0) {
                    await sock.sendMessage(remoteJid, { react: { text: "🎬", key: msg.key } });
                    
                    let resultMsg = `🎬 *ALPHA KING MOVIE SEARCH* 🎬\n\n`;
                    resultMsg += `_${text}_ සඳහා ප්‍රතිඵල ${results.length} ක් හමු විය:\n\n`;

                    results.forEach((movie, index) => {
                        resultMsg += `*${index + 1}. ${movie.name} (${movie.year})*\n`;
                        resultMsg += `⏳ කාලය: ${movie.duration}\n`;
                        resultMsg += `📦 ප්‍රමාණය: ${movie.size}\n`;
                        resultMsg += `🔗 Link: ${movie.link}\n\n`;
                    });

                    resultMsg += `_Powered by Alpha King Bot_ ✅`;
                    
                    await sock.sendMessage(remoteJid, { text: resultMsg }, { quoted: msg });

                } else {
                    // ෆිල්ම් එක නැතිනම් දෙන ලස්සන මැසේජ් එක
                    const noMovieMsg = `🚫 *කනගාටුයි ${pushName},*\n\nඔබ සොයන "${text}" චිත්‍රපටය දැනට අපේ ලිස්ට් එකේ නැහැ.\n\nකරුණාකර *.reqmovie* මගින් ඔබට අවශ්‍ය චිත්‍රපටය ඉල්ලා සිටින්න. කිහිප දිනකින් නැවත උත්සාහ කරන්න. 🍿`;
                    
                    await sock.sendMessage(remoteJid, { text: noMovieMsg }, { quoted: msg });
                }

            } catch (e) {
                console.error("Movie List Error:", e);
                await sock.sendMessage(remoteJid, { text: "❌ දත්ත පද්ධතිය කියවීමේදී දෝෂයක් ඇති විය." }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 12 Game

case 'game':
            try {
                const fs = require('fs');
                const text = mText.split(' ').slice(1).join(' ').toLowerCase();
                const pushName = msg.pushName || 'User';

                if (!text) {
                    return await sock.sendMessage(remoteJid, { 
                        text: `🎮 හලෝ ${pushName}, ඔබට අවශ්‍ය ගේම් එකේ නම හෝ වර්ගය ලබා දෙන්න.` 
                    }, { quoted: msg });
                }

                // games.json එක කියවමු
                if (!fs.existsSync('./games.json')) {
                    return await sock.sendMessage(remoteJid, { text: "❌ Games දත්ත පද්ධතිය සොයාගත නොහැක." }, { quoted: msg });
                }
                
                const gamesData = JSON.parse(fs.readFileSync('./games.json', 'utf-8'));

                // සෙවීම: නම හෝ Keyword එකක අකුරක් හරි ගැලපෙනවද බලනවා
                const results = gamesData.filter(g => 
                    g.name.toLowerCase().includes(text) || 
                    (g.keywords && g.keywords.some(k => k.toLowerCase().includes(text)))
                );

                if (results.length > 0) {
                    await sock.sendMessage(remoteJid, { react: { text: "🎮", key: msg.key } });
                    
                    let resultMsg = `🎮 *ALPHA KING GAME SEARCH* 🎮\n\n`;
                    resultMsg += `_"${text}"_ සඳහා ප්‍රතිඵල ${results.length} ක් හමු විය:\n\n`;

                    results.forEach((game, index) => {
                        resultMsg += `*${index + 1}. ${game.name}*\n`;
                        resultMsg += `📅 වසර: ${game.year || 'N/A'}\n`;
                        resultMsg += `🏢 සමාගම: ${game.company || 'N/A'}\n`;
                        resultMsg += `📦 ප්‍රමාණය: ${game.size || 'N/A'}\n`;
                        resultMsg += `🔗 Link: ${game.link}\n\n`;
                    });

                    resultMsg += `_Powered by Alpha King Bot_ ✅`;
                    
                    await sock.sendMessage(remoteJid, { text: resultMsg }, { quoted: msg });

                } else {
                    // ගේම් එක නැතිනම් දෙන ඔයා කියපු ලස්සන මැසේජ් එක
                    const noGameMsg = `🚫 *කනගාටුයි ${pushName},*\n\nඔබ සොයන "${text}" ක්‍රීඩාව දැනට අපේ ලිස්ට් එකේ නැහැ.\n\nකරුණාකර *.reqgame* මගින් ඔබට අවශ්‍ය ගේම් එක ඉල්ලා සිටින්න. කිහිප දිනකින් නැවත උත්සාහ කරන්න. 🕹️`;
                    
                    await sock.sendMessage(remoteJid, { text: noGameMsg }, { quoted: msg });
                }

            } catch (e) {
                console.error("Game Error:", e);
                await sock.sendMessage(remoteJid, { text: "❌ ගේම්ස් දත්ත පද්ධතියේ දෝෂයක් පවතී." }, { quoted: msg });
            }
            break;

//----------------------------------------------------------------------------------------------------------------------------

// 13 Reqmovie

case 'reqmovie': {
    const config = require('./config'); 
    const text = mText.split(' ').slice(1).join(' ');
    const pushName = msg.pushName || 'User';

    if (!text) {
        return await sock.sendMessage(remoteJid, { text: `හලෝ ${pushName}, කරුණාකර චිත්‍රපටයේ (Movie) නම ලබා දෙන්න.` }, { quoted: msg });
    }

    // Config එකේ තියෙන reqno එකම පාවිච්චි කරනවා
    const targetJid = config.reqno + '@s.whatsapp.net';

    const notificationText = `*🎬 ALPHA KING - NEW MOVIE REQUEST*\n\n` +
                             `👤 *User:* ${pushName}\n` +
                             `🎥 *Movie:* ${text}\n` +
                             `📅 *Time:* ${new Date().toLocaleString()}`;

    try {
        // ඔයාගේ නම්බර් එකට මැසේජ් එක යනවා
        await sock.sendMessage(targetJid, { text: notificationText });

        // යූසර්ට රිප්ලයි එක
        await sock.sendMessage(remoteJid, { react: { text: "🎬", key: msg.key } });
        await sock.sendMessage(remoteJid, { 
            text: `හලෝ ${pushName}, ඔයාගේ Movie Request එක අපි භාරගත්තා. ඉක්මනින්ම ඒක හොයලා දෙන්නම්!` 
        }, { quoted: msg });

    } catch (err) {
        console.log("Movie Request Error: ", err);
        await sock.sendMessage(remoteJid, { text: "සමාවන්න, පද්ධතියේ දෝෂයක් පවතී." });
    }
}
break;

//----------------------------------------------------------------------------------------------------------------------------

// 14 Reqgame

case 'reqgame': {
    const config = require('./config'); // config file එක ලෝඩ් කරනවා
    const text = mText.split(' ').slice(1).join(' ');
    const pushName = msg.pushName || 'User';

    if (!text) {
        return await sock.sendMessage(remoteJid, { text: `හලෝ ${pushName}, කරුණාකර Game එකේ නම ලබා දෙන්න.` }, { quoted: msg });
    }

    // Config එකේ තියෙන නම්බර් එකට JID එක හදාගන්නවා
    const targetJid = config.reqno + '@s.whatsapp.net';

    const notificationText = `*🎮 ALPHA KING - NEW GAME REQUEST*\n\n` +
                             `👤 *User:* ${pushName}\n` +
                             `🕹️ *Game:* ${text}\n` +
                             `📅 *Time:* ${new Date().toLocaleString()}`;

    try {
        // අදාළ නම්බර් එකට විතරක් notification එක යවනවා
        await sock.sendMessage(targetJid, { text: notificationText });

        // ඉල්ලීම කරපු යූසර්ට රිප්ලයි එක සහ Reaction එක
        await sock.sendMessage(remoteJid, { react: { text: "📥", key: msg.key } });
        await sock.sendMessage(remoteJid, { 
            text: `හලෝ ${pushName}, ඔයාගේ ඉල්ලීම සාර්ථකව සටහන් කරගත්තා. ස්තුතියි!` 
        }, { quoted: msg });

    } catch (err) {
        console.log("Request System Error: ", err);
        await sock.sendMessage(remoteJid, { text: "සමාවන්න, පද්ධතියේ දෝෂයක් පවතී." });
    }
}
break;

//----------------------------------------------------------------------------------------------------------------------------

// 15 Reqcmd

case 'reqcmd': {
    const config = require('./config'); 
    const text = mText.split(' ').slice(1).join(' ');
    const pushName = msg.pushName || 'User';

    if (!text) {
        return await sock.sendMessage(remoteJid, { 
            text: `හලෝ ${pushName}, ඔයා බොට්ට එකතු කරන්න කැමති අලුත් Command එක සහ ඒකෙන් වෙන්න ඕනි දේ පැහැදිලිව ලියන්න.\n\n*උදාහරණ:* .reqcmd අකුරු ලස්සන කරන කමාන්ඩ් එකක් ඕනේ.` 
        }, { quoted: msg });
    }

    const targetJid = config.reqno + '@s.whatsapp.net';

    const notificationText = `*🚀 ALPHA KING - NEW FEATURE/COMMAND REQUEST*\n\n` +
                             `👤 *User:* ${pushName}\n` +
                             `💡 *Idea:* ${text}\n` +
                             `📱 *From:* ${remoteJid}\n` +
                             `📅 *Date:* ${new Date().toLocaleString()}`;

    try {
        // ඔයාගේ නම්බර් එකට අදහස එනවා
        await sock.sendMessage(targetJid, { text: notificationText });

        // යූසර්ට රිප්ලයි එක
        await sock.sendMessage(remoteJid, { react: { text: "💡", key: msg.key } });
        await sock.sendMessage(remoteJid, { 
            text: `නියමයි ${pushName}! ඔයාගේ අදහස අපි භාරගත්තා. ඒක බොට්ට එකතු කරන්න පුළුවන්ද කියලා Admin බලයි. ස්තුතියි!` 
        }, { quoted: msg });

    } catch (err) {
        console.log("Command Request Error: ", err);
        await sock.sendMessage(remoteJid, { text: "සමාවන්න, පද්ධතියේ දෝෂයක් පවතී." });
    }
}
break;

//----------------------------------------------------------------------------------------------------------------------------

// 16 Kick

case 'kick': {
    const config = require('./config');
    
    // 1. Group එකක්ද කියලා බලනවා
    if (!msg.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(remoteJid, { text: 'මේ කමාන්ඩ් එක පාවිච්චි කළ හැක්කේ ගෲප් ඇතුළේ පමණි!' }, { quoted: msg });

    // 2. Group Metadata සහ Admins ලා කවුද කියලා ගන්නවා
    const groupMetadata = await sock.groupMetadata(remoteJid);
    const participants = groupMetadata.participants;
    const admins = participants.filter(v => v.admin !== null).map(v => v.id);

    // 3. Command එක දාන කෙනා Admin ද නැත්නම් Owner ද කියලා බලනවා
    const isAdmins = admins.includes(msg.key.participant || msg.key.remoteJid);
    const isOwner = config.owner.includes(msg.key.participant ? msg.key.participant.split('@')[0] : '');

    if (!isAdmins && !isOwner) {
        return await sock.sendMessage(remoteJid, { text: 'සමාවන්න, මේ කමාන්ඩ් එක පාවිච්චි කිරීමට ඔබ ඇඩ්මින් කෙනෙක් හෝ බොට් අයිතිකරු විය යුතුය.' }, { quoted: msg });
    }

    // 4. Kick කරන්න ඕන කෙනාව අඳුරගන්නවා (Mention කරලා හෝ Reply කරලා)
    let users = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [msg.message.extendedTextMessage?.contextInfo?.participant];
    
    if (!users || !users[0]) return await sock.sendMessage(remoteJid, { text: 'කරුණාකර ඉවත් කළ යුතු පුද්ගලයාව Mention කරන්න හෝ Reply කරන්න.' }, { quoted: msg });

    try {
        await sock.groupParticipantsUpdate(remoteJid, users, "remove");
        await sock.sendMessage(remoteJid, { react: { text: "🚫", key: msg.key } });
        await sock.sendMessage(remoteJid, { text: 'සාර්ථකව ඉවත් කළා! ✅' }, { quoted: msg });
    } catch (err) {
        console.log(err);
        await sock.sendMessage(remoteJid, { text: 'බොට්ට ඇඩ්මින් බලතල නැති නිසා ඉවත් කිරීමට නොහැක.' });
    }
}
break;

//----------------------------------------------------------------------------------------------------------------------------

// 17

//----------------------------------------------------------------------------------------------------------------------------

// 18

//----------------------------------------------------------------------------------------------------------------------------

// 19

//----------------------------------------------------------------------------------------------------------------------------

// 20

//----------------------------------------------------------------------------------------------------------------------------

// 21

//----------------------------------------------------------------------------------------------------------------------------

// 22

//----------------------------------------------------------------------------------------------------------------------------

// 23

//----------------------------------------------------------------------------------------------------------------------------

// 24

//----------------------------------------------------------------------------------------------------------------------------

// 25

//----------------------------------------------------------------------------------------------------------------------------

// 26

//----------------------------------------------------------------------------------------------------------------------------

// 27

//----------------------------------------------------------------------------------------------------------------------------

// 28

//----------------------------------------------------------------------------------------------------------------------------

// 29

//----------------------------------------------------------------------------------------------------------------------------

// 30









                    
                
            }
        }  

        // --- Commands End Here ---
                
    });
}
       

connectToWhatsApp();