const redis = require('redis')
const jlast = require('jlast')
const _ = require('lodash')
const $ = require('colors')
const fs = require('fs')

// log hook

const log = function (...args) {
	console.info($.yellow('mem *', ...args))
}

// redis

// create client
const mem = redis.createClient(6379, '127.0.0.1')

// handle events
mem.on('error', function (e, ...args) {
	throw new Error(e, ...args)
})
mem.on('ready', function (...args) {
	log('ready', ...args)
})
mem.on('connect', function (...args) {
	log('connected', ...args)
})
mem.on('reconnecting', function (...args) {
	log('reconnecting', ...args)
})
mem.on('warning', function (...args) {
	log('warning', ...args)
})
mem.on('end', function (...args) {
	log('end', ...args)
})

// mem control

/*

MEM COLLECTION METHODS

get - returns mem set
add - adds to mem set
rem - removes from mem set

EXAMPLE get users that are being logging
mem.bot.logging.get()
EXAMPLE add user to be followed
mem.bot.logging.add({who: 'nick'})

*/

// MemCollections return arrays of {when, who, where, what, why}
function MemCollection () {

	this.col = [] // this set simulates redis

	this.get = function ({when = null, who = null, where = null, what = null, why = null} = {why: false}, ...pick) {

		if (why === false) throw new Error('MemCollection method called with no arguments')
		// gets logs where all non null parameters === corresponding properties
		let result = _.filter(this.col, (o) => (when === null || o.when === when) && (who === null || o.who === who) && (where === null || o.where === where) && (what === null || o.what === what) && (why === null || o.why === why))
		
		return pick.length ? _.map(result, (o) => _.pick(o, pick)) : result
		
	}

	this.add = function ({when = Date.now(), who = null, where = null, what = null, why = null} = {why: false}) {

		if (why === false) throw new Error('MemCollection method called with no arguments')
		// adds logs with properties defaulting to null
		this.col.push({when: when, who: who, where: where, what: what, why: why})
		
		return this.col

	}

	this.rem = function ({when = null, who = null, where = null, what = null, why = null} = {why: false}) {

		if (why === false) throw new Error('MemCollection method called with no arguments')
		// rems logs where all non null parameters === corresponding properties
		_.remove(this.col, (o) => (when === null || o.when === when) && (who === null || o.who === who) && (where === null || o.where === where) && (what === null || o.what === what) && (why === null || o.why === why))
		
		return this.col

	}

}

// get data from mem
const mod = module.exports = {
	// obeying
	obeying: new MemCollection(),
	// logging
	logging: new MemCollection(),
	// logs
	log: new MemCollection(),
	// processed data [the only exception to this mod]
	see: {
		users: {
			karma: function () {

			},
			where: function () {

			},
			akas: function () {

			},
		},
	},
}
