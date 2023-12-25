import React from 'react';
import {CodeOutputSplit} from '../../components/questionParts/CodeOutputSplit.jsx';
import {CodeAgent} from '../../components/questionParts/CodeAgent.jsx';
import {CodeCanvasSplit} from '../../components/questionParts/CodeCanvasSplit.jsx'
import {CodeGraphSplit} from '../../components/questionParts/CodeGraphSplit.jsx';
import {RichTextEditor} from '../../components/richText/RichTextEditor.jsx';

export const AnswerExplanation = (props) => {
    let firebaseDocPath = `users/${props.user.uid}/${props.qtrId}/${props.psetId}/answers/${props.qId}`
    const uniqueKey = `${firebaseDocPath}-${props.editable}`
    return <AnswerExplanationSafe {...props}
                                  firebaseDocPath={firebaseDocPath}
                                  key={uniqueKey}
    />
}

const AnswerExplanationSafe = (props) => {
    if (props.questionType.includes('agent')) {
        return <CodeAgent {...props} />
    }
    if (props.questionType.includes('graph')) {
        return <CodeGraphSplit {...props} />
    }
    if (props.questionType.includes('canvas')) {
        return <CodeCanvasSplit {...props} />
    }
    if (props.questionType.includes('code')) {
        return <CodeOutputSplit {...props} />
    }
    if (props.questionType.includes('none')) {
        return <></>
    }
    return <RichTextEditor {...props}/>
}