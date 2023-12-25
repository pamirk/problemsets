import React, {useContext, useEffect, useState} from "react";
import {PeerTeachWithVideo} from "./PeerTeachWithVideo.jsx";
import {ROOM_EXITED} from "../components/colearning/constants";
import {useParams} from "react-router";
import {database, firestore} from "../firebaseApp.js";
import {FeedbackSurvey} from "../components/colearning/FeedbackSurvey";
import {PeerTeachAfterMeeting} from "./PeerTeachAfterMeeting.jsx";
import {checkIsAdmin} from "../utils/PSetUtil.js";
import {UserMetaDataContext} from "../components/general/auth/Authenticated.jsx"

const useFeedbackSubmitted = (qtrId, roomId, userId) => {
    const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(undefined);
    useEffect(() => {
        const intFn = async () => {
            const feedback =
                await firestore.collection("matching").doc(qtrId)
                    .collection("rooms")
                    .doc(roomId)
                    .collection("feedback")
                    .doc(userId).get()
            setIsFeedbackSubmitted(feedback.exists)
        }
        intFn()
    }, [qtrId, roomId, userId])
    return [isFeedbackSubmitted, setIsFeedbackSubmitted]
}

const useMeetingOver = (qtrId, roomId, userId, userMetaData) => {
    const [isMeetingOver, setIsMeetingOver] = useState(undefined);
    useEffect(() => {
        if (checkIsAdmin(userMetaData)) {
            // let admins into room, no feedback logic for them
            console.log("heloooo am I an admin")
            setIsMeetingOver(false)
            return;
        }
        const statusRef = database.ref(`/${qtrId}/rooms/${roomId}/status/${userId}`);
        statusRef.on("value", (snap) => {
            if (!snap.exists()) {
                throw(Error("The status for a room should always exist. This user is not in the room."))
            } else {
                console.log("room_status", snap.val())
                if (snap.val() === ROOM_EXITED) {
                    setIsMeetingOver(true)
                } else {
                    setIsMeetingOver(false)
                }
            }
        })

    }, [roomId, userMetaData, qtrId, userId])

    return isMeetingOver

}

export const PeerTeach = (props) => {
    // CAUTION! Be very careful not to change state when
    // the video is live (it will force the jitsi to reinitialize)

    const {qtrId, roomId} = useParams()
    const {userMetaData, userMetaDataLoading} = useContext(UserMetaDataContext)

    const userId = props.user.uid

    const isMeetingOver = useMeetingOver(qtrId, roomId, userId, userMetaData)
    const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useFeedbackSubmitted(qtrId, roomId, userId)

    if (isMeetingOver === undefined || isFeedbackSubmitted === undefined || userMetaDataLoading) {
        return <div>Loading...</div>
    }
    if (!isMeetingOver) {
        return <PeerTeachWithVideo {...props}/>
    } else if (!isFeedbackSubmitted) {
        return <FeedbackSurvey activeRoom={roomId} quarterId={qtrId} show={true} userId={userId}
                               onSubmit={() => setIsFeedbackSubmitted(true)}/>
    }
    return <PeerTeachAfterMeeting user={props.user}/>
}