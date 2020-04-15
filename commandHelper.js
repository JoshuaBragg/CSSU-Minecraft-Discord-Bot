'use strict'
const exec = require('util').promisify(require('child_process').exec)
const ms = require('./minestat')

const log = console.log
const err = console.error

const getCommandList = (channel) => {
	let list = 'Here is a list of what I can do:'

	for (let com in commands) {
		list += `\n\t- ${com}: ${commands[com].description}`
	}

	return list
}

const getGreeting = (client) => {
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

const reportServerStatus = (responseChannel) => {
	ms.init('mc.cssu.ca', 25565, (success) => {
		if (success) {
			responseChannel.send('Server is up and running with ' + ms.current_players + (ms.current_players === '1' ? ' player' : ' players') + ' online')
		} else {
			responseChannel.send(`The minecraft server is down. Unable to reach server. ${serverAdminRole} help please!`)
		}
	})
}

const reportSSHStatus = async (responseChannel) => {
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
	} else {
		msg.channel.send('Haha you can\'t kill me! Nice try tho peasant ;)')
	}
}

const commands = { 
	bot: {
		description: 'Chat with the bot',
		action: (params) => {
			params.channel.send(getGreeting(params.client))
		}
	},
	status: {
		description: 'Get server status',
		action: (params) => {
			reportServerStatus(params.channel)
		}
	},
	sshstatus: {
		description: 'Check status of ssh connection',
		action: (params) => {
			reportSSHStatus(params.channel)
		}
	},
	kill: {
		description: 'Kill the bot (don\'t do that pls <3)',
		action: (params) => {
			killBot(params.msg)
		}
	},
	help: {
		description: 'List all commands',
		action: (params) => {
			params.channel.send(getCommandList())
		}
	}
}

module.exports = commands