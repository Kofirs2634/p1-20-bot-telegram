import { BACK } from './Button.js'

export function make(buttons) {
    return {
        keyboard: buttons,
        resize_keyboard: true
    }
}
export const MAIN = make([
    ['📚 Журнал', '📆 Дни рождения'],
    ['📣 Уведомления', '👀 Статус'],
    ['❓ Справка']
])
export const MAIN_WITH_ADMIN = make([
    ['📚 Журнал', '📆 Дни рождения'],
    ['📣 Уведомления', '👀 Статус'],
    ['❓ Справка', '👮🏻‍♂️ Админ-панель']
])
export const JOURNAL = make([
    [BACK, '🔄 Обновить'],
    ['📊 Средние баллы', '😶‍🌫️ Пропуски'],
    ['🗓 Расписание', '💻 Дистант'],
    ['📰 Новости', '🔗 Ссылки'],
    ['😏 Автоотмечалка'],
    ['⚠ Отвязать аккаунт']
])
export const AUTOVISIT = make([
    [BACK, '👋 Отключить']
])
export const MONTHS = make([
    ['❄️ Декабрь', '❄️ Январь', '❄️ Февраль'],
    ['🌿 Март', '🌿 Апрель', '🌿 Май'],
    ['🌞 Июнь', '🌞 Июль', '🌞 Август'],
    ['🍁 Сентябрь', '🍁 Октябрь', '🍁 Ноябрь'],
    [BACK]
])
export const SEASONS = make([
    ['❄️ Зима', '🌿 Весна'],
    ['🌞 Лето', '🍁 Осень'],
    [BACK]
])
export const ADMIN = make([
    ['📣 Оповещение', '🧮 Статистика'],
    [BACK]
])
export function NOTIFICATIONS(data) {
    return make([
        [`${data.birthdays ? '🔔' : '🔕'} Дни рождения`, `${data.provision ? '🔔' : '🔕'} Дистант`],
        [`${data.marks ? '🔔' : '🔕'} Оценки`, `${data.misses ? '🔔' : '🔕'} Пропуски занятий`],
        [BACK]
    ])
}
export const YESNO = make([
    ['✅ Да', '❌ Нет']
])

export default {
    make,
    MAIN,
    MAIN_WITH_ADMIN,
    MONTHS,
    SEASONS,
    JOURNAL,
    AUTOVISIT,
    ADMIN,
    NOTIFICATIONS,
    YESNO
}