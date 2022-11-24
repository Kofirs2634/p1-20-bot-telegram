/** Режим отладки */
export const DEV_MODE = false

/** Собственный ID бота */
export const SELF_ID = '[УДАЛЕНО]'

/** Мой (хозяйский) ID */
export const MASTER_ID = '[УДАЛЕНО]'

/** Формат даты в `день месяц` */
export const DATE_FORMAT_DM = { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }

/** Формат даты в `день месяц год` */
export const DATE_FORMAT_DMY = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }

/** Эмодзи для сообщения о дне рождения */
export const BDAY_EMOJIS = ['🎁', '🎈', '🎉', '🎊', '🍾', '🍰', '🎂', '🍻', '🥂', '🔥', '🥳']

export default {
    DEV_MODE,
    SELF_ID,
    MASTER_ID,
    DATE_FORMAT_DM,
    DATE_FORMAT_DMY,
    BDAY_EMOJIS
}
