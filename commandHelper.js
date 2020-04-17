'use strict'
const exec = require('util').promisify(require('child_process').exec)
const fs = require('fs')
const ms = require('./minestat')

const log = console.log
const err = console.error

const permissionGroups = JSON.parse(fs.readFileSync('permissionGroups.json', 'utf8'))

const getCommandList = (msg, getUserGroup) => {
	let list = 'Here is a list of commands you can run:'

	const userGroup = getUserGroup(msg)

	for (let com in commands) {
		if (userGroup >= commands[com].permission) {
			list += `\n\t- ${com}: ${commands[com].description}`
		}
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

const reportSSHStatus = async (msg, getUserGroup) => {
	if (getUserGroup(msg) >= commands.sshstatus.permission) {
		try {
			const { stdout, stderr } = await exec('./pingssh')
			if (stderr) {
				err('Error pinging server:', stderr)
				msg.channel.send('There was an error in attempting to ping server. I have no idea if it is up or not')
			}

			if (stdout === 'open\n') {
				msg.channel.send('SSH is up')
			} else {
				msg.channel.send('SSH is down, thats not good')
			}
		} catch (e) {
			err('Error pinging server:', e)
		}
	} else {
		msg.channel.send('You are not authorized to check ssh status')
	}
}

const killBot = (msg, getUserGroup) => {
	if (getUserGroup(msg) >= commands.kill.permission) {
		msg.channel.send('Ouch okay, guess I am dead now :(')

		// Timeout to ensure message is sent
		setTimeout(() => process.exit(), 750)
	} else {
		msg.channel.send('Haha you can\'t kill me! Nice try tho peasant ;)')
	}
}

const commands = { 
	bot: {
		description: 'Chat with the bot',
		action: (params) => {
			params.channel.send(getGreeting(params.client))
		},
		permission: permissionGroups['default']
	},
	status: {
		description: 'Get server status',
		action: (params) => {
			reportServerStatus(params.channel)
		},
		permission: permissionGroups['default']
	},
	sshstatus: {
		description: 'Check status of ssh connection',
		action: (params) => {
			reportSSHStatus(params.msg, params.getUserGroup)
		},
		permission: permissionGroups['admin']
	},
	kill: {
		description: 'Kill the bot (don\'t do that pls <3)',
		action: (params) => {
			killBot(params.msg, params.getUserGroup)
		},
		permission: permissionGroups['admin']
	},
	help: {
		description: 'List all commands',
		action: (params) => {
			params.channel.send(getCommandList(params.msg, params.getUserGroup))
		},
		permission: permissionGroups['default']
	}
}

module.exports = commands