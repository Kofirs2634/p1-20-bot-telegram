import { readFileSync } from 'fs'
import { MASTER_ID } from './Static.js'

/**
 * Сериализует объект в GET-параметры адресной строки
 * @param {string} url исходный URL
 * @param {{[key:string]:string}} data объект с параметрами
 * @returns строка с URL и сериализованными параметрами
 */
export function urlWithParams(url, data) {
    return `${url}?${new URLSearchParams(data)}`
}

/**
 * Удаляет все пробелы с начала и конца строки
 * @param {string} str исходная строка
 * @returns строка с удаленными пробелами
 */
export function trim(str) {
    return str.replace(/^\s+|\s+$/g, '')
}

/**
 * Определяет форму множественного числа
 * @param {number} x число объектов
 * @param {[string, string, string]} forms формы числа — "один", "два", "несколько"
 * @returns форма множественного числа
 */
export function plural(x, forms) {
    if (11 <= x && x <= 19) return forms[2]
    else if (x % 10 == 1) return forms[0]
    else if (2 <= x % 10 && x % 10 <= 4) return forms[1]
    else return forms[2]
}

/**
 * Использует форму множественного числа из {@link plural} и дополнительно указывает число объектов
 * @param {number} x число объектов
 * @param {[string, string, string]} forms формы объекта — "один", "два", "несколько"
 * @returns число объектов вместе с формой множественного числа
 */
export function pluralString(x, forms) {
    return `${x} ${plural(x, forms)}`
}

/**
 * Работает как `Array.join`, но позволяет указать два сепаратора
 * @param {any[]} array исходный массив
 * @param {string} sep первый сепаратор
 * @param {string} last_sep второй сепаратор (между двумя последними элементами)
 * @returns получаенная из массива строка
 */
export function doubleJoin(array, sep, last_sep) {
    return array.slice(0, -1).join(sep) + last_sep + array[array.length - 1]
}

/**
 * Логирует событие в консоль с указанием даты
 * @param {...any} args аргументы вывода
 */
export function log(...args) {
    console.log(`[${new Date().toISOString()}]`, ...args)
}

/**
 * Логирует предупреждение в консоль с указанием даты
 * @param {...any} args аргументы вывода
 */
 export function warn(...args) {
    console.log(`[${new Date().toISOString()}] [WARN]`, ...args)
}

/**
 * Логирует ошибку в консоль с указанием даты
 * @param {...any} args аргументы вывода
 */
 export function error(...args) {
    console.log(`[${new Date().toISOString()}] [ERROR]`, ...args)
}

/**
 * Сравнивает два объекта
 * @param {object} obj1 первый объект
 * @param {object} obj2 второй объект
 * @returns `true`, если объекты равны, `false` в противном случае
 */
export function objEqual(obj1, obj2) {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    if (keys1.length != keys2.length) return false
    const matching1 = keys1.filter(f => !keys2.includes(f))
    const matching2 = keys2.filter(f => !keys1.includes(f))
    if (matching1.length || matching2.length) return false
    let eq = true
    keys1.forEach(key => {
        if (!eq) return
        if (obj1[key] != obj2[key]) eq = false
    })
    return eq
}

/**
 * Декодирует некоторые HTML-сущности
 * @param {string} str 
 * @returns раскодированная строка
 */
export function decipherEntities(str) {
    const dict = {
        nbsp: ' ', lt: '<', gt: '>', amp: '&',
        quot: '"', apos: '\'', ndash: '–', mdash: '—'
    }
    return str.replace(/&([a-z]+);/g, (_, name) => dict[name] || `&${name};`)
        .replace(/&#8230;/g, '…')
}

/**
 * Экранирует некоторые символы для отправки в Telegram API при `parse_mode="MarkdownV2"`
 * @param {string} str исходная строка
 * @returns экранированная строка
 */
export function escapeReserved(str) {
    return str.replace(/([_*\[\]\(\)~`>#\+\-=\|\{\}\.!])/g, '\\$1')
}

/**
 * Экранирует символы, не являющиеся синтаксисом форматирования Markdown, для отправки в Telegram API
 * @param {string} str исходная строка
 * @returns экранированная строка
 */
export function escapeNotFormatting(str) {
    return str.replace(/([\[\]\(\)>#\+\-=\{\}\.!])/g, '\\$1')
}

/**
 * Форматирует полное ФИО в краткую форму "фамилия, инициалы"
 * @param {string} fullname Полное имя
 * @returns Краткое имя
 */
export function formatName(fullname) {
    const parts = fullname.split(/\s+/g)
    if (parts.length < 2) return fullname
    else return `${parts[0]} ${parts.slice(1).map(m => `${m.slice(0, 1)}.`).join(' ')}`
}

/**
 * Определяет, принадлежит ли данный ID админу бота
 * @param {number} id Проверяемый ID
 * @returns `true`, если пользователь является админом
 */
export function isAdmin(id) {
    return id === MASTER_ID
}

/**
 * Создает хеш для файла длиной 32 символа
 * @returns новый хеш
 */
export function makeHash() {
    return 'x'.repeat(32).replace(/x/g, () => Math.floor(Math.random() * 0x10).toString(16))
}

/**
 * Показывает относительный таймштамп для указанного момента времени
 * @param {number} ms таймштамп целевого момента в миллисекундах UNIX
 * @returns строка с относительным таймштампом
 */
export function timeago(ms) {
    let now = Date.now()
    let diff = (now - ms) / 1000
    let forms = {
        s: ['секунду', 'секунды', 'секунд'],
        m: ['минуту', 'минуты', 'минут'],
        h: ['час', 'часа', 'часов'],
        d: ['день', 'дня', 'дней'],
        mo: ['месяц', 'месяца', 'месяцев'],
        y: ['год', 'года', 'лет']
    }
    if (diff / 31536e3 >= 1) {
        let y = Math.floor(diff / 31536e3)
        return pluralString(y, forms.y)
    } else if (diff / 2678400 >= 1) {
        let mo = Math.floor(diff / 2678400)
        return pluralString(mo, forms.mo)
    } else if (diff / 86400 >= 1) {
        let d = Math.floor(diff / 86400)
        return pluralString(d, forms.d)
    } else if (diff / 3600 >= 1) {
        let h = Math.floor(diff / 3600)
        return pluralString(h, forms.h)
    } else if (diff / 60 >= 1) {
        let m = Math.floor(diff / 60)
        return pluralString(m, forms.m)
    } else if (diff >= 1) {
        let s = Math.floor(diff)
        return pluralString(s, forms.s)
    } else return `меньше секунды`
}

/**
 * Форматирует время в формате `HH:MM:SS`
 * @param {number} ms форматируемое число времени в миллисекундах
 * @returns отформатированная строка
 */
export function formatTime(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor((ms / 60000) - (h * 60))
    let s = Math.floor(ms % 60000 / 1000)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

/**
 * Получает значение указанного ключа из файла с конфигом
 * @param {string} key Ключ настройки
 * @returns {string=} Значение ключа
 */
export function getConfig(key) {
    /** @type {[string,string][]} */
    const config = readFileSync('./CONFIG.yaml', 'utf8').split('\n').map(m => m.split(/\s*:\s/))
    return config.find(f => f[0] === key)?.[1] || undefined
}
