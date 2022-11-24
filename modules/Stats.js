import { readFileSync } from 'fs'
import { count as getUserCount } from './Scenes.js'

const STARTUP = Date.now()
const STATIC_STATS = {
    last_update: Date.now(),
    last_journal: Date.now(),
    got_messages: 0,
    caught_errors: 0
}

export function getStats() {
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    return {
        uptime: Date.now() - STARTUP,
        subscribers: Object.fromEntries(Object.keys(notifs).slice(0, -1).map(m => ([m, notifs[m].length]))),
        users: getUserCount(),
        ...STATIC_STATS
    }
}

export function updateStat(key, value) {
    if (typeof STATIC_STATS[key] === 'undefined') throw new ReferenceError(`key ${key} is not a stat`)
    if (value === '++') STATIC_STATS[key]++
    else STATIC_STATS[key] = value
}

export default {
    getStats,
    updateStat
}