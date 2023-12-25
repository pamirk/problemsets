import React from 'react';
import Markdown from '../components/rendering/Markdown.jsx'
import {FinalAnswer} from "./components/FinalAnswer.jsx"
import {Link, useParams} from 'react-router-dom';
import {getNextQuestionId, getPreviousQuestionId} from '../utils/PSetUtil.js';
import {AnswerExplanation} from "./components/AnswerExplanation.jsx"
import Feedback from 'react-bootstrap/esm/Feedback';

export const QuestionMobileUI = (props) => {

    let questionType = props.questionInfo['type']
    return <div className='p-2'>
        <h4>{props.questionTitle}</h4>
        <Markdown text={props.questionText}></Markdown>
        <hr/>
        <Feedback {...props} />

        <h4>Your Answer:</h4>


        <FinalAnswer
            {...props}
        />

        <AnswerExplanation {...props}/>


        <PreviousNextButtons
            publicPsetData={props.publicPsetData}
        />


    </div>
}

const PreviousNextButtons = (props) => {
    let {qtrId, psetId, qId} = useParams();
    let prevQId = getPreviousQuestionId(qId, props.publicPsetData['questionInfo'])
    let nextQId = getNextQuestionId(qId, props.publicPsetData['questionInfo'])
    return <>
        <hr/>
        <div className="d-flex justify-content-between px-2">
            <Link className="btn btn-light" to={`/${qtrId}/${psetId}/${prevQId}`}>Previous Question</Link>
            <Link className="btn btn-light" to={`/${qtrId}/${psetId}/${nextQId}`}>Next Question</Link>
        </div>
    </>
}
