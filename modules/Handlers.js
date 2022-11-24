import { readFileSync, writeFileSync } from 'fs'

import Static from './Static.js'
import Scenes from './Scenes.js'
import Api from './Api.js'
import Util from './Util.js'
import Button from './Button.js'
import Keyboard from './Keyboard.js'
import Journal from './Journal.js'
import Stats from './Stats.js'

function handleMessageSendRejection(err, to) {
    Util.error('Alarm, there\'s an error while message sending!', err)
    Api.query('sendMessage', {
        chat_id: to,
        text: 'Во время отправки ответа произошла ошибка. Возможно, кое-кто забыл экранировать зарезервированные символы. Отпишись об этом @Nerotu, пожалуйста, он должен помочь.',
    })
}

function findNearestBirthdays(count = 5) {
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const bdays = linked.map(m => {
        const date = new Date().getUTCFullYear() + (m.birthday.slice(5, 7) == '01' && new Date().getUTCMonth() > 0 ? 1 : 0) + m.birthday.slice(4)
        return [
            `${m.first_name.slice(0, 1)}. ${m.last_name}`,
            m.birthday,
            Math.floor((new Date(date).getTime() - Date.now()) / 1000 / 3600 / 24) + 1
        ]
    })
    const nearest = bdays.filter(f => f[2] >= 0).sort((a, b) => a[2] - b[2]).slice(0, count)
    return nearest
}

function getAbsenceMark(percent) {
    if (percent == 100) return '🔵'
    else if (percent >= 80) return '🟢'
    else if (percent >= 65) return '🟡'
    else if (percent >= 50) return '🟠'
    else if (percent && percent < 50) return '🔴'
    else return '⚫'
}

function getZodiacSign(date) {
    function dateInRange(begin, end, target) {
        begin = new Date(`1970-${begin}`)
        end = new Date(`1970-${end}`)
        target = new Date(`1970-${target}`)
        if (begin.getUTCMonth() == 11 && end.getUTCMonth() == 0) end = new Date(`1971-${end.toISOString().slice(5, 10)}`)
        return begin.getTime() <= target.getTime() && target.getTime() < end.getTime()
    }
    date = date.slice(5)
    if (dateInRange('03-21', '04-20', date)) return '♈️'
    else if (dateInRange('04-20', '05-21', date)) return '♉️'
    else if (dateInRange('05-21', '06-21', date)) return '♊️'
    else if (dateInRange('06-21', '07-23', date)) return '♋️'
    else if (dateInRange('07-23', '08-23', date)) return '♌️'
    else if (dateInRange('08-23', '09-23', date)) return '♍️'
    else if (dateInRange('09-23', '10-23', date)) return '♎️'
    else if (dateInRange('10-23', '11-23', date)) return '♏️'
    else if (dateInRange('11-23', '12-22', date)) return '♐️'
    else if (dateInRange('12-22', '01-20', date)) return '♑️'
    else if (dateInRange('01-20', '02-19', date)) return '♒️'
    else if (dateInRange('02-19', '03-21', date)) return '♓️'
    else return '❓'
}

export function start(text, from) {
    if (text !== '/start') return
    Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Жду дальнейших указаний.',
        reply_markup: Util.isAdmin(from.id) ? Keyboard.MAIN_WITH_ADMIN : Keyboard.MAIN
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'main'))
}
export function returnButton(text, from, scene) {
    if (text !== Button.BACK) return
    switch (scene) {
        case 'journal':
        case 'admin':
        case 'notifs':
        case 'birthdays': Scenes.set(from.id, 'main'); break
        case 'autovisit_online': Scenes.set(from.id, 'journal'); break
    }
}
export function mainMenu(text, from, scene) {
    if (!(scene === 'main' && text === Button.BACK)) return
    Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Жду дальнейших указаний.',
        reply_markup: Util.isAdmin(from.id) ? Keyboard.MAIN_WITH_ADMIN : Keyboard.MAIN
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function birthdaysMenu(text, from, scene) {
    if (!(scene === 'main' && text === Keyboard.MAIN.keyboard[0][1] /*||
          text === Button.BACK && scene === 'birthdays'*/)) return

    const nearest = findNearestBirthdays()
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(`Ближайшие дни рождения:\n${nearest.map(m => `🔹 *${new Date(m[1]).toLocaleString('ru', Static.DATE_FORMAT_DM)}* — ${m[0]} ${m[2] == 0 ? '(сегодня)' : `(остал${Util.plural(m[2], ['ся', 'ось', 'ось'])} ${Util.pluralString(m[2], ['день', 'дня', 'дней'])})`}`).join('\n')}\n\nЧтобы посмотреть другие дни рождения, выбери нужный сезон года.`),
        reply_markup: Keyboard.SEASONS
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'birthdays'))
}
export function commandBirthdays(text, from) {
    if (text !== '/birthdays') return

    const nearest = findNearestBirthdays()
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(`Ближайшие дни рождения:\n${nearest.map(m => `🔹 *${new Date(m[1]).toLocaleString('ru', Static.DATE_FORMAT_DM)}* — ${m[0]} ${m[2] == 0 ? '(сегодня)' : `(остал${Util.plural(m[2], ['ся', 'ось', 'ось'])} ${Util.pluralString(m[2], ['день', 'дня', 'дней'])})`}`).join('\n')}`),
    }).catch(err => handleMessageSendRejection(err, from.id))
}
// export function birthdaysList(text, from, scene) {
//     if (scene !== 'birthdays' || text !== Keyboard.BIRTHDAYS.keyboard[0][1]) return
//     Api.query('sendMessage', {
//         chat_id: from.id,
//         text: 'Выбери месяц, в котором хочешь посмотреть дни рождения.',
//         reply_markup: Keyboard.MONTHS
//     }).catch(err => handleMessageSendRejection(err, from.id))
//     .then(() => Scenes.set(from.id, 'birthlist'))
// }
export function showBirthdays(text, from, scene) {
    const match = text?.match(/^(?:❄️|🌿|🌞|🍁) ([А-Я][а-я]+)$/i)
    // if (scene !== 'birthlist' || !match) return
    if (scene !== 'birthdays' || !match) return

    // const convert = {
    //     'Январь': '01', 'Февраль': '02', 'Март': '03',
    //     'Апрель': '04', 'Май': '05', 'Июнь': '06',
    //     'Июль': '07', 'Август': '08', 'Сентябрь': '09',
    //     'Октябрь': '10', 'Ноябрь': '11', 'Декабрь': '12'
    // }
    const convert = {
        'Зима': ['01', '02', '12'],
        'Весна': ['03', '04', '05'],
        'Лето': ['06', '07', '08'],
        'Осень': ['09', '10', '11']
    }
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const bdays = linked.filter(f => f.birthday.match(new RegExp(`-(${convert[match[1]].join('|')})-`))).sort((a, b) => (
        new Date(`1970-${a.birthday.slice(5)}`).getTime() - new Date(`1970-${b.birthday.slice(5)}`).getTime()
    ))
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(bdays.length ? bdays.map(m => `${getZodiacSign(m.birthday)} *${new Date(m.birthday).toLocaleString('ru', Static.DATE_FORMAT_DMY)}* — ${m.first_name.slice(0, 1)}. ${m.last_name}`).join('\n') : 'В этом сезоне дней рождения нет.')
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function notificationsMenu(text, from, scene) {
    if (!(scene === 'main' && text === Keyboard.MAIN.keyboard[1][0])) return
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Здесь можно установить настройки уведомлений, рассылаемых ботом.',
        reply_markup: Keyboard.NOTIFICATIONS({
            birthdays: notifs.bdays.includes(from.id),
            provision: notifs.provision.includes(from.id),
            marks: notifs.marks.includes(from.id),
            misses: notifs.misses.includes(from.id)
        })
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'notifs'))
}
export function toggleNotification(text, from, scene) {
    const labels = {
        'Дни рождения': 'bdays',
        'Дистант': 'provision',
        'Оценки': 'marks',
        'Пропуски занятий': 'misses'
    }
    const match = text?.match(new RegExp(`^(?:🔕|🔔) (${Object.keys(labels).join('|')})$`))
    if (!(scene === 'notifs' && match)) return
    const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
    const list = notifs[labels[match[1]]]
    const index = list.findIndex(f => f == from.id)
    const was_here = index !== -1
    if (was_here) list.splice(index, 1)
    else list.push(from.id)
    Api.query('sendMessage', {
        chat_id: from.id,
        text: `${match[1]}: уведомления ${was_here ? 'отключены' : 'включены'}.`,
        reply_markup: Keyboard.NOTIFICATIONS({
            birthdays: notifs.bdays.includes(from.id),
            provision: notifs.provision.includes(from.id),
            marks: notifs.marks.includes(from.id),
            misses: notifs.misses.includes(from.id)
        })
    }).catch(err => handleMessageSendRejection(err, from.id))
    writeFileSync('./data/notifs.json', JSON.stringify(notifs), 'utf8')
}
export async function semesterAverage(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[1][0] ||
          text === '/semavg')) return
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))?.find(f => f.tg == from.id)
    if (!linked) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Похоже, твои аккаунты в Telegram и на портале не связаны. Будем устанавливать связь?',
        reply_markup: Keyboard.YESNO
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'linking_start'))

    const semester = Journal.getSemesterByGroup(linked.group)
    const cache = JSON.parse(readFileSync('./data/marks.json', 'utf8'))
    const data = []

    const subjects = cache[linked.group][semester]
    subjects.forEach(entry => {
        const marks = entry.marks.filter(f => f.stud == linked.id && !(f.mark === 0 || isNaN(f.mark)) && f.type == 'audit')
        let total = 0
        marks.forEach(e => total += e.mark)
        const avg = total / marks.length
        data.push({ subject: entry.subject[1], avg })
    })

    data.sort((a, b) => a.subject.localeCompare(b.subject))
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(`Вот средние баллы за ${semester}-й семестр:\n${data.map(m => `🔹 *${m.subject}:* ${!isNaN(m.avg) ? m.avg.toFixed(2) : '—'}`).join('\n')}`)
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export async function absencesReport(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[1][1] ||
          text === '/absences')) return
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))?.find(f => f.tg == from.id)
    if (!linked) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Похоже, твои аккаунты в Telegram и на портале не связаны. Будем устанавливать связь?',
        reply_markup: Keyboard.YESNO
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'linking_start'))

    const cache = JSON.parse(readFileSync('./data/marks.json', 'utf8'))
    const semester = Journal.getSemesterByGroup(linked.group)
    const subjects = cache[linked.group][semester]
    const data = []
    const total = [0, 0]
    const top = Journal.getAbsences(linked.group, semester)

    subjects.forEach(entry => {
        const misses = entry.marks.filter(f => f.stud == linked.id && f.mark == 'Н').length
        data.push({ subject: entry.subject[1], count: [misses, entry.lesson_count] })
        total[0] += misses
        total[1] += entry.lesson_count
    })
    data.sort((a, b) => a.subject.localeCompare(b.subject))
    const rows = data.map(m => {
        const percent = 100 - m.count[0] / m.count[1] * 100
        return `${getAbsenceMark(percent)} *${m.subject}:* ${m.count[0]} из ${m.count[1]}`
    })
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(`Твой отчет по пропускам в ${semester}-ом семестре:\n${rows.join('\n')}\n\nВ общей сложности: ${total.join(' из ')} (посещаемость ${(100 - total[0] / total[1] * 100).toFixed(2)}%, ${top.find(f => f.id == linked.id).place}-е место)`)
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function journalMenu(text, from, scene) {
    if (!(scene === 'main' && text === Keyboard.MAIN.keyboard[0][0] ||
          text === Button.BACK && scene === 'journal')) return
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))?.find(f => f.tg == from.id)

    if (linked) {
        Api.query('sendMessage', {
            chat_id: from.id,
            parse_mode: 'MarkdownV2',
            text: Util.escapeNotFormatting(`Твой аккаунт Telegram связан с Образовательным порталом.\n\n*Имя:* ${linked.first_name.slice(0, 1)}. ${linked.last_name}\n*Группа:* ${linked.group}\n*День рождения:* ${new Date(linked.birthday).toLocaleString('ru', Static.DATE_FORMAT_DM)}\n*Рейтинг:* ${linked.rating}%`),
            reply_markup: Keyboard.JOURNAL
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'journal'))
    } else {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Похоже, твои аккаунты в Telegram и на портале не связаны. Будем устанавливать связь?',
            reply_markup: Keyboard.YESNO
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'linking_start'))
    }
}
export async function refreshProfile(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[0][1])) return
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const user = linked.find(f => f.tg == from.id)
    const data = await Journal.getProfile(user.id).catch(err => Util.error('Failed to get profile in `refreshProfile`:', err))
    if (!data) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'На данный момент журнал недоступен. Прошу прощения за неудобства, попробуй еще раз позже.'
    }).catch(err => handleMessageSendRejection(err, from.id))
    user.group = data.group
    user.avatar = data.avatar
    user.rating = data.rating
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(`Данные журнала обновлены!\n\n*Имя:* ${user.first_name.slice(0, 1)}. ${user.last_name}\n*Группа:* ${user.group}\n*День рождения:* ${new Date(user.birthday).toLocaleString('ru', Static.DATE_FORMAT_DM)}\n*Рейтинг:* ${user.rating}%`)
    }).catch(err => handleMessageSendRejection(err, from.id))
    writeFileSync('./data/linked.json', JSON.stringify(linked), 'utf8')
}
export async function giveSchedule(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[2][0] ||
          text === '/schedule')) return

    // function placehold() {
    //     Api.query('sendChatAction', {
    //         chat_id: from.id,
    //         action: 'typing'
    //     })
    // }
    // placehold()
    // const activity_timer = setInterval(placehold, 5000)

    const data = await Journal.getSchedule().catch(err => Util.error('Failed to get schedule in `giveSchedule`:', err))
    if (!data) {
        // clearInterval(activity_timer)
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'На данный момент журнал недоступен. Прошу прощения за неудобства, попробуй еще раз позже.'
        }).catch(err => handleMessageSendRejection(err, from.id))
        return
    }

    const day_word = data.date === new Date().toLocaleString('ru').slice(0, 10)
        ? 'Сегодня'
        : 'Завтра'
    const holiday = data.lessons.find(f => f.type == 'holiday')
    let message_text = data.lessons.length
        ? holiday
            ? `🥳 ${day_word} у нас *${holiday.name}* — на пары ехать не надо!`
            : String.prototype.concat(
                `*📋 Расписание на ${day_word.toLowerCase()}, ${data.date}*\n\n`,
                data.lessons.map(m => `*${m.lesson} пара:* ${m.subject} (${m.auditory})${m.note ? `\n_⚠ ${m.note}_\n` : ''}`).join('\n')
            )
        : `😎 ${day_word} пар нет!`
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(message_text)
    }).catch(err => handleMessageSendRejection(err, from.id))
    // clearInterval(activity_timer)
}
export async function giveRemoteProvision(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[2][1] ||
          text === '/provision')) return

    const data = await Journal.getRemoteProvision().catch(err => Util.error('Failed to get subjects in `giveRemoteProvision`:', err))
    if (!data) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'На данный момент журнал недоступен. Прошу прощения за неудобства, попробуй еще раз позже.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    let message
    if (!Object.keys(data).length) {
        message = Util.escapeReserved('😮‍💨 Cегодня дистанционных пар нет.')
    } else {
        const rows = []
        for (const subj in data) rows.push(`*${Util.escapeReserved(subj)}*\n${data[subj].map(m => `🔹 [${Util.escapeReserved(Util.decipherEntities(m.theme))}](https://ies.unitech-mo.ru/translation_show?edu=${m.hash})`).join('\n')}`)
        message = `💻 *Дистант на сегодня, ${Util.escapeReserved(new Date().toLocaleString('ru').slice(0, 10))}*\n${rows.join('\n\n')}`
    }
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: message,
        disable_web_page_preview: true
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export async function giveNews(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[3][0])) return
    const data = await Journal.getNews().catch(err => Util.error('Failed to get the feed in `giveNews`:', err))
    if (!data) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'На данный момент журнал недоступен. Прошу прощения за неудобства, попробуй еще раз позже.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    const message_text = data.map(m => String.prototype.concat(
        `[${Util.escapeReserved(m.author)}](https://ies.unitech-mo.ru/user?userid=${m.author_id}) — `,
        `*[${Util.escapeNotFormatting(m.title)}](https://ies.unitech-mo.ru/posts?action=show&postid=${m.id})* \\(от ${Util.escapeReserved(m.date)}\\)\n`,
        `👁 ${m.views.toString().padEnd(5, ' ')} `,
        `❤️ ${m.likes.toString().padEnd(5, ' ')} `,
        `💬 ${m.comments}`
    )).join('\n\n')
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: message_text,
        disable_web_page_preview: true
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function giveLinks(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[3][1])) return
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const user = linked.find(f => f.tg == from.id)

    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: (String.prototype.concat(
            `[👤 Профиль](https://ies.unitech-mo.ru/user?userid=${user.id})\n`,
            `[✉️ Личные сообщения](https://ies.unitech-mo.ru/um)\n`,
            `[🎓 Журнал успеваемости](https://ies.unitech-mo.ru/studentplan?sem=${Journal.getSemesterByGroup(user.group)})\n`,
            `[💻 Дистанционное обеспечение](https://ies.unitech-mo.ru/remote_provision?st_semester=${Journal.getSemesterByGroup(user.group)})\n`,
            `[🗓 Расписание занятий](https://ies.unitech-mo.ru/schedule)`
        )),
        disable_web_page_preview: true
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function touchAutovisit(text, from, scene) {
    if (!(scene === 'journal' && text === Keyboard.JOURNAL.keyboard[4][0])) return

    Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Пока эта функция недоступна, но совсем скоро будет! 😇'
    }).catch(err => handleMessageSendRejection(err, from.id))
    return
    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))?.find(f => f.tg === from.id)
    if (linked.autovisit) {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Автоотмечалка подключена и ждет дистанта. Уведмоления будут приходить, и убрать их нельзя.\nЧтобы отключить автоотмечалку, выбери нужный пункт клавиатуры.',
            reply_markup: Keyboard.AUTOVISIT
        }).then(() => Scenes.set(from.id, 'autovisit_online'))
    } else {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Здесь можно подключить автоотмечалку, которая умеет заходить на дистанционные пары вместо тебя. Попробуешь? 😏',
            reply_markup: Keyboard.YESNO
        }).then(() => Scenes.set(from.id, 'autovisit_offline'))
    }
}
export function checkStatus(text, from, scene) {
    if (!(scene === 'main' && text === Keyboard.MAIN.keyboard[1][1])) return
    Api.query('sendMessage', {
        chat_id: from.id,
        text: '✅ Бот работает.'
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function helpMenu(text, from, scene) {
    if (!(scene === 'main' && text === Keyboard.MAIN.keyboard[2][0] ||
          text === '/help')) return
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: (String.prototype.concat(
            'По вопросам и предложениям: @Nerotu\n',
            'Справочная статья \\(пока не написана\\)\n',
            'Версия 1\\.3\\.1 от 22\\.10\\.2022 \\([лог](https://telegra\\.ph/ruchnoj-bot-p1-20--spisok-izmenenij-10-15)\\)\n\n',
            '*Дополнительные ссылки*\n',
            '[Сообщество в ВК](https://vk\\.com/p1_20_animals)\n'
        )),
        disable_web_page_preview: true
    }).catch(err => handleMessageSendRejection(err, from.id))
}
export function linkingStart(text, from, scene) {
    const match = text?.match(/^(?:✅|❌) (Да|Нет)$/)
    if (!(scene === 'linking_start' && match)) return
    if (match[1] == 'Нет') {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Ну, дело ваше. Только без связи функциональность бота будет сильно ограничена.',
            reply_markup: Keyboard.MAIN
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'main'))
    } else {
        Api.query('sendMessage', {
            chat_id: from.id,
            parse_mode: 'MarkdownV2',
            text: Util.escapeNotFormatting(String.prototype.concat(
                'Для связи нужна ссылка на твой профиль на портале. Вот что нужно сделать:\n',
                '1. Зайди в профиль любого одногруппника.\n',
                '2. Найди в соответствующем списке себя.\n',
                '3. Выдели имя и скопируй ссылку (правая кнопка мыши или долгий тап).\n',
                '4. Если в ссылке есть фрагмент `?userid=<число>`, то вышли ее сообщением без сопутствующего текста.'
            )),
            reply_markup: Keyboard.make([[Button.CANCEL]])
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'linking'))
    }
}
export async function linking(text, from, scene) {
    if (scene !== 'linking') return
    if (text === Button.CANCEL) {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Ну, дело ваше. Только без связи функциональность бота будет сильно ограничена.',
            reply_markup: Keyboard.MAIN
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'main'))
        return
    }
    const id = text?.match(/(?:\bhttps:\/\/ies\.unitech-mo\.ru\/user)?\?userid=(\d+)\b/)?.[1]
    if (!id) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Вижу некорректный ввод — либо ссылка неверная, либо ее нет вообще. Пожалуйста, проверь, все ли сделано правильно, и попробуй еще раз.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
    const profile = await Journal.getProfile(id).catch(err => Util.error('Failed to get profile in `linking`:', err))
    if (!profile) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Ссылка верна, но журнал сейчас недоступен. Попробуй еще раз попозже и извини за неудобства.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    const exists = linked.find(f => f.id == profile.id)
    if (exists?.tg) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Связь с таким профилем уже существует. Если она тебе не принадлежит, обратись в поддержку.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    if (!exists) linked.push({ ...profile, tg: from.id })
    else if (exists.tg == null) exists.tg = from.id
    writeFileSync('./data/linked.json', JSON.stringify(linked), 'utf8')
    Api.query('sendMessage', {
        chat_id: from.id,
        text: `Установлена связь с профилем на портале: ${profile.first_name} ${profile.last_name}, группа ${profile.group}.`,
        reply_markup: Keyboard.MAIN
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'main'))
}
export function linkingCancel(text, from, scene) {
    if (!['journal', 'linking_cancel'].includes(scene)) return
    
    if (text === Keyboard.JOURNAL.keyboard[5][0] && scene === 'journal') {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Разрыв связи с профилем на портале сделает невозможным использование вкладки "Журнал", а также отключит все уведомления. Тебе это точно необходимо?',
            reply_markup: Keyboard.YESNO
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'linking_cancel'))
    } else if (scene === 'linking_cancel') {
        const match = text?.match(/^(?:✅|❌) (Да|Нет)$/)
        if (match[1] == 'Нет') {
            Api.query('sendMessage', {
                chat_id: from.id,
                text: 'Хорошо. Но если сильно понадобится, возвращайся.',
                reply_markup: Keyboard.JOURNAL
            }).catch(err => handleMessageSendRejection(err, from.id))
            .then(() => Scenes.set(from.id, 'journal'))
        } else {
            const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
            const notifs = JSON.parse(readFileSync('./data/notifs.json', 'utf8'))
            const index = linked.findIndex(f => f.tg == from.id)
            const user = linked[index]
            linked.splice(index, 1)
            notifs.bdays.splice(index, 1)
            notifs.marks.splice(index, 1)
            Api.query('sendMessage', {
                chat_id: from.id,
                text: `Разорвана связь с профилем: ${user.first_name} ${user.last_name}, группа ${user.group}.`,
                reply_markup: Keyboard.MAIN
            }).catch(err => handleMessageSendRejection(err, from.id))
            .then(() => Scenes.set(from.id, 'main'))

            writeFileSync('./data/linked.json', JSON.stringify(linked), 'utf8')
            writeFileSync('./data/notifs.json', JSON.stringify(notifs), 'utf8')
        }
    }
}
export function handleAutovisit(text, from, scene) {
    if (scene === 'autovisit_offline' && text === Keyboard.YESNO.keyboard[0][1]) {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: '😾',
            reply_markup: Keyboard.JOURNAL
        }).then(() => Scenes.set(from.id, 'journal'))
    } else if (scene === 'autovisit_offline' && text === Keyboard.YESNO.keyboard[0][0]) {
        Api.query('sendMessage', {
            chat_id: from.id,
            parse_mode: 'MarkdownV2',
            text: Util.escapeNotFormatting('Хорошо. Тогда тебе нужно отправить логин и пароль от портала либо вот так: `login password`, либо вот так:\n```\nlogin\npassword```\nЭти данные будут зашифрованы, и даже в логах их не будет видно.'),
            reply_markup: Keyboard.make([[Button.CANCEL]])
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'autovisit_await'))
    } else if (scene === 'autovisit_await') {
        if (text === Button.CANCEL) {
            Api.query('sendMessage', {
                chat_id: from.id,
                text: 'Да, понимаю, это немного страшно. 🥲',
                reply_markup: Keyboard.JOURNAL
            }).then(() => Scenes.set(from.id, 'journal'))
        } else {
            const input = Util.trim(text.replace(/^`*|`*$/g, ''))
            if (!input) return
            const [login, password] = input.split(/\s+|\s*\n+\s*/)
            if (!login || !password) return
            const secret = Journal.encodeCredentials(login, password)
            const linked = JSON.parse(readFileSync('./data/linked.json', 'utf8'))
            const user = linked.find(f => f.tg === from.id)
            user.secret = secret
            writeFileSync('./data/linked.json', JSON.stringify(linked), 'utf8')
        }
    }
}
export function adminMenu(text, from, scene) {
    if (!(scene === 'main' && text === Keyboard.MAIN_WITH_ADMIN.keyboard[2][1])) return
    Api.query('sendMessage', {
        chat_id: from.id,
        text: 'Время навести шороху. С чего начнем?',
        reply_markup: Keyboard.ADMIN
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'admin'))
}
export function broadcastStart(text, from, scene) {
    if (!(scene === 'admin' && text === Keyboard.ADMIN.keyboard[0][0] ||
          text === '/broadcast')) return
    if (!Util.isAdmin(from.id)) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'У вас недостаточный уровень допуска, чтобы [ДАННЫЕ УДАЛЕНЫ]. Пожалуйста, дождитесь сотрудника Фонда для приема амнезиака.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    const active_users = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
    Api.query('sendMessage', {
        chat_id: from.id,
        text: `Оповещение получат ${Util.pluralString(Object.keys(active_users).length, ['активный пользователь', 'активных пользователя', 'активных пользователей'])}. Что напишем?`,
        reply_markup: Keyboard.make([[Button.CANCEL]])
    }).catch(err => handleMessageSendRejection(err, from.id))
    .then(() => Scenes.set(from.id, 'admin_broadcast'))
}
export function broadcastMake(text, from, scene) {
    if (scene !== 'admin_broadcast') return
    if (text === Button.CANCEL) {
        Api.query('sendMessage', {
            chat_id: from.id,
            text: 'Не сейчас — значит, не сейчас.',
            reply_markup: Keyboard.ADMIN
        }).catch(err => handleMessageSendRejection(err, from.id))
        .then(() => Scenes.set(from.id, 'admin'))
        return
    }

    const active_users = JSON.parse(readFileSync('./data/user_scenes.json', 'utf8'))
    Object.keys(active_users).forEach((id, offset) => {
        setTimeout(() => {
            Api.query('sendMessage', {
                chat_id: id,
                parse_mode: 'MarkdownV2',
                text: `${Util.escapeNotFormatting(text)}\n\n_Эта рассылка создана вручную. Отвечать на сообщение не надо._`,
                disable_web_page_preview: true
            }).catch(err => Util.error(`Admin broadcast to ${id} is failed:`, err))
        }, offset * 40)
    })
    Api.query('sendMessage', {
        chat_id: from.id,
        text: '✅ Сообщение отправлено.',
        reply_markup: Keyboard.ADMIN
    }).then(() => Scenes.set(from.id, 'admin'))
}
export function showStats(text, from, scene) {
    if (!(scene === 'admin' && text === Keyboard.ADMIN.keyboard[0][1] ||
          text === '/stats')) return
    if (!Util.isAdmin(from.id)) return Api.query('sendMessage', {
        chat_id: from.id,
        text: 'У вас недостаточный уровень допуска, чтобы [ДАННЫЕ УДАЛЕНЫ]. Пожалуйста, дождитесь сотрудника Фонда для приема амнезиака.'
    }).catch(err => handleMessageSendRejection(err, from.id))

    const stats = Stats.getStats()
    Api.query('sendMessage', {
        chat_id: from.id,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting(String.prototype.concat(
            `⏱ *Время сессии:* ${Util.formatTime(stats.uptime)}\n`,
            `👤 *Активные пользователи:* ${stats.users}\n`,
            `📩 *Сообщений за сессию:* ${stats.got_messages}\n`,
            `♻️ *Последнее обновление:* ${new Date(stats.last_update).toLocaleTimeString('ru')}\n`,
            `📖 *Последний просмотр журнала:* ${new Date(stats.last_journal).toLocaleTimeString('ru')}\n\n`,
            `📯 *Подписки*\n`,
            `🔹 дни рождения — ${stats.subscribers.bdays}\n`,
            `🔹 оценки — ${stats.subscribers.marks}\n`,
            `🔹 пропуски — ${stats.subscribers.misses}\n`,
            `🔹 дистант — ${stats.subscribers.provision}`
        ))
    }).catch(err => handleMessageSendRejection(from.id, err))
}
export function sendDevWarn(target, confirm) {
    if (confirm !== true) return
    Api.query('sendMessage', {
        chat_id: target,
        parse_mode: 'MarkdownV2',
        text: Util.escapeNotFormatting('⚠️ *Ведутся технические работы!* ⚠️\nСейчас мой исходный код получает обновления, и мы очень скоро вернемся в обычный режим. Спасибо за понимание. 🤗')
    }).catch(err => handleMessageSendRejection(err, target))
}

export default {
    start,
    returnButton,
    mainMenu,
    birthdaysMenu,
    commandBirthdays,
    // birthdaysList,
    showBirthdays,
    notificationsMenu,
    toggleNotification,
    semesterAverage,
    absencesReport,
    journalMenu,
    refreshProfile,
    giveSchedule,
    giveNews,
    giveRemoteProvision,
    giveLinks,
    touchAutovisit,
    checkStatus,
    helpMenu,
    linkingStart,
    linking,
    linkingCancel,
    handleAutovisit,
    adminMenu,
    broadcastStart,
    broadcastMake,
    showStats,
    sendDevWarn
}

// Заглушка для tba-фич
// Api.query('sendMessage', {
//     chat_id: from.id,
//     text: 'Пока эта функция недоступна, но совсем скоро будет! 😇'
// }).catch(err => handleMessageSendRejection(err, from.id))
