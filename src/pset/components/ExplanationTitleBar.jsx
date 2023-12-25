import React from 'react';
import {FaCompress, FaExpand, FaRegClock} from 'react-icons/fa';
import {Link, useParams} from 'react-router-dom';

export const ExplanationTitleBar = (props) => {
    let {qtrId, psetId, qId} = useParams()
    let showHistory = props.showHistory == undefined ? true : props.showHistory
    let historyPage = `/history/${qtrId}/${psetId}/${qId}`

    if (props.questionType.includes('none')) {
        return <></>
    }

    return <div className='d-flex justify-content-between'>
        <b>{getExplanationTitle(props.questionType)}:</b>
        <span>
          <FocusModeToggle questionType={props.questionType} focusMode={props.focusMode}
                           setFocusMode={props.setFocusMode}/>
            {/* <ProblemResources user={props.user.uid}/> */}
            {showHistory && <Link target="_blank" to={historyPage}><FaRegClock/></Link>}
        </span>
    </div>
}

const FocusModeToggle = ({focusMode, setFocusMode, questionType}) => {

    if (questionType.includes('agent')
        || questionType.includes('canvas')
        || questionType.includes('graph')
        || questionType.includes('code')
    ) {

        if (focusMode) {
            return <FaCompress onClick={() => setFocusMode(false)} style={{marginRight: 5}}/>
        }
        return <FaExpand onClick={() => setFocusMode(true)} style={{marginRight: 5}}/>
    }
    return <></>
}

function getExplanationTitle(type) {
    if (type.includes('agent')) {
        return 'Agent'
    }

    if (type.includes('canvas')) {
        return 'Python'
    }

    if (type.includes('code')) {
        return 'Python'
    }
    if (type.includes('graph')) {
        return 'Python'
    }


    return 'Explanation'
}