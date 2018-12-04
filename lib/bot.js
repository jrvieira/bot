const emitter = require('events')
const bot = require('./core.js')
const mem = require('./mem.js')
const $ = require('colors')
const fs = require('fs')
const _ = require('lodash')

// debug

const debug = false;

const log = function (...args) {
	if (debug) {
		console.info($.green('command *', ...args))
	}
}

// watch

const watch = new emitter() 
watch.clock = {
	week: setInterval(() => watch.emit('week'), 604800000),
	day: setInterval(() => watch.emit('day'), 86400000),
	hour: setInterval(() => watch.emit('hour'), 3600000),
	minute: setInterval(() => watch.emit('minute'), 60000),
	second: setInterval(() => watch.emit('second'), 1000),
}

// utility functions

let irc = {
	// current channel list
	get chans () {
		return Object.keys(bot.chans)
	},
	// schedule
	every (interval, fn) {
		fn()
		watch.on(interval, fn)
	},

}

// behaviour

/*
	USAGE:
	![un]obey $password #$chan|$user [#$chan|$user [...]]
*/

const surveillance = true;

// init

bot.once('registered', function () {

	// join mem.bot.joining channels || ##graphene
	bot.join('##graphene')

	if (surveillance) irc.every('week', surveil)

	// log users
	bot.on('raw', function (msg) {

		// ignore commands
		let ignore_commands = [
			'PONG',
//			'QUIT',
//			'PART',
//			'JOIN'
		]
		// ignore_commands unless own
		if ( ignore_commands.includes(msg.command) && msg.nick !== bot.nick ) return false
		// ignore rpl_*
//		if (msg.command.startsWith('rpl_')) return false
		// ignore codes
//		if (!isNaN(msg.command)) return false
		// ChanServ welcome to channel notices
		if (msg.args && msg.args.length > 1 && msg.args[1].startsWith('[#')) return false

		// log raw events
		log('RAW')
		log(JSON.stringify(msg))

		// format input
		let input = {
			user: msg.nick,
			host: msg.host,
			chan: msg.args.shift(),
			args: msg.args.length ? msg.args[0].split(' ') : [],
			msg: msg,
		}
		if (mem.logging.get({who: input.user, what: 'user'}).length || mem.logging.get({where: input.chan, what: 'chan'}).length) {
			mem.log.add({who: input.user, where: input.chan, what: input.command, why: input})
		}

		// handle messages
		if (msg.command === 'PRIVMSG' || msg.command === 'NOTICE') {

			log('PRIVMSG || NOTICE')
			log(JSON.stringify(input))

			// if obeying user and command exists, emit command
			if (commands.get(input.args[0]) && (mem.obeying.get({who: input.user, what: 'user'}).length) || mem.obeying.get({where: input.chan, what: 'chan'}).length) {
				
				input.comm = input.args.shift()
				bot.emit('command', input)

			// if obedience command and password
			} else if ((input.args[0] === '!obey' || input.args[0] === '!unobey') && input.args[1] === process.argv[3]) {

				input.comm = input.args.shift() // remove command
				input.args.shift() // remove password

				if (input.comm === '!obey') {

					input.args.forEach(function(master) {

						let type = master[0] === '#' ? 'chan' : 'user'
						mem.obeying.add({who: type === 'user' ? master : input.user, where: type === 'chan' ? master : input.chan, what: type, why: input})

					})

				} else if (input.comm === '!unobey') {

					input.args.forEach(function(master) {

						mem.obeying.rem({who: master})

					})

				}

				bot.notice(input.user, mem.obeying.get({}, ['who']).map(o => o.who).join(' '))

			}

		}

	})

})

// surveil

let surveil_stream

function surveil () {

	// get list of all channels
	bot.list()
	// *once* retrieved
	bot.once('channellist', function (chanlist) {

		// add essential channels
		chanlist = chanlist.map(c => [ '##php',
		  '#mysql',
		  '#raspberrypi',
		  '#haskell',
		  '##math',
		  '#vmware',
		  '#vim',
		  '#ubuntu',
		  '#textual',
		  '#mailgun',
		  '#macosx',
		  '#letsencrypt',
		  '#laravel',
		  '#github',
		  '#git',
		  '#debian',
		  '#bash',
		  '#Node.js',
		  '##zzz',
		  '##please_register',
		  '##linux',
		  '##javascript',
		  '##hackers',
		  '##graphene',
		  '##digitalocean',
		  '##rust',
		  '##programming',
		 ].includes(c.name) ? {name: c.name, users: 9999999} : c)

		// remove undesireable channels
		chanlist = chanlist.filter(c => ![
			'#shoutcastgui',
		].includes(c.name))

		// rank by users
		chanlist = _.orderBy(chanlist, c => parseInt(c.users), 'desc')
		
		// join most popular
		let limit = 120
		for (chan of chanlist) {
			if ( !irc.chans.includes(chan.name) ) bot.join(chan.name)
		 	if (!limit --) break;
		}
	
	})

	// end recent stream
	surveil_stream && surveil_stream.end('\n* end of watch *\n')

	// stream new logs to ./mem/file
	surveil_stream = fs.createWriteStream(`mem/surveil/${console.timestamp()}.log`)

}

// write to active stream
bot.on('message#', function  (nick, chan, text, message) {
	surveil_stream && surveil_stream.write(`${console.timestamp()} ${chan} ${nick} ${text} \n`)
})

// commands

const commands = new Map ([

	// repeats msg back to you
	['!repeat', function (input) {
		
		bot.notice(input.user, input.args.join(' '))

	}],
	// reloads module
	['!update', function (input) {

		watch.emit('day')
		watch.emit('hour')
		watch.emit('minute')
		//watch.emit('second')

	}],
	// chans
	['!chans', function (input) {

		bot.notice(input.user, 'chans:\n'+irc.chans.join(' '))

	}],
	// log
	['!log', function (input) {

		input.args.forEach(function(user) {
			mem.logging.add({who: user})
		})
		bot.notice(input.user, 'logging works, todo: notice mem.obeying list')

	}],
	// unlog
	['!unlog', function (input) {

		input.args.forEach(function(user) {
			mem.logging.rem({who: user})
		})
		bot.notice(input.user, 'unlogging works, todo: notice mem.obeying list')

	}],
	// dump // TODO: SAVE TO A FILE AND SEND
	['!mem', function (input) {

		if (input.args[0]) {

			let type = input.args[0][0] === '#' ? 'where' : 'who'
			let result = mem.log.get({[type]: input.args.shift()}, ...input.args)

			result.forEach(function (o) {
				log('o :', JSON.stringify(o))
				let h = {}
				h.when = o.when ? format(+o.when, 'YYYY MM DD HH:mm.ss ') : ''
				h.who = o.who ? o.who+': ' : ''
				h.where = o.where ? '['+o.where+'] ' : ''
				h.what = o.what ? '* '+o.what+' ' : ''
				h.why = o.why ? '? '+o.why : ''
				log('h :', JSON.stringify(h))
				bot.notice(input.chan, (h.what+h.when+h.where+h.who+h.why))
			})

		}

	}],

])

// handle commands
bot.on('command', function (input) {

	log('COMMAND')
	log(JSON.stringify(input))

	// mem command
	mem.log.add({who: input.user, where: input.chan, what: 'command', why: input})
	// run command
	commands.get(input.comm)(input)

})
