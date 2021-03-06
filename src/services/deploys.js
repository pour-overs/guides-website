import { firestore, database, firestoreFields } from "@services/firebase.js";

const FieldValue = firestoreFields.FieldValue;
const timestamp = () => FieldValue.serverTimestamp();

const realTimeDeployRef = database.ref("deploys");
const deploysRef = firestore.collection("deploys");

/**
 * Create a new deploy and associate to the userId
 * @returns {Promise<string>} A promise that resolves to the newly created Deploy ID
 */
export async function createDeploy(userId, label) {

  const deployItem = _createDeploy(userId, label);

  const ref = await deploysRef.add(deployItem);

  // creating a deploy also creates a rtdb entry for tracking the deploy
  await realTimeDeployRef
    .child(ref.id)
    .set({
      id: ref.id,
      isComplete: false,
      status: "Triggering",
    })
    .catch(function(error) {
      console.log("Unable to set real time database entry", error);
    });

  return ref.id;
}

export async function listDeploys() {
  const snapshot = await deploysRef
    .orderBy('lastModified', 'desc')
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map(doc => {
    const deploy = { id: doc.id, ...doc.data() };

    deploy.lastModified.date = deploy.lastModified.toDate();
    deploy.createdAt.date = deploy.createdAt.toDate();

    return deploy;

  });
}
/**
 * Fetches a single Deploy by ID
 * @param {string} deployId The id of a Guide
 */
export async function getByID(deployId) {

  const document = await deploysRef
    .doc(deployId)
    .get();

  if (document.exists) {
    const data = { id: deployId, ...document.data(), };

    // convert these into datetime strings for parsing on the client
    data.lastModified.date = data.lastModified.toDate();
    data.createdAt.date = data.createdAt.toDate();

    return data;
  }
}

export async function setDeployComplete(deployId, isComplete, status = "Complete") {

  await realTimeDeployRef
    .child(deployId)
    .update({
      isComplete,
      status,
    })
    .catch(function(error) {
      console.log("Unable to set real time database entry", error);
    });

    const ref = deploysRef.doc(deployId);
    const writeResult = await ref.update({ isComplete, lastModified: timestamp(), })
      .catch(function(error) {
        console.log("Unable to update deploy", error);
      });


    return writeResult;
}

export async function updateDeploy(deployId, deployData) {

  const ref = deploysRef.doc(deployId);

  // update the lastModified field
  const data = Object.assign(deployData, { lastModified: timestamp(), });

  // save
  await ref.update(data);

  return ref.id;
}


function _createDeploy(userId, label) {

  const createdAt = timestamp();

  return {
    createdAt,
    label,
    lastModified: createdAt,
    initiatedBy: userId,
    isComplete: false,
  }
}
