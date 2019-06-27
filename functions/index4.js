const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
const wordsCollection = db.collection('words');
const usersCollection = db.collection('users');

/*
  ToDo
  1. Create a function to populate the list of words
  2. Create a function to get next item
  3. Create a function to increment User
*/

/**
 * @description Callable Function to save user on login
 */
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

/**
 * @description Callable Function to increment User's Score and get next item
 */
exports.getNext = functions.https.onCall( async (data, context) => {
  console.log( 'data', data );
  let res = { user: data.user, nextItem: {} };
  let user = await _incrementUser(data.user, data.timesRightOrTimesWrong);
  res.user = user;
  let nextItem = await _getNext();
  res.nextItem = nextItem;
  console.log( 'res', res );
  return res;
});

/**
 * @description Private Function to get next itme
 */
let _getNext = async () => {
  let randomNum = Math.floor(Math.random()*itemListLength);

  let next = await wordsCollection.where('num', '==', randomNum)
  .limit(1)
  .get()
  .then( querySnapshot => {
    let res;
    querySnapshot.forEach( (doc) => {
      res = doc.data();
    });
    return res;
  });
  console.log('next',next);
  return next;
}

/**
 * @description Private Function to increment User's score
 */
let _incrementUser = async(user, timesRightOrTimesWrong) => {
  if ( user && user.uid ){
    let documentRef = usersCollection.doc(user.uid);
    let dbUser = await documentRef.update(
      timesRightOrTimesWrong, admin.firestore.FieldValue.increment(1)
    ).then(() => {
      return documentRef.get();
    }).then(doc => {
      // doc.get('counter') was incremented
      return doc;
    });
    console.log('dbUser',dbUser);
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
    console.log('done');
    return;
  })
  .catch( error => {
    console.log(error);
    return;
  });
});