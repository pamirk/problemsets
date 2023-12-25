import React, {useEffect, useState} from 'react';
import {QueueButton} from "./QueueButton.jsx";
import {auth, database, functions} from "../../firebaseApp";
import {useAuthState} from "react-firebase-hooks/auth";
import {Histories} from "./PeerLearnHistories.jsx";
import {Button} from "react-bootstrap";
import {useParams} from "react-router";
import {AdminPanel} from "./AdminPanel.jsx";
import {checkIsAdmin} from "../../utils/PSetUtil";
import {FeedbackSurvey} from "./FeedbackSurvey";


export const useQueueStatus = (quarter) => {
    const [queueStatus, setQueueStatus] = useState(undefined);
    // const [nextOpen, setNextOpen] = useState(0);
    useEffect(() => {

        database.ref(`/${quarter}/queueStatus`).on("value", (snap) => {
            if(!snap.exists()) {
                // throw(Error("There should definitely be a queueStatus"));
                console.error("There should definitely be a queueStatus")
            } else {
                // console.log('db:::::', snap.val())
                setQueueStatus(snap.val());
            }
        })
    }, []);
    return queueStatus
}

export const joinRoom = (quarter, psetId, activeRoom) => {
    const colearnUrl = `/peerTeach/${quarter}/${psetId}/${activeRoom}`
    const new_window = window.open(colearnUrl, "_blank") // to open new page
    new_window.addEventListener('load', (event) => {
        console.log('new page is fully loaded');
    });
  }

const useUserJoinedQueue = (quarter) => {
    const [user] = useAuthState(auth());
    const [userJoinedQueue, setUserJoinedQueue] = useState(undefined);
    useEffect(() => {
        database.ref(`/${quarter}/queue/${user.uid}`).on("value", (snap) => {
            if(!snap.exists()) {
                setUserJoinedQueue(false);
            } else {
                setUserJoinedQueue(true);
            }
        })
    }, []);
    return userJoinedQueue
}

const askForNotifPerms = () => {
    // can either be "default" "granted" "denied"; default means they haven't picked perms yet
    if(Notification.permission === "default") {
      Notification.requestPermission().then((result) => {
        console.log(result);
      });
    }
  }

const addToQueue = () => {
    functions.httpsCallable('addUserToQueue')({}).then((result) => {
        console.log("added to queue");
        askForNotifPerms()
        console.log(result);
    }).catch((error) => {
        console.log("error adding to queue", error);
    })
}

const removeFromQueue = () => {
    functions.httpsCallable('removeUserFromQueue')({}).then((result) => {
        console.log("removed from queue", result);
    }).catch((error) => {
        console.log("error removing from queue", error);
    })
}

const useSessionHistories = (dataUpdated) => {
    const [histories, setHistories] = useState(undefined)
    useEffect(() => {
        functions.httpsCallable('getUserRooms')({}).then((result) => {

            setHistories(result.data);
        }).catch((error) => {
            console.log("error getting histories", error);
        })
    }, [dataUpdated]);
    return histories
}


const exitRoom = (roomId, dataUpdated, setDataUpdated) => {
    functions.httpsCallable('exitRoom')({roomId: roomId}).then((result) => {
        console.log("exited room", result);
        setDataUpdated(!dataUpdated);
    }).catch((error) => {
        console.log("error exiting room", error);
    });
}



const useActiveRoom = (quarter, uid) => {
    const [activeRoom, setActiveRoom] = useState(undefined);

    useEffect(() => {
        const activeRoomRef = database.ref(`/${quarter}/learners/${uid}/activeRoom`)
        activeRoomRef.on("value", (snap) => {
            const val = snap.exists() ? snap.val() : "";
            setActiveRoom(val);
        })
    }, [])

    return activeRoom;
};



export const PeerLearnPage = (props) => {
    const { psetId, qtrId } = useParams() //TODO: idk what I am doing here
    const { userMetaData } = props
    const queueStatus = useQueueStatus(qtrId);
    const joined = useUserJoinedQueue(qtrId);
    const [dataUpdated, setDataUpdated] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)

    const activeRoom = useActiveRoom(qtrId, auth().currentUser.uid)
    const histories = useSessionHistories(dataUpdated)

    // console.log('DATA: updated', dataUpdated)
    // console.log("histories", histories)

    if(queueStatus === undefined || joined === undefined || activeRoom === undefined) {
        return <div>loading...</div>
    }

    const uid = auth().currentUser.uid;


    const hasActiveRoom = activeRoom !== ""

    return (
        <>
        <FeedbackSurvey activeRoom={activeRoom} quarterId={qtrId} show={showFeedback} userId={uid} onSubmit={() => {
            setShowFeedback(false)
            exitRoom(activeRoom, dataUpdated, setDataUpdated)
        }} />
        {
            checkIsAdmin(userMetaData)  ?

        <AdminPanel
            queueOpen={queueStatus['isOpen']}
            nextOpenTimeUTC={queueStatus['nextOpenTimeUTC']}
            nextCloseTimeUTC={queueStatus['nextCloseTimeUTC']}
            quarterId={qtrId}
        />
        :
            <div style={{maxWidth:800, textAlign:'center', padding:'20px', background:'white',height:'100vh'}}>
            <h2>Peer Learning in CS109</h2>
            <hr/>
            { hasActiveRoom ?
            <div className="alert alert-warning">
                You are currently in a session.
                <div>
                    <Button className="peerlearn-joinleave-button" variant="primary" onClick={() => joinRoom(qtrId, psetId, activeRoom)}>Go to session</Button>
                    {/* Get active room id and use that for the button */}
                    <Button className="peerlearn-joinleave-button" variant="warning" onClick={() => {
                        // await exitRoom(activeRoom, dataUpdated, setDataUpdated)
                        setShowFeedback(true)
                    }}>End session</Button>
                </div>
            </div>
            :
                    <QueueButton
                        queueOpen={queueStatus['isOpen']}
                        nextOpenTimeUTC={queueStatus['nextOpenTimeUTC']}
                        nextCloseTimeUTC={queueStatus['nextCloseTimeUTC']}
                        joined={joined}
                        addToQueue={addToQueue}
                        removeFromQueue={removeFromQueue}
                    />
            }
            <div></div>
            <div className='card p-3 mt-5'>
                <h4>What is Peer Learning?</h4>
                <p style={{textAlign: "justify"}}>
                When the queue is open, you can sign up to work with another person in the course. We will either match you with a peer, or, if course staff is available you will get to talk to them. Once you sign up, it may take up to 5 mins to find a good pairing. After you are matched, we will put you into a virtual session with tools for you to collaborate. You should expect to spend around 15 minutes in the session.
                </p>

                <p style={{textAlign: "justify"}}>
                    If you think you experienced a bug in any part of your peer learning experience, please let us know.
                </p>
                <a href="https://edstem.org/us/courses/29605/discussion/new" target="_blank"><Button>Bug Report</Button>
                </a>
            </div>
            <div></div>

            <div className=' mt-5'>
            {histories === undefined ? "loading..." : <Histories histories={histories} activeRoom={activeRoom} quarterId={qtrId} psetId={psetId} exitRoom={(roomId) => exitRoom(roomId, dataUpdated, setDataUpdated)}/> }
            </div>
            </div>
        }
        </>
    )

}