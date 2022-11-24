import { getConfig } from './Util.js'

/** Режим отладки */
export const DEV_MODE = true

/** Собственный ID бота */
export const SELF_ID = parseInt(getConfig('BOT_ID'))

/** Мой (хозяйский) ID */
export const MASTER_ID = parseInt(getConfig('SELF_ID_TG'))

/** Формат даты в `день месяц` */
export const DATE_FORMAT_DM = { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }

/** Формат даты в `день месяц год` */
export const DATE_FORMAT_DMY = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }

/** Эмодзи для сообщения о дне рождения */
export const BDAY_EMOJIS = ['🎁', '🎈', '🎉', '🎊', '🍾', '🍰', '🎂', '🍻', '🥂', '🔥', '🥳']
