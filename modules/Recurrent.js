import { readFileSync, rmSync, writeFileSync } from 'fs'
import Util from './Util.js'
import Static from './Static.js'
import Journal from './Journal.js'
import Api from './Api.js'
import Stats from './Stats.js'

const Sent = {}
Sent.get = function(type) {
    const { sent } = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    return sent[type]
}
Sent.set = function(type, state) {
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    notifs.sent[type] = state
    writeFileSync('./data/notifs.json', JSON.stringify(notifs))
}

export function birthdaySpectator() {
    const flag = Sent.get('bdays')
    // скидываем флаг отправки в полночь
    const now = new Date()
    if (now.getHours() == 0 && now.getMinutes() == 0 && flag) return Sent.set('bdays', false)
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8')).bdays
    // подписчиков нет или уведомление выслано, выходим
    if (!notifs.length || flag) return
    if (now.getHours() < 8) return // разрешаем отправку не раньше 8 утра
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const has_bday = linked.filter(f => f.birthday.slice(5) == now.toISOString().slice(5, 10))
    if (!has_bday.length) return // дней рождения нет, выходим
    // выбираем эмодзи для сообщения (+ пасхалка)
    const icon = now.toISOString().slice(5) == '12-06' ? '😽' : Static.BDAY_EMOJIS[Math.floor(Math.random() * Static.BDAY_EMOJIS.length)]
    Util.log('Sending birthday notifications...')
    if (has_bday.length == 1) { // один именинник
        notifs.forEach((id, offset) => {
            setTimeout(() => {
                Api.query('sendMessage', {
                    chat_id: id,
                    text: `${icon} Сегодня свой ${now.getUTCFullYear() - parseInt(has_bday[0].birthday.slice(0, 4))}-й день рождения празднует ${has_bday[0].first_name} ${has_bday[0].last_name}!`
                }).catch(err => Util.error(`Birthday notification to ${id} failed:`, err))
            }, offset * 40)
        })
    } else { // несколько именинников
        const mapped = has_bday.map(m => `${m.first_name} ${m.last_name} (${Util.pluralString(now.getUTCFullYear() - parseInt(m.birthday.slice(0, 4)), ['год', 'года', 'лет'])})`)
        notifs.forEach((id, offset) => {
            setTimeout(() => {
                Api.query('sendMessage', {
                    chat_id: id,
                    text: `${icon} Сегодня день рождения празднуют ${Util.doubleJoin(mapped, ', ', ' и ')}!`
                }).catch(err => Util.error(`Birthday notification to ${id} failed:`, err))
            }, offset * 40)
        })
    }
    Sent.set('bdays', true)
}

export async function journalSpectator() {
    // не дергаем журнал с 11 вечера до 9 утра
    const now = new Date()
    if (now.getHours() >= 23 || now.getHours() < 9) return
    // выбираем тех, у кого есть подписка на оценки
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    if (!notifs.marks.length) return // ни одной подписки - просто выходим
    // открываем список связей, чтобы определить список групп
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const groups = new Set([
        ...notifs.marks.map(m => linked.find(f => f.tg == m).group),
        ...notifs.misses.map(m => linked.find(f => f.tg == m).group)
    ])
    if (!groups.size) return // ни одной группы нет - выходим
    // готовим список предметов и старые оценки
    const subjects = JSON.parse(readFileSync('./data/subjects.json', 'utf8'))
    const data_file = JSON.parse(readFileSync('./data/marks.json', 'utf8')) || {}
    // делаем обход по группам
    const broadcast = {}
    let done_request_counter = 0
    let request_counter = 0

    // const is_available = await Journal.checkCookie().catch(err => Util.error('Failed to check cookie in `journalSpectator`:', err))
    // if (!is_available) return

    groups.forEach(group => {
        const semester = Journal.getSemesterByGroup(group)
        // (на случай, если структур нет)
        if (!data_file[group]) data_file[group] = {}
        if (!data_file[group][semester]) data_file[group][semester] = []
        // обходим каждый предмет, асинком получая данные
        const entry = data_file[group][semester]
        request_counter += subjects[group][semester - 1].length
        subjects[group][semester - 1].forEach(async subj => {
            const old_data = entry.find(f => f.subject[0] == subj)
            const data = await Journal.getMarks(group, subj, semester).catch(err => Util.error(`Failed to get marks for ${subj} in semester #${semester} in \`marksInterval\`:`, err))
            if (!data) return
            const diff = Journal.compareMarks(old_data?.marks || [], data.marks)

            // обрабатываем изменения
            diff.added.forEach(e => {
                const emoji_base = typeof e.mark === 'number' ? Math.floor(e.mark) : e.mark
                if (!broadcast[e.stud]) broadcast[e.stud] = {}
                if (!broadcast[e.stud][data.subject[1]]) broadcast[e.stud][data.subject[1]] = []
                broadcast[e.stud][data.subject[1]].push(`${Journal.MARK_TYPES[emoji_base]?.[0] || Journal.MARK_TYPES.UNK} ${e.mark} за ${Journal.WORK_TYPES[e.type][0]} от ${e.date}`)
            })
            diff.edited.forEach(e => {
                const emoji_base = typeof e.mark.after === 'number' ? Math.floor(e.mark.after) : e.mark.after
                if (!broadcast[e.stud]) broadcast[e.stud] = {}
                if (!broadcast[e.stud][data.subject[1]]) broadcast[e.stud][data.subject[1]] = []
                broadcast[e.stud][data.subject[1]].push(`${Journal.MARK_TYPES[emoji_base]?.[0] || Journal.MARK_TYPES.UNK} ${e.mark.before} → ${e.mark.after} за ${Journal.WORK_TYPES[e.type][0]} от ${e.date}`)
            })
            diff.removed.forEach(e => {
                if (!broadcast[e.stud]) broadcast[e.stud] = {}
                if (!broadcast[e.stud][data.subject[1]]) broadcast[e.stud][data.subject[1]] = []
                broadcast[e.stud][data.subject[1]].push(`❌ ${e.mark} убрана за ${Journal.WORK_TYPES[e.type][0]} от ${e.date}`)
            })

            // записываем новые оценки
            const obj = {
                subject: data.subject,
                teacher: data.teacher,
                lesson_count: data.lesson_count,
                marks: data.marks
            }
            if (!old_data) entry.push(obj)
            else entry[entry.findIndex(f => f.subject[0] == subj)] = obj
            done_request_counter++
        })
    })
    const waiting_timer = setInterval(() => {
        if (done_request_counter != request_counter) return
        clearInterval(waiting_timer)
        console.log(broadcast)
        // собираем тексты
        const texts = {}
        notifs.marks.forEach(tg => {
            const user = linked.find(f => f.tg == tg)
            if (!user || !Object.keys(broadcast).includes(user.id.toString())) return
            const filter_misses = !notifs.misses.includes(tg)
            const entry = broadcast[user.id]
            let text = []
            for (const subj in entry) {
                if (filter_misses) entry[subj] = entry[subj].filter(f => !f.match(Journal.MARK_TYPES['Н'][0]))
                if (!entry[subj].length) continue
                text.push(`*${subj}:*\n${entry[subj].join('\n')}`)
            }
            if (!text.length) return
            texts[tg] = text.join('\n\n')
        })
        console.log(texts)
        Util.log('Sending journal notifications...')
        //! делать рассылку по 20-25 сообщений на "страницу"
        for (let i = 0; i < Math.ceil(Object.keys(texts).length / 20); i++) {
            Object.keys(texts).slice(i * 20, i * 20 + 20).forEach((chat_id, offset) => {
                setTimeout(() => {
                    Api.query('sendMessage', {
                        chat_id,
                        parse_mode: 'MarkdownV2',
                        text: Util.escapeNotFormatting('*✏ Новости из журнала!*\n' + texts[chat_id])
                    }).catch(err => Util.error(`Journal notification to ${chat_id} failed:`, err))
                }, offset * 40 + i * 1000)
            })
        }
        writeFileSync(`./data/marks.json`, JSON.stringify(data_file), 'utf8')
        Stats.updateStat('last_journal', Date.now())
    }, 1000)
}

export async function provisionSpectator() {
    const flag = Sent.get('provision')
    // скидываем флаг отправки в полночь
    const now = new Date()
    if (now.getHours() == 0 && now.getMinutes() <= 10 && flag) return Sent.set('provision', false)
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8')).provision
    // подписчиков нет или уведомление выслано, выходим
    if (!notifs.length || flag) return
    if (now.getHours() >= 22 || now.getHours() < 9) return // не дергаем журнал с 10 вечера до 9 утра
    if (now.getHours() < 9) return // разрешаем отправку не раньше 9 утра

    const data = await Journal.getRemoteProvision().catch(err => Util.error('Failed to get remote provision in `provisionSpectator`:', err))
    if (!data) return
    if (!Object.keys(data).length) return
    const rows = []
    for (const subj in data) rows.push(`*${Util.escapeReserved(subj)}*\n${data[subj].map(m => `🔹 [${Util.escapeReserved(Util.decipherEntities(m.theme))}](https://ies.unitech-mo.ru/translation_show?edu=${m.hash})`).join('\n')}`)

    Util.log('Sending provision notifications...')
    notifs.forEach((id, offset) => {
        setTimeout(() => {
            Api.query('sendMessage', {
                chat_id: id,
                parse_mode: 'MarkdownV2',
                text: `💻 *Внимание всем, сегодня дистант\\!*\n${rows.join('\n\n')}`,
                disable_web_page_preview: true
            }).catch(err => Util.error(`Provision notification to ${id} failed:`, err))
        }, offset * 40)
    })
    Sent.set('provision', true)
}
export function filePurger() {
    Util.log('Checking files to purge...')
    const cache = JSON.parse(readFileSync('./data/files.json'))
    const now = Date.now()
    const offset = 2 * 86400 * 1000
    const base_length = cache.length
    for (let i = 0; i < base_length; i++) {
        const entry = cache[i]
        if (entry.cached_at + offset > now) continue
        rmSync(`./files/${entry.hash}.${entry.type}`)
        cache.splice(i, 1)
    }
    const diff = base_length - cache.length
    if (!diff) return
    Util.log(`Purged ${diff} files`)
    writeFileSync('./data/files.json', JSON.stringify(cache), 'utf8')
}

let heartbeat_warn = false
export function heartbeat() {
    const { last_update } = Stats.getStats()
    if (last_update + 5 * 60e3 > Date.now()) return
    else heartbeat_warn = false
    if (heartbeat_warn) return
    Util.warn(`Last update was received more than 5 minutes ago. Bot is down?`)
    Api.query('sendMessage', {
        chat_id: Static.MASTER_ID,
        text: `❌ Последнее обновление от Telegram API было выполнено более 5 минут назад. Нужна проверка состояния бота.`
    }).catch(() => heartbeat_warn = false)
    .then(() => heartbeat_warn = true)
}

export default {
    birthdaySpectator,
    journalSpectator,
    provisionSpectator,
    filePurger,
    heartbeat
}
