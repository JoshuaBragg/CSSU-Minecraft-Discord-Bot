'use strict'
const Discord = require('discord.js')
const fs = require('fs')
const ms = require('./minestat')
const commands = require('./commandHelper')

const client = new Discord.Client()

const log = console.log
const err = console.error

let currStatus = 1
let statusChannel
let serverAdminRole
let polledStatusQueue = [1, 1, 1, 1, 1]

const DEBUG = false
const permissionGroups = JSON.parse(fs.readFileSync('permissionGroups.json', 'utf8'))
const BOT_SECRET_TOKEN = fs.readFileSync('bot.token', 'utf8')
const STATUS_CHANNEL_ID = DEBUG ? fs.readFileSync('debug_channel.id', 'utf8') : fs.readFileSync('channel.id', 'utf8')
const SERVER_ADMIN_ID = fs.readFileSync('server_admin.id', 'utf8')


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

	initPoll()

}, (error) => {
	err('Failed to connect')
})

client.on('message', (message) => {
	if (message.author == client.user || message.channel.id !== STATUS_CHANNEL_ID) {
		// Ignore messages that the bot writes
		// Ignore messages that are not in status channel
		return
	}

	if (message.content.startsWith('!')) {
		const command = message.content.substr(1)

		if (command in commands) {
			const params = { msg: message, channel: message.channel, command: command, client: client }
			commands[command].action(params)
		} else {
			message.channel.send('Don\'t recognize that command? Try !help to see what I can do')
		}
	}
})

const initPoll = () => {
	const pollFreq = 6 // seconds

	setInterval(() => {
		ms.init('mc.cssu.ca', 25565, (success) => {
			// Add new status to poll queue
			polledStatusQueue.shift()
			polledStatusQueue.push(success)

			if (success !== currStatus && polledStatusQueue.every((val, i, arr) => val === arr[0])) {
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

client.login(BOT_SECRET_TOKEN)