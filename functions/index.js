const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
const wordsCollection = db.collection('words');
const usersCollection = db.collection('users');

let logIt = (label, value) => {
  // Comment this out when deploying to prod!!!
  console.log( label, value );
}

/**
 * @description Web callable Function to save and return user on login
 */
exports.saveUser = functions.https.onCall( async (data, context) => {
  logIt('saveUser() data', data);
  let player = data;
  if ( player && player.uid ){
    //we don't want to overwrite saved scores
    delete player.timesRight;
    delete player.timesWrong;

    //Set the User record to update/insert and use merge to not erase values not provided
    let dbUser = await usersCollection.doc(player.uid).set(
      player, {merge:true}
    ).then(() => {
      return usersCollection.doc(player.uid).get();
    }).then(doc => {
      return doc;
    });
    logIt('dbUser',dbUser);
    player = dbUser;
  }
  if ( player && !player.timesRight ){
    player['timesRight'] = 0;
  }
  if ( player && !player.timesWrong ){
    player['timesWrong'] = 0;
  }
  return player;
});


/**
 * @description Web callable Function to increment User's Score and get next item
 */
exports.getNext = functions.https.onCall( async (data, context) => {
  logIt( 'data', data );
  if ( data.uid ){
    let user = await _incrementUser(data.uid, data.timesRightOrTimesWrong);
  }
  let nextItem = await _getNext();
  logIt( 'nextItem', nextItem );
  return nextItem;
});

/**
 * @description Private Function to get next itme
 */
let _getNext = async () => {
  let randomNum = Math.floor(Math.random()*itemListLength);

  let nextItem = await wordsCollection.where('num', '==', randomNum)
  .limit(1)
  .get()
  .then( querySnapshot => {
    let res;
    querySnapshot.forEach( (doc) => {
      res = doc.data();
    });
    return res;
  });
  logIt('_getNext() nextItem',nextItem);
  return nextItem;
}

/**
 * @description Private Function to increment User's score
 */
let _incrementUser = async(uid, timesRightOrTimesWrong) => {
  if ( uid ){
    let documentRef = usersCollection.doc(uid);
    let dbUser = await documentRef.update(
      timesRightOrTimesWrong, admin.firestore.FieldValue.increment(1)
    ).then(() => {
      return documentRef.get();
    }).then(doc => {
      // doc.get('counter') was incremented
      return doc;
    });
    logIt('_incrementUser() dbUser',dbUser);
    return dbUser;
  } else {
    return user
  }
}

/**
 * @description Function to create/update a user on login
 */
exports.handleLogin = functions.https.onCall((data,context) => {
  let user = data.user;
  let userRef = usersCollection.doc(user.uid);
  return userRef.set({
      displayName: user.displayName,
      photoURL: user.photoURL
    }, {merge: true}
  ).then(() => {
    return userRef.get();
  }).then(doc => {
    // doc.get('counter') was incremented
    return doc;
  });
});

let itemList = [
  { word:'lexicomane', definition:'lover of a dictionary'},        
  { word:'avaricious', definition:'having or showing an extreme greed for wealth or material gain'},
  { word:'apprehension', definition:'a feeling of fear that something bad may happen'},
  { word:'consider', definition:'deem to be'},
  { word:'minute', definition:'infinitely or immeasurably small'},
  { word:'accord', definition:'concurrence of opinion'},
  { word:'evident', definition:'clearly revealed to the mind or the senses or judgment'},
  { word:'practice', definition:'a customary way of operation or behavior'},
  { word:'intend', definition:'have in mind as a purpose'},
  { word:'concern', definition:'something that interests you because it is important'},
  { word:'commit', definition:'perform an act, usually with a negative connotation'},
  { word:'issue', definition:'some situation or event that is thought about'},
  { word:'approach', definition:'move towards'}
];
let itemListLength = itemList.length;

/**
 * @description Function to perform a onetime insertion of data
 */
exports.populateData = functions.https.onCall(() => {
  let batch = db.batch();
  for ( let i in itemList ){
    let wRef = wordsCollection.doc(itemList[i].word);
    itemList[i]['num'] = parseInt(i);
    batch.set(wRef, itemList[i] );
  }
  return batch.commit().then(() => {
    logIt('populateData()', 'done');
    return;
  })
  .catch( error => {
    logIt('populateData()',error);
    return;
  });
});