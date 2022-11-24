/**
 * @typedef Stats
 * @prop {number} last_update Таймштамп последнего получения сообщений
 * @prop {number} last_journal Таймштамп последнего просмотра журнала
 * @prop {number} got_messages Количество обработанных сообщений
 * @prop {number} caught_errors Количество обработанных ошибок
 * @prop {number} uptime Время работы в миллисекундах
 * @prop {{[k:string]:number}} subscribers Количество подписчиков на каждый тип уведомлений
 * @prop {number} users Количество активных пользователей
 */

import { readFileSync } from 'fs'
import { count as getUserCount } from './Scenes.js'

const STARTUP = Date.now()
const STATIC_STATS = {
    last_update: Date.now(),
    last_journal: Date.now(),
    got_messages: 0,
    caught_errors: 0
}

/**
 * Получает данные по статистике
 * @returns {Stats} объект статистики
 */
export function getStats() {
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    return {
        uptime: Date.now() - STARTUP,
        subscribers: Object.fromEntries(Object.keys(notifs).slice(0, -1).map(m => ([m, notifs[m].length]))),
        users: getUserCount(),
        ...STATIC_STATS
    }
}

/**
 * Изменяет значение одного из статов
 * @param {string} key ключ стата
 * @param {number|'++'} value новое значение. `"++"` инкрементирует текущее на 1
 */
export function updateStat(key, value) {
    if (typeof STATIC_STATS[key] === 'undefined') throw new ReferenceError(`key ${key} is not a stat`)
    if (value === '++') STATIC_STATS[key]++
    else STATIC_STATS[key] = value
}
