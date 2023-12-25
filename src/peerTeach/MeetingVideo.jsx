import React from "react";
import {JitsiMeeting} from '@jitsi/react-sdk';
import {useParams} from "react-router";
import {DraggableComponent} from "./DraggableVideo.jsx"
import {TOOLBAR_BUTTONS} from "./ToolbarButtons.js";

const SERVER_URL = 'code-in-place.uuid.domains'

// https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/

export const MeetingVideo = ({onApiReady, user, overlayButtons, videoContainerRef, jitsiRef}) => {
    // CAUTION: this component should not rerender
    return <DraggableComponent
        ref={videoContainerRef}
        component={<VideoFrame onApiReady={onApiReady}
                               user={user}
        />}
        jitsiRef={jitsiRef}
    />
}


export const VideoFrame = ({user, onApiReady}) => {
    /**
     * This is the iframe of the jitsi video frame.
     * We want to be careful that this isn't created
     * many times for the same session!
     */
    console.log('VideoFrame created')
    let {roomId} = useParams()
    return <JitsiMeeting
        domain={SERVER_URL}
        roomName={roomId}
        configOverwrite={{
            startWithAudioMuted: true,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
            enableEmailInStats: false,
            prejoinEnabled: false,
            toolbarButtons: TOOLBAR_BUTTONS,
            enableNoisyMicDetection: false
        }}
        interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        }}
        userInfo={{
            displayName: user.displayName
        }}
        onApiReady={onApiReady}
        getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%'
            iframeRef.style.width = '100%'
        }}
    />
}
