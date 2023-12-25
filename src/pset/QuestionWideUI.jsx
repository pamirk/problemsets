import React, {useEffect, useState} from 'react';
import SplitPane from 'react-split-pane';
import Markdown from '../components/rendering/Markdown.jsx'
import {FinalAnswer} from "./components/FinalAnswer.jsx"
import {ExplanationTitleBar} from './components/ExplanationTitleBar.jsx';
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import {Link, useHistory, useParams} from 'react-router-dom';
import {FaLightbulb, FaPen} from "react-icons/fa";
import {getNextQuestionId, getPreviousQuestionId} from '../utils/PSetUtil.js';
import {AnswerExplanation} from "./components/AnswerExplanation.jsx"
import {QuestionSolution} from "./components/QuestionSolution.jsx"
import {Feedback} from "./components/Feedback.jsx"
// import { JoinButton } from '../components/colearning/JoinButton.js';

export const QuestionWideUI = (props) => {

    const [focusMode, setFocusMode] = useState(false)

    let leftPaneMaxIdealSize = 700
    let rightPaneMinSize = 600
    let asideSize = 70
    let windowWidth = window.innerWidth
    let splitWidth = windowWidth - asideSize

    let defaultSize = Math.min(
        leftPaneMaxIdealSize,
        windowWidth / 2,
        splitWidth - rightPaneMinSize
    )

    if (focusMode) {
        return <AnswerTabs
            focusMode={focusMode}
            setFocusMode={setFocusMode}
            {...props}
        />
    }

    return (
        <>
            {/* <FloatingComponent/> */}
            <SplitPane
                minSize={0}
                maxSize={-rightPaneMinSize}
                defaultSize={defaultSize}
                style={{height: '100vh'}}
            >
                <QuestionPane {...props}/>
                <AnswerTabs
                    focusMode={focusMode}
                    setFocusMode={setFocusMode}
                    {...props}
                />

            </SplitPane>

        </>
    );
}

const AnswerTabs = (props) => {

    return <div className="d-flex flex-column"
                style={{height: 'calc(100%)', maxWidth: props.focusMode ? '100%' : '100%'}}>
        <Tabs defaultActiveKey="docEditor" id="worktabs">

            <Tab eventKey="docEditor" title={<span style={{color: 'black'}}><FaPen/> Answer Editor</span>}>
                <div className="answerTab ">

                    <QuestionAnswer {...props} key='answer'/>

                </div>
            </Tab>

            {
                shouldShowSolution(props) &&
                <Tab eventKey="answer" title={<span style={{color: 'black'}}><FaLightbulb/> Solution</span>}>
                    <div className='answerTab standardAnswerPane'>
                        <QuestionSolution {...props} key='soln'/>
                    </div>
                </Tab>
            }


        </Tabs>


    </div>
}

const QuestionAnswer = (props) => {
    return <>
        <Feedback {...props} />

        <FinalAnswer
            {...props}

        />

        <ExplanationTitleBar {...props}/>
        <AnswerExplanation {...props} />
    </>
}


const shouldShowSolution = (props) => {
    return props.solutionData != undefined
}

const onSoundClick = () => {
    // from here:
    // https://stackoverflow.com/questions/47686345/playing-sound-in-react-js
    let soundUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    let audio = new Audio(soundUrl)
    audio.play()
    alert('lame')
}


const QuestionPane = (props) => {
    let {qtrId, psetId, qId} = useParams();
    let textOnlyMode = false
    let prevQId = getPreviousQuestionId(qId, props.publicPsetData['questionInfo'])
    let nextQId = getNextQuestionId(qId, props.publicPsetData['questionInfo'])

    const history = useHistory();

    // onKeyDown handler function
    const keyDownHandler = (event) => {
        // be careful that the text box isn't active

        // I turned off using arrows to navigate
        // if(!isEditorActive()) {
        //     let keyCode = event.code
        //     if(keyCode == 'ArrowRight' && nextQId != 'submit') {
        //         history.push(`/${qtrId}/${psetId}/${nextQId}`);
        //     }
        //     if(keyCode == 'ArrowLeft' && prevQId != 'splash') {
        //         history.push(`/${qtrId}/${psetId}/${prevQId}`)
        //     }
        // }
    };

    // handle keyboard events
    useEffect(() => {
        // only run this code once
        document.addEventListener("keydown", keyDownHandler, false);
        // return the destructor
        return () => {
            document.removeEventListener("keydown", keyDownHandler, false)
        }
    }, [nextQId, prevQId])

    return <div key={qId} className="questionLeftPane " style={{minWidth: '440px', height: '100%'}}>
        <SplitPane overflow="auto" split="horizontal" allowResize={false} primary="second" defaultSize={45}>

            <div className='d-flex justify-content-left' style={{width: '100%'}}>
                <div className='d-flex flex-column justify-content-between mx-3 mt-2' style={{maxWidth: 570}}>
                    <h4>{props.questionTitle}</h4>
                    <hr/>
                    <Markdown text={props.questionText} textOnlyMode={textOnlyMode}></Markdown>
                </div>
            </div>

            <div className='d-flex justify-content-left' style={{width: '100%'}}>
                <div className="d-flex justify-content-between mx-3" style={{width: '100%', maxWidth: 570}}>
                    <Link className="btn btn-light" to={`/${qtrId}/${psetId}/${prevQId}`}>Previous Question</Link>
                    <Link className="btn btn-light" to={`/${qtrId}/${psetId}/${nextQId}`}>Next Question</Link>
                </div>
            </div>
        </SplitPane>
    </div>
}

const FloatingComponent = () => {
    return (
        <div style={{
            zIndex: '1000',
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
        }}>
            {/* <JoinButton/> */}
        </div>
    )
}
