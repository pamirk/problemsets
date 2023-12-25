import React from 'react';
import {calcGradeFraction, checkify} from '../../grading/GradingUtil.jsx';
import {RichTextEditor} from '../../components/richText/RichTextEditor.jsx';

export const Feedback = (props) => {
    if (!props.publicPsetData.gradesReleased && true) {
        return <></>
    }
    if (!props.feedbackData) {
        return <></>
    }

    return <FeedbackWithData
        {...props}
    />

}

const FeedbackWithData = (props) => {
    let firebaseDocPath = `users/${props.user.uid}/${props.qtrId}/${props.psetId}/feedback/${props.qId}`
    return <>
        <b>TA Feedback: <GradeCheck
            feedbackData={props.feedbackData}
            publicPsetData={props.publicPsetData}
        /></b>
        <div style={{marginBottom: '10px'}}>
            <RichTextEditor {...props}
                            firebaseDocPath={firebaseDocPath}
                            editable={false}
                            collaborative={false}
                            contentKey={"comment"}
            />
        </div>
    </>
}

const GradeCheck = ({feedbackData, publicPsetData}) => {
    let rawGrade = calcGradeFraction(feedbackData)
    if (rawGrade == null) {
        return <></>
    }
    return checkify(rawGrade.points, rawGrade.maxPoints, publicPsetData)
}