const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
const wordsCollection = db.collection('words');
const usersCollection = db.collection('users');


/**
 * @description Private function to use instead of Console.Log, so that I can easily comment out all comments 
 *              before deployment, which is a best practice
 */
let logIt = (label, value) => {
  // Comment this out when deploying to prod!!!
  console.log( label, value );
}

const itemList = [
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
const itemListLength = itemList.length;

/**
 * @description Function to perform a onetime insertion of data
 * @version 4.0
 */
exports.populateData4 = functions.https.onCall(() => {
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

/**
 * @description Web callable Function to increment User's Score and get next item
 * @version 4.0
 */
exports.getNext4 = functions.https.onCall( async (data, context) => {
  logIt( 'data', data );
  let nextItem = await _getNext4();
  logIt( 'nextItem', nextItem );
  return nextItem;
});

/**
 * @description Private Function to get next item
 * @version 4.0
 */
let _getNext4 = async () => {
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