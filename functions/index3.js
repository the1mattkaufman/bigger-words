const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
const usersCollection = db.collection('users');

/**
 * @description Callable Function to save user on login
 */
exports.saveUser = functions.https.onCall( async (data) => {
  console.log( 'data', data );
  let player = data;
  if ( data && data.uid ){
    //we don't want to overwrite saved scores
    delete player.timesRight;
    delete player.timesWrong;

    let dbUser = await usersCollection.doc(player.uid).set(
      player, {merge:true}
    ).then(() => {
      return dbUser.get();
    }).then(doc => {
      return doc;
    });
    console.log('dbUser',dbUser);
    player = dbUser;
  }
  if ( !player.timesRight ){
    player['timesRight'] = 0;
  }
  if ( !player.timesWrong ){
    player['timesWrong'] = 0;
  }
  return player;
});