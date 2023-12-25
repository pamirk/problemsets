import React, {useState} from 'react';
import BootstrapSwitchButton from 'bootstrap-switch-button-react'
import {checkIsAdmin} from '../../utils/PSetUtil.js'
import {CodeAgent} from '../../components/questionParts/CodeAgent.jsx'
import {CodeOutputSplit} from '../../components/questionParts/CodeOutputSplit.jsx'
import {CodeCanvasSplit} from '../../components/questionParts/CodeCanvasSplit.jsx'
import {CodeGraphSplit} from '../../components/questionParts/CodeGraphSplit.jsx'
import {RichTextEditor} from '../../components/richText/RichTextEditor.jsx';

export const QuestionSolution = (props) => {
    let isAdmin = checkIsAdmin(props.userMetaData)
    const [isEditingAnswer, setIsEditingAnswer] = useState(false)
    return <>
        {isAdmin &&
            <span><b>Answer editing: </b>
            <BootstrapSwitchButton
                checked={isEditingAnswer}
                onlabel='On'
                offlabel='Off'
                size="sm"
                onChange={(isOn) => setIsEditingAnswer(isOn)}

            />
        </span>
        }
        <AnswerExplanationEditor
            {...props}
            isEditingAnswer={isEditingAnswer}
        />
    </>
}

const AnswerExplanationEditor = (props) => {

    let firebaseDocPath = `psets/${props.qtrId}/${props.psetId}/private/answers/${props.qId}`

    if (props.questionType.includes('canvas')) {
        return <>
            <CodeCanvasSplit {...props}
                             editable={props.isEditingAnswer}
                             firebaseDocPath={firebaseDocPath}
            />
        </>
    }

    if (props.questionType.includes('graph')) {
        return <>
            <b>Agent Code:</b>
            <CodeGraphSplit {...props}
                            editable={props.isEditingAnswer}
                            firebaseDocPath={firebaseDocPath}
            />
        </>
    }

    if (props.questionType.includes('agent')) {
        return <>
            <b>Agent Code:</b>
            <CodeAgent {...props}
                       editable={props.isEditingAnswer}
                       firebaseDocPath={firebaseDocPath}
            />
        </>
    }

    if (props.questionType.includes('code')) {
        return <>
            <b>Code:</b>
            <CodeOutputSplit {...props}
                             editable={props.isEditingAnswer}
                             firebaseDocPath={firebaseDocPath}
            />
        </>
    }
    return <>
        <b>Explanation:</b>
        <RichTextEditor {...props}
                        editable={props.isEditingAnswer}
                        firebaseDocPath={firebaseDocPath}
        />
    </>
}
