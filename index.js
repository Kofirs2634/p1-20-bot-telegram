import * as Api from './modules/Api.js'
import * as Util from './modules/Util.js'
import * as Journal from './modules/Journal.js'
import * as Recurrent from './modules/Recurrent.js'
import * as Static from './modules/Static.js'

;(async function() {
    if (Static.DEV_MODE) Util.warn('DEV MODE is enabled')

    await Journal.checkMasterCookie().catch(err => Util.error('Failed to check cookie in main function:', err))

    Api.listenUpdates()

    setInterval(() => {
        Recurrent.birthdaySpectator()
        Recurrent.heartbeat()
    }, 60000)
    setInterval(() => {
        Recurrent.journalSpectator()
        Recurrent.provisionSpectator()
        //Recurrent.filePurger()
    }, 10 * 60000)
})();
