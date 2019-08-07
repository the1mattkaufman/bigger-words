// v3.0 - getNext logic moved to Cloud Function

const admin = require('firebase-admin');
const functions = require('firebase-functions');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();

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
 * @description Web callable Function to increment User's Score and get next item
 * @version 3.0
 */
exports.getNext = functions.https.onCall( () => {
  let nextItem = _getNext();
  logIt( 'nextItem', nextItem );
  return nextItem;
});

/**
 * @description Private Function to get next item
 * @version 3.0
 */
let _getNext = async () => {
  let randomNum = Math.floor(Math.random()*itemListLength);
  return itemList[randomNum];
}