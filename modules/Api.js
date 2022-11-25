import fetch from 'node-fetch'
import * as Util from './Util.js'
import * as Scenes from './Scenes.js'
import * as Handlers from './Handlers.js'
import * as Static from './Static.js'
import * as Stats from './Stats.js'

const TOKEN = Util.getConfig('API_TOKEN')
let OFFSET = 0

export function query(method, data) {
    return new Promise(async (res, rej) => {
        const request = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
            method: 'post',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(data)
        }).catch(err => { Util.error('Request failed due to network reasons:', err) })
        if (!request) return rej('network failure')
        const response = await request.json()
        if (!response.ok) return rej(response)
        res(response)
    })
}

/**
 * Рекурсивная функция для отслеживания новых сообщений
 * @returns {Promise<never>}
 */
export async function listenUpdates() {
    Util.log('Listening...')
    const data = await query('getUpdates', {
        timeout: 50,
        allowed_updates: ['message'],
        offset: OFFSET
    }).catch(err => Util.error('Failed to fetch updates:', err))
    if (typeof data === 'undefined') {
        Util.log('Updates request failed (undefined value), trying to return to recursion')
        return listenUpdates()
    }
    if (!data) {
        Util.log('Updates request failed (falsy value), trying to return to recursion')
        return listenUpdates()
    }

    data.result.forEach(update => {
        const { update_id, message } = update
        OFFSET = update_id + 1

        const { text, from } = message
        let scene = Scenes.get(from.id)
        if (Static.DEV_MODE && ![403241596, 5799729218].includes(from.id)) {
            Util.warn(`Ignored message #${message.message_id} from @${from.username} (ID ${from.id}): "${text}"`)
            Handlers.sendDevWarn(from.id, true)
            return
        }
        Util.log(`Got message #${message.message_id} from @${from.username} (ID ${from.id}): "${scene === 'autovisit_await' ? '[ДАННЫЕ УДАЛЕНЫ]' : text}"`)
        Stats.updateStat('got_messages', '++')
        try {
            for (const handler in Handlers) {
                if (typeof Handlers[handler] !== 'function') continue
                Handlers[handler](text, from, scene)
                if (handler == '_returnButton') scene = Scenes.get(from.id)
            }
        } catch (err) {
            Util.error(`Caught an error while handling message:`, err)
            Stats.updateStat('caught_errors', '++')
        }
    })

    Stats.updateStat('last_update', Date.now())

    return listenUpdates()
}
