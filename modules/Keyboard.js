/**
 * @typedef Keyboard
 * @prop {string[][]} keyboard Список рядов кнопок
 * @prop {true} resize_keyboard Read-only флаг изменения размеров клавиатуры
 */
/**
 * @typedef NotificationData Список подписок
 * @prop {boolean} birthdays Флаг активной подписки на дни рождения
 * @prop {boolean} provision Флаг активной подписки на дистант
 * @prop {boolean} marks Флаг активной подписки на оценки
 * @prop {boolean} misses Флаг активной подписки на пропуски
 */

import { BACK } from './Button.js'

/**
 * Создает клавиатуру
 * @param {string[][]} buttons список рядов кнопок
 * @returns {Keyboard} новая клавиатура
 */
export function make(buttons) {
    return {
        keyboard: buttons,
        resize_keyboard: true
    }
}
/** Главное меню */
export const MAIN = make([
    ['📚 Журнал', '📆 Дни рождения'],
    ['📣 Уведомления', '😏 Автоотмечалка'],
    ['❓ Справка']
])
/** Главное меню, но для админа */
export const MAIN_WITH_ADMIN = make([
    ['📚 Журнал', '📆 Дни рождения'],
    ['📣 Уведомления', '😏 Автоотмечалка'],
    ['❓ Справка', '👮🏻‍♂️ Админ-панель']
])
/** Раздел "Журнал" */
export const JOURNAL = make([
    [BACK, '🔄 Обновить'],
    ['📊 Средние баллы', '😶‍🌫️ Пропуски'],
    ['🗓 Расписание', '💻 Дистант'],
    ['📰 Новости', '🔗 Ссылки'],
    ['⚠ Отвязать аккаунт']
])
/** Раздел "Автоотмечалка" */
export const AUTOVISIT = make([
    [BACK, '👋 Отключить'],
    ['🪄 Ручной обход']
])
/**
 * Подраздел "Дни рождения > Список"
 * @deprecated устарело в пользу {@link SEASONS|`SEASONS`}
 */
export const MONTHS = make([
    ['❄️ Декабрь', '❄️ Январь', '❄️ Февраль'],
    ['🌿 Март', '🌿 Апрель', '🌿 Май'],
    ['🌞 Июнь', '🌞 Июль', '🌞 Август'],
    ['🍁 Сентябрь', '🍁 Октябрь', '🍁 Ноябрь'],
    [BACK]
])
/** Раздел "Дни рождения" */
export const SEASONS = make([
    ['❄️ Зима', '🌿 Весна'],
    ['🌞 Лето', '🍁 Осень'],
    [BACK]
])
/** Раздел "Админпанель" */
export const ADMIN = make([
    ['📣 Оповещение', '🧮 Статистика'],
    [BACK]
])
/**
 * Раздел "Уведомления"
 * @param {NotificationData} data данные о подписках
 */
export function NOTIFICATIONS(data) {
    return make([
        [`${data.birthdays ? '🔔' : '🔕'} Дни рождения`, `${data.provision ? '🔔' : '🔕'} Дистант`],
        [`${data.marks ? '🔔' : '🔕'} Оценки`, `${data.misses ? '🔔' : '🔕'} Пропуски занятий`],
        [BACK]
    ])
}
/** Клавиатура с бинарным выбором */
export const YESNO = make([
    ['✅ Да', '❌ Нет']
])
