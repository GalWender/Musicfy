import { httpService } from "./http.service"
import { utilService } from "./util.service"
export const errorService = {
 logError
}

function logError(user, err, instance, info, routeHistory) {
 const errorToLog = _createNewError(user, err, instance, info, routeHistory)
 if (import.meta.env.MODE === 'production') {
  httpService.get('err')
  return
 }
 console.log('%cError', _getStyles(), errorToLog)
}

/**
 * 
 * @param {object} user 
 * @param {string} err 
 * @param {string} instance 
 * @param {string} info 
 * @returns {{_id: string, desc: string, user: object, info: string, instance: string}} error object
 */
function _createNewError(user, err, instance, info, routeHistory) {
 return {
  _id: utilService.makeId(),
  desc: `[global error handler ${err}]`,
  user,
  info,
  instance: instance.$.type.name,
  routeHistory

 }
}

/**
 * 
 * @returns {string} css styles
 */
function _getStyles() {
 return 'color:#fff; background:red; padding:5px; border-radius:5px; font-weight:bold'
}


// function getBuId(userId) {
//  db.getCollection("user").find({ _id: ObjectId(userId) })
// }

// function getNotesByUserId(userId) {
//  db.getCollection("notificatioens").aggregate([
//   { $project: { userId: 1 } }
//  ])
// }


