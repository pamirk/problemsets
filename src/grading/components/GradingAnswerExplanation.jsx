import {CodeOutputSplit} from '../../components/questionParts/CodeOutputSplit.jsx';
import {CodeAgent} from '../../components/questionParts/CodeAgent.jsx';
import {CodeCanvasSplit} from '../../components/questionParts/CodeCanvasSplit.jsx'
import {CodeGraphSplit} from '../../components/questionParts/CodeGraphSplit.jsx';
import {RichTextEditor} from '../../components/richText/RichTextEditor.jsx';

export const GradingAnswerExplanation = (props) => {
    if (props.questionType.includes('agent')) {
        return <>
            <CodeAgent {...props}
                       firebaseDocPath={props.explanationPath}
                       submitAnswer={(e) => {
                       }}
            />
        </>
    }


    if (props.questionType.includes('graph')) {
        return <>
            <CodeGraphSplit {...props}
                            firebaseDocPath={props.explanationPath}
                            submitAnswer={(e) => {
                            }}
            />
        </>
    }

    if (props.questionType.includes('canvas')) {
        return <>
            <CodeCanvasSplit {...props}
                             firebaseDocPath={props.explanationPath}
                             submitAnswer={(e) => {
                             }}
            />
        </>
    }

    if (props.questionType.includes('code')) {
        return <>
            <CodeOutputSplit {...props}
                             firebaseDocPath={props.explanationPath}
                             submitAnswer={(e) => {
                             }}
            />
        </>
    }
    if (props.questionType.includes('none')) {
        return <></>
    }

    return <>
        <RichTextEditor {...props}
                        firebaseDocPath={props.explanationPath}
                        collaborative={props.collaborative}
                        editable={props.editable}
                        contentKey={'content'}
        />
    </>
}