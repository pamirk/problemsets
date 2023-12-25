import React from "react";
import {useParams} from "react-router-dom";
import SplitPane from "react-split-pane";
import {RichTextEditor} from "../components/richText/RichTextEditor";
import {ShowPSet} from "./ShowPSet.jsx";

export const MeetingContent = ({user, meetingPage, isEditable}) => {
    if (meetingPage === 'done') {
        return <>Thank you!</>
    }

    if (meetingPage == 'video') {
        return <></>
    }
    if (meetingPage == 'pset') {
        return <ShowPSet/>
    } else {
        return <div className="d-flex w-100" style={{height: 'calc(100vh - 70px'}}>
            <SplitPane defaultSize={'50%'}>
                <ShowPSet/>
                <WorkSpace user={user} isEditable={isEditable}/>
            </SplitPane>
        </div>
    }
}

export const WorkSpace = ({user, isEditable}) => {
    let {roomId} = useParams()
    console.log("userrrr", user)
    console.log('~~~~~~isEditbleMC~~~~', isEditable)

    return <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        padding: '10px',
        // border: '1px solid lightgray'
    }}>
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex'
        }}>
            <RichTextEditor
                firebaseDocPath={`meetings/${roomId}`}
                user={user}
                editable={isEditable}
            />
        </div>
    </div>
}