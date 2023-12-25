import SplitPane from "react-split-pane"
import {ShowPSet} from "./ShowPSet.jsx";
import {WorkSpace} from "./MeetingContent.jsx";

export const PeerTeachAfterMeeting = (user) => {
    return (
        <div className="d-flex w-100" style={{height: 'calc(100vh - 70px', margin: "3px"}}>
            <SplitPane defaultSize={'50%'}>
                <div style={{marginRight: "5px"}}>
                    <ShowPSet/>
                </div>
                <WorkSpace user={user} isEditable={false}/>
            </SplitPane>
        </div>
    )
}