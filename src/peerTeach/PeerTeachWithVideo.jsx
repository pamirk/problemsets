import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";
import {FaEdit, FaExpand, FaPhone} from 'react-icons/fa';
import {MeetingContent} from "./MeetingContent.jsx";
import {MeetingVideo} from "./MeetingVideo.jsx";
import {TOOLBAR_BUTTONS} from "./ToolbarButtons";
import {useAuthState} from "react-firebase-hooks/auth";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {useParams} from "react-router";
import {auth, database, functions} from "../firebaseApp.js";


/**
 Notes on Jitsi

 The page before the meeting starts is called the "prejoin" page

 https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-commands/
 */

const DRAGGABLE_WIDTH = 300;
const DRAGGABLE_HEIGHT = 200;

export const PeerTeachWithVideo = (props) => {

    // PeerTeachWithVideo: main job is to render video
    // and the meeting page.

    // CAUTION! Do not put useStates in this component
    // each time it reloads, it will make MeetingVideo
    // reload, and that reinitializes the jitsi
    console.log('PeerTeach page loaded (should only run once)')

    const hasEnteredRef = useRef(false)
    hasEnteredRef.current = false

    const {qtrId, roomId} = useParams()

    const jitsiRef = useRef()
    const videoContainerRef = useRef()
    const meetingRef = useRef()
    const onApiReady = (api) => {
        jitsiRef.current = api
        api.executeCommand('setTileView', true);
        api.executeCommand('localSubject', 'Peer Teaching');
        api.executeCommand('toggleTileView');
        api.addListener('videoConferenceJoined', () => {
            meetingRef.current.videoConferenceJoined()
        })
    }

    return <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',

    }}>
        {/* The video is high up in the DOM so that it doesn't rerender */}
        <>

            <MeetingVideo
                onApiReady={onApiReady}
                user={props.user}
                videoContainerRef={videoContainerRef}
                jitsiRef={jitsiRef}
            />
            <MeetingBody
                jitsiRef={jitsiRef}
                user={props.user}
                videoContainerRef={videoContainerRef}
                ref={meetingRef}
                isEditable={true}
                onRoomExit={() => {
                }}
                roomId={roomId}
                qtrId={qtrId}
                hasEnteredRef={hasEnteredRef}
            />

        </>
    </div>
}

const MeetingBody = forwardRef((props, ref) => {
    // though the parent runs only once, 
    // this runs many times as the meeting is being setup

    // keep track of both your meetingPage, and the server's
    // these may be different values (for example when you are on prejoin)
    const [meetingPageServer, setMeetingPageServer] = useState(null)
    const [meetingPage, setMeetingPage] = useState('prejoin')
    console.log(meetingPage, meetingPageServer)

    // keep track of if you have already succesfully entered a page
    // (so that you don't force others to the video page when you join)

    useImperativeHandle(ref, () => ({
        // this allows the parent to set the video when you join
        videoConferenceJoined() {
            setMeetingPage('video')
        },
    }))

    useEffect(() => {
        // listen for when the meeting moves to a new page
        let path = `${props.qtrId}/rooms/${props.roomId}/meetingPage/`
        const meetingPageRef = database.ref(path);
        meetingPageRef.on("value", (snap) => {
            if (snap.exists()) {
                let meetingPageDoc = snap.val()
                let serverPage = meetingPageDoc['currPage']
                setMeetingPageServer(serverPage)
                // this is called a reducer
                // its necessary so that this useEffect can access the live
                // value of meeting (which is given as a parameter to the reducer)
                setMeetingPage((prevMeetingPage) => {
                    console.log('got meetingPage from server ', serverPage)

                    if (prevMeetingPage != 'prejoin') {
                        // if not prejoin, then switch!
                        let shouldSwitch = serverPage && serverPage != 'prejoin'
                        if (shouldSwitch) {
                            return serverPage
                        }
                    }
                    return prevMeetingPage

                })
            }
        })

    }, [])


    useEffect(() => {
        // let the server know when you change meeting page         
        if (meetingPage == 'prejoin') {
            // don't switch pages if you are still on prejoin
            return
        }
        if (props.hasEnteredRef.current == false) {
            // the first time you switch to video, you should
            // not send a message to the server (instead you should
            // join the current meeting page)
            props.hasEnteredRef.current = true
            if (meetingPageServer) {
                if (meetingPage != meetingPageServer) {
                    setMeetingPage(meetingPageServer)
                }
            }
            return
        }
        // if any user changes the meetingPage, then write it
        // to the real time databse
        console.log('writing meetingPage to server ', meetingPage)
        let path = `/${props.qtrId}/rooms/${props.roomId}/meetingPage/`
        database.ref(path).set({
            'currPage': meetingPage
        }).then(() => {
        });
    }, [meetingPage])

    return (
        <MeetingBodyWithState
            {...props}
            meetingPage={meetingPage}
            setMeetingPage={setMeetingPage}
            isEditable={props.isEditable}
            onRoomExit={props.onRoomExit}

        />
    )

})

const MeetingBodyWithState = ({
                                  meetingPage,
                                  setMeetingPage,
                                  user,
                                  jitsiRef,
                                  videoContainerRef,
                                  isEditable,
                                  onRoomExit
                              }) => {

    const showButtons = meetingPage != 'done' && meetingPage != 'prejoin'
    const isFullScreen = (meetingPage == 'video') || (meetingPage == 'prejoin')

    useEffect(() => {

        if (!videoContainerRef.current) {
            return
        }
        let newSize = {}
        if (isFullScreen) {
            newSize = {
                width: '100vw',
                height: '100vh'
            }
        } else {
            newSize = {
                width: `${DRAGGABLE_WIDTH}px`,
                height: `${DRAGGABLE_HEIGHT}px`
            }
        }
        if (meetingPage == 'done') {
            newSize = {width: 0, height: 0}
        }
        videoContainerRef.current.setIsDraggable(!isFullScreen, newSize)
        if (jitsiRef.current) {
            let api = jitsiRef.current
            let newButtons = isFullScreen ? TOOLBAR_BUTTONS : []
            api.executeCommand('overwriteConfig', {
                toolbarButtons: newButtons
            });
        }
    }, [meetingPage])

    return <>
        {showButtons && <VideoButtons
            meetingPage={meetingPage}
            setMeetingPage={setMeetingPage}
            jitsiRef={jitsiRef}
            onRoomExit={onRoomExit}
        />}
        <MeetingContent
            meetingPage={meetingPage}
            user={user}
            isEditable={isEditable}
        />
    </>

}


const VideoButtons = ({jitsiRef, meetingPage, setMeetingPage, onRoomExit}) => {
    const {roomId} = useParams()
    const [user] = useAuthState(auth());
    const {qtrId} = useParams()

    const endMeeting = async () => {
        let api = jitsiRef.current
        api.dispose();

        // database.ref(`/${quarter}/learners/${user.uid}`).remove();
        // database.ref(`/${quarter}/rooms/${roomId}/status/${user.uid}`).set(ROOM_EXITED);
        await functions.httpsCallable('exitRoom')({roomId: roomId}).then((result) => {
            console.log("exited room", result);
        }).catch((error) => {
            console.log("error exiting room", error);
        });

        setMeetingPage('done')
        onRoomExit()

    }


    let fullscreenVideoBtn = <ControlButton
        tag='video'
        tooltip='Fullscreen Video'
        setMeetingPage={setMeetingPage}
        meetingPage={meetingPage}
        icon={<FaExpand/>}
    />

    let psetWorkBtn = <ControlButton
        tag='colab'
        tooltip='Workspace'
        setMeetingPage={setMeetingPage}
        meetingPage={meetingPage}
        icon={<FaEdit/>}
    />


    return <span style={{
        padding: '5px',
        display: 'flex',
        justifyContent: 'center',
        zIndex: 200
    }}>

    {meetingPage === 'video' ? psetWorkBtn : fullscreenVideoBtn}

        <OverlayTrigger
            placement="bottom"
            dselay={{show: 250, hide: 0}}
            overlay={<Tooltip>Leave Meeting</Tooltip>}
        >
        <button onClick={() => endMeeting()} className='btn btn-lg btn-danger rounded-pill'
                style={{marginLeft: 5}}><FaPhone/></button>
    </OverlayTrigger>
    </span>
}

const ControlButton = (props) => {
    const getButtonClass = (tag) => {
        let className = 'btn btn-lg rounded-pill'
        if (tag == props.meetingPage) {
            className += ' btn-primary'
        } else {
            className += ' btn-dark'
        }
        return className
    }

    return <OverlayTrigger
        placement="bottom"
        delay={{show: 250, hide: 0}}
        overlay={<Tooltip>{props.tooltip}</Tooltip>}
    >
        <button
            onClick={() => props.setMeetingPage(props.tag)}
            className={getButtonClass(props.tag)}
        >{props.icon}</button>
    </OverlayTrigger>
}