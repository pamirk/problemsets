import firebase from "firebase";
import "firebase/analytics";
import {createContext, useEffect, useMemo, useState} from "react";
import {useAuthState} from "react-firebase-hooks/auth";
import {useLocation, useParams} from "react-router";
import {auth, database, firestore} from "../../../firebaseApp.js";
import {useDocumentData} from "react-firebase-hooks/firestore";
import {Login} from "./Login.jsx";
import {Loading} from "../loading/Loading.jsx";

export const UserMetaDataContext = createContext(undefined)

// eslint-disable-next-line react/prop-types
export const Authenticated = ({component: Component}) => {
    // console.log('login helper re-renders')
    const [user, loading] = useAuthState(auth());
    const {qtrId} = useParams()
    const [firestoreUserRef, setFirestoreUserRef] = useState(undefined)

    const memoizedMetaDataRequest = useMemo(() => {
        console.log('recreating the user meta data request')
        return firestoreUserRef
    }, [firestoreUserRef])
    var [userMetaData, userMetaDataLoading] = useDocumentData(memoizedMetaDataRequest); //memoizedMetaDataRequest)


    const location = useLocation();
    let pathname = location["pathname"];

    useEffect(() => {
        if (user) {
            userPresence(user, qtrId)
            setFirestoreUserRef(firestore.doc(`users/${user.uid}`))
        }
    }, [user, qtrId])

    // debounce logging so we only do it once per path change
    useEffect(() => {
        try {
            pathname = pathname.replaceAll("/", "-");
        } catch {
            pathname = "unknown";
        }

        if (user) {

            const logDoc = firestore
                .collection("users")
                .doc(user.uid)
                .collection("engagement")
                .doc(pathname);

            logDoc.get().then((snapshot) => {
                if (snapshot.exists) {
                    logDoc.update({
                        timestamps: firebase.firestore.FieldValue.arrayUnion(new Date()),
                    });
                } else {
                    logDoc.set({
                        timestamps: [new Date()],
                    });
                }
            });
        }
    }, [user, pathname]);

    if (loading) {
        return <Loading/>;
    }

    if (!user) {
        return <Login/>;
    }
    console.log(user)
    // if the user is trying to get to a stanford page, without a stanford email, log them out
    // if (user.email.split("@")[1] !== "stanford.edu") {
    //     console.log("logging out user",user, user.email)
    //     // if the class is not the public class
    //     if (qtrId !== 'public') {
    //         auth().signOut();
    //         return <Login/>;
    //     }
    // }

    console.log("################", userMetaData)
    return (<UserMetaDataContext.Provider value={{userMetaData, userMetaDataLoading}}>
            <Component user={user}/>
        </UserMetaDataContext.Provider>)

};

const userPresence = (user, qtrId) => {

    // only track if the qtrId is not undefined
    if (qtrId === undefined) {
        return
    }
    const userStatusDatabaseRef = database.ref(`/${qtrId}/status/${user.uid}`);
    const isOfflineForDatabase = {
        state: 'offline', roomId: null, last_changed: firebase.database.ServerValue.TIMESTAMP,
    };
    const isOnlineForDatabase = {
        state: 'online', roomId: null, last_changed: firebase.database.ServerValue.TIMESTAMP,
    };
    database.ref('.info/connected').on('value', function (snapshot) {
        // If we're not currently connected, don't do anything.
        if (snapshot.val() === false) {
            return;
        }

        // If we are currently connected, then use the 'onDisconnect()'
        // method to add a set which will only trigger once this
        // client has disconnected by closing the app,
        // losing internet, or any other means.
        userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function () {
            // The promise returned from .onDisconnect().set() will
            // resolve as soon as the server acknowledges the onDisconnect()
            // request, NOT once we've actually disconnected:
            // https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

            // We can now safely set ourselves as 'online' knowing that the
            // server will mark us as offline once we lose connection.
            userStatusDatabaseRef.update(isOnlineForDatabase);
        });
    });
}
