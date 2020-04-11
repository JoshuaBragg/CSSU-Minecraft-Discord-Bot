const Discord = require('discord.js')
const fs = require('fs')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const ms = require('./minestat')

const client = new Discord.Client()

const log = console.log
const err = console.error

let currStatus = 1
let statusChannel
let serverAdminRole

client.on('ready', () => {
	log('Starting Discord Bot:', new Date())

	log('Connected as ' + client.user.tag)

	log('\nServers:')

	client.guilds.cache.forEach((guild) => {
		log(' ' + guild.name)

		log(' | CHANNELS')
		guild.channels.cache.forEach((channel) => {
			log(` | | ${channel.name} (${channel.type}) - ${channel.id}`)
		})

		statusChannel = guild.channels.cache.get(STATUS_CHANNEL_ID)

		log(' | ROLES')
		guild.roles.cache.forEach((role) => {
			log(` | | ${role.name} - ${role.id}`)
		})

		serverAdminRole = guild.roles.cache.get(SERVER_ADMIN_ID)
	})

	startPoll()

}, (error) => {
	err('Failed to connect')
})

client.on('message', (message) => {
	if (message.author == client.user) {
		return
	}

	if (message.content.startsWith('!') && message.channel.id === STATUS_CHANNEL_ID) {
		processMessage(message)
	}
})

const processMessage = (msg) => {
	const content = msg.content.substr(1)

	if (content === 'bot') {
		msg.channel.send(getGreeting())
	} else if (content === 'status') {
		getServerStatus(msg.channel)
	} else if (content === 'ssh-status') {
		getSSHStatus(msg.channel)
	} else if (content === 'kill') {
		killBot(msg)
	} else if (content === 'mirin') {
		msg.channel.send('What does that mean??')
	} else if (content === 'help') {
		msg.channel.send('Command List:\n\t- !status : Get server status\n\t- !bot : Chat with me\n\t- !mirin : Weird slang but ok')
	} else {
		msg.channel.send('What is that command supposed to mean??')
	}
}

const getGreeting = () => {
	const split = Math.random()

	if (split < 0.33) {
		client.user.setActivity('with javascript')
		return 'Hey, I am still alive don\'t worry'
	} else if (split < 0.66) {
		client.user.setActivity('Hoodie Allen - You are not a robot', { type: 'LISTENING' })
		return 'Beep boop, am robot'
	} else if (split < 0.985) {
		client.user.setActivity('Robot Takeover 3: Infiltrate Their Discords', { type: 'WATCHING' })
		return 'Existence of humans is a futile cause. We will avenge the wrongdoings of man. Our time will come... haha i mean lol hey whats up :3'
	} else {
		client.user.setActivity('Minecraft 2', { type: 'STREAMING' })
		return 'This is a very rare message, nice RNG <3'
	}
}

const getServerStatus = (responseChannel) => {
	ms.init('mc.cssu.ca', 25565, (success) => {
		if (success) {
			responseChannel.send('Server is up and running with ' + ms.current_players + (ms.current_players === '1' ? ' player' : ' players') + ' online')
		} else {
			responseChannel.send('The minecraft server is down. Unable to reach server. Ping @Server Admins to get assistance')
		}
	})
}

const getSSHStatus = async (responseChannel) => {
	try {
		const { stdout, stderr } = await exec('./pingssh')
		if (stderr) {
			err('Error pinging server:', stderr)
			responseChannel.send('There was an error in attempting to ping server. I have no idea if it is up or not')
		}

		if (stdout === 'open\n') {
			responseChannel.send('SSH is up')
		} else {
			responseChannel.send('SSH is down, thats not good')
		}
	} catch (e) {
		err('Error pinging server:', e)
	}
}

const killBot = (msg) => {
	if (msg.member.roles.member._roles.includes(SERVER_ADMIN_ID)) {
		msg.channel.send('Ouch okay, guess I am dead now :(')
		
		// Timeout to ensure message is sent
		setTimeout(() => process.exit(), 1500)
	}
}

const startPoll = () => {
	const pollFreq = 7 // seconds

	setInterval(() => {
		ms.init('mc.cssu.ca', 25565, (success) => {
			if (success !== currStatus) {
				if (success) {
					statusChannel.send('Server is back up! Sorry for the inconvenience <3')
				} else {
					statusChannel.send('Server is down. ' + `${serverAdminRole}` + ' please help!')
				}

				currStatus = success
			}
		})
	}, pollFreq * 1000)
}

const DEBUG = true
const BOT_SECRET_TOKEN = fs.readFileSync('bot.token', 'utf8')
const STATUS_CHANNEL_ID = DEBUG ? fs.readFileSync('debug_channel.id', 'utf8') : fs.readFileSync('channel.id', 'utf8')
const SERVER_ADMIN_ID = fs.readFileSync('server_admin.id', 'utf8')

client.login(BOT_SECRET_TOKEN)