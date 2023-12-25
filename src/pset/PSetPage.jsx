import React, {useEffect, useMemo, useState} from 'react';
import {FaBars,} from "react-icons/fa";
import {Aside} from "./components/Aside.jsx"
import {Question} from "./Question.jsx"
import {useCollectionOnce, useDocumentData, useDocumentDataOnce,} from "react-firebase-hooks/firestore";
import {useHistory, useParams} from "react-router-dom";
import axios from 'axios'
import API_ROUTE from "../ApiRoute.js"
import {PSetSplash} from './PSetSplash.jsx';
import {PSetPrint} from './PSetPrint.jsx';
import Swal from 'sweetalert2'
import {firestore} from "../firebaseApp.js";
import useSound from 'use-sound';
import Music from "../components/colearning/positive_notification.mp3"
import {joinRoom, PeerLearnPage} from '../components/colearning/PeerLearnPage.jsx';
import {EVENT_TYPES, useEvents} from '../components/general/realtime/Events.js';
import {useDebounce} from "use-debounce";

/**
 * This is the main component for the pset page!
 */



export const PSetPage = (props) => {


    let {qtrId, psetId, forcedStudentId} = useParams();

    console.log(qtrId, psetId, forcedStudentId)

    let user = props.user;
    if (forcedStudentId) {
        user = {
            uid: forcedStudentId,
            displayName: 'forced student'
        }
    }
    // this just sets a notificaiton for the user
    let [offlineMode, setOfflineMode] = useState(false)

    const history = useHistory()
    const [eventsByType, removeEvent] = useEvents(qtrId, user.uid);
    const [play] = useSound(Music);
    const handleNotification = () => {
        const title = "We found a match!"
        const notifOptions = {
            body: "We found a peer for you to collaborate with!",
            silent: false
        }
        if (Notification.permission === "granted") {
            console.log("Trying hard to show you this fun notification")
            const notification = new Notification(title, notifOptions);
            play()
        }
    }

    const [debounceNotification] = useDebounce(handleNotification, 60000, {leading: true, trailing: false});


    let psetUrl = `psets/${qtrId}/${psetId}/public`

    // get public pset data
    var [publicPsetData, publicPsetLoading, publicPsetLoadingErr] = useDocumentDataOnce(
        firestore.doc(psetUrl)
    );

    // get user data (ie are they a TA? Do they use a screenreader?)
    const memoizedMetaDataRequest = useMemo(() => {
        return firestore.doc(`users/${props.user.uid}`)
    }, [props.user.uid]);
    var [userMetaData, userMetaDataLoading] = useDocumentData(memoizedMetaDataRequest)

    // get correct / psetParams for pset
    var [studentPsetData, studentDataLoading, studentDataLoadingErr] = useDocumentData(
        firestore.doc(`users/${props.user.uid}/${qtrId}/${psetId}`)
    );

    useEffect(() => {
        window.addEventListener('offline', () => {
            setOfflineMode(true)
            Swal.fire({
                toast: true,
                icon: 'info',
                title: 'Working in offline mode',
                position: 'top-end',
                showConfirmButton: false,
            });
        });
        window.addEventListener('online', () => {
            setOfflineMode(false)
            Swal.fire({
                toast: true,
                icon: 'success',
                title: 'Online',
                position: 'top-end',
                showConfirmButton: false,
            });
        });
    }, [])

    // get any feedback for all answers. I want this memoized
    const memoizedFeedbackRequest = useMemo(() => {
        let feedbackPath = `users/${props.user.uid}/${qtrId}/${psetId}/feedback`
        return firestore.collection(feedbackPath)
    }, [props.user.uid, qtrId, psetId]);
    var [feedbackCollection, feedbackLoading, feedbackLoadingErr] = useCollectionOnce(memoizedFeedbackRequest);

    // display nothing for the ms while the data is loading
    if (studentDataLoading || publicPsetLoading || userMetaDataLoading) return <></>

    if (publicPsetData == undefined) {
        return <>No pset found with psetId {psetId}</>
    }

    if (feedbackLoading && publicPsetData.gradesReleased) return <></>

    let allFeedback = {}
    if (feedbackCollection) {
        for (const doc of feedbackCollection.docs) {
            allFeedback[doc.id] = doc.data()
        }
    }


    // go ahead and generate if necessary...
    if (publicPsetLoadingErr) {
        console.error(publicPsetLoadingErr)
        // this could either be as a result of no internet, or, their pset isn't ready...
        return <>Unable to load pset data. Perhaps you don't have internet? Try again!</>
    }
    if (studentDataLoadingErr) {
        console.error(studentDataLoadingErr)
        console.log(`users/${user.uid}/${qtrId}/${psetId}`)
        // this could either be as a result of no internet, or, their pset isn't ready...
        return <>Unable to load solution data. Perhaps you don't have internet? Try again!</>
    }

    // if you didn't get pset corrects from the user, they might not have a pset created
    if (!studentPsetData || !studentPsetData.corrects) {
        requestMakePset(user, qtrId, psetId)
    }


    document.title = publicPsetData.title;


    processEvents(eventsByType, removeEvent, qtrId, psetId, history, debounceNotification)


    return (
        <>
            <PSetPageWithData
                user={user}
                studentPsetData={initializeStudentPsetData(studentPsetData)}
                publicPsetData={publicPsetData}
                userMetaData={userMetaData}
                allFeedback={allFeedback}
            />
        </>
    )
}

const processEvents = (eventsByType, removeEvent, qtrId, psetId, history, debounceNotification) => {
    // console.log('EVENTS:', eventsByType)
    if (eventsByType[EVENT_TYPES.newMatch].length > 0) {
        debounceNotification()
        const newEvent = eventsByType[EVENT_TYPES.newMatch][0];
        // console.log('NEW MATCH', newEvent);
        Swal.fire({
            title: "You've been matched!",
            text: "Your colearning session is about to start.",
            confirmButtonText: 'Start Now'
        }).then((result) => {
            joinRoom(qtrId, psetId, newEvent['data']['roomId'])
            removeEvent(newEvent)
        });
    } else if (eventsByType[EVENT_TYPES.peerLearnNudge].length > 0) {
        const newEvent = eventsByType[EVENT_TYPES.peerLearnNudge][0];
        Swal.fire({
            title: "Learn with your peers!",
            text: "A lot of your classmates are peer learning right now! Join the fun",
            showCancelButton: true,
            confirmButtonText: 'Learn with friends',
            cancelButtonText: "Maybe later"
        }).then((result) => {
            removeEvent(newEvent)
            if (result.isConfirmed) {
                history.push(`/${qtrId}/${psetId}/peerlearnpage`)
            }
        });
    }
}

const PSetPageWithData = (props) => {

    const [menuToggled, setMenuToggled] = useState(false);
    const handleToggleSidebar = (value) => {
        setMenuToggled(value);
    };

    return (

        <>
            {/* <FloatingComponent></FloatingComponent> */}
            <div className="app">
                <Aside
                    user={props.user}
                    studentPsetData={props.studentPsetData}
                    publicPsetData={props.publicPsetData}
                    toggled={menuToggled}
                    setToggled={handleToggleSidebar}
                />
                <div className="content">
                    <div className="btn-toggle" style={{margin: '5px'}} onClick={() => handleToggleSidebar(true)}>
                        <FaBars/>
                    </div>
                    <PageBody
                        user={props.user}
                        publicPsetData={props.publicPsetData}
                        studentPsetData={props.studentPsetData}
                        userMetaData={props.userMetaData}
                        allFeedback={props.allFeedback}
                    />
                </div>
            </div>
        </>
    )
}

const PageBody = (props) => {
    let {qId} = useParams();

    if (qId === 'splash') {
        return <PSetSplash {...props} />
    }

    if (qId === 'submit') {
        return <PSetPrint {...props}/>
    }

    if (qId === 'peerlearnpage') {
        return <PeerLearnPage {...props}/>
    }

    return <Question {...props}/>
}

function requestMakePset(user, qtrId, psetId) {
    user.getIdToken(true)
        .then(function (token) {
            let URL = `${API_ROUTE}makePset`;
            axios.post(URL, {
                token: token,
                psetId: psetId,
                qtrId: qtrId
            }).then(response => {
                // this is default
            }).catch(err => {
                console.log('makePset err', err)
            });
        });
}

function initializeStudentPsetData(fromServer) {
    // welcome to the pset for  your first time
    // this will prevent the page from crashing if
    // we don't have correct data for you
    if (fromServer == undefined) {
        return {
            'corrects': {}
        }
    }
    if (fromServer['corrects'] == undefined) {
        fromServer['corrects'] = {}
        return fromServer
    }
    return fromServer
}

const FloatingComponent = () => {
    return (
        <div style={{
            zIndex: '1000',
            position: 'absolute',
            bottom: '10px',
            right: '50px',
            padding: '0px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }}>
            {/* <JoinButton/> */}
        </div>
    )
}

