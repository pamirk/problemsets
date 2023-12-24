import React, {useEffect, useMemo} from 'react';
import {useDocumentData, useDocumentDataOnce} from "react-firebase-hooks/firestore";
import firebase from "firebase";
import {Link, useHistory, useParams} from "react-router-dom";
import {getQuestionInfo, isEditorActive} from '../utils/PSetUtil.js'
import SplitPane from 'react-split-pane';
import Markdown from '../components/rendering/Markdown.jsx'
import {FinalAnswer} from '../pset/components/FinalAnswer';
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import {Breadcrumb} from 'react-bootstrap';
import {GradingPane} from './components/GradingPane'
import Swal from 'sweetalert2';
import {GradingAnswerExplanation} from './components/GradingAnswerExplanation.jsx';

export const GradingStudent = (props) => {

    let { qId, qtrId, psetId } = useParams();

    // get public pset data
    var [publicPsetData, publicPsetLoading, publicPsetLoadingErr] = useDocumentDataOnce(
        firebase.firestore().doc(`psets/${qtrId}/${psetId}/public`)
    );

    var [classData, classLoading, classLoadingErr] = useDocumentDataOnce(
        firebase.firestore().doc(`class/${qtrId}/`)
    );

    // needed to find the next student ungraded
    var [gradebook, gradebookLoading, gradebookLoadingErr] = useDocumentData(
        firebase.firestore().doc(`/psets/${qtrId}/${psetId}/private/gradebook/${qId}`)
    );

    // get user data (ie are they a TA?)
    const memoizedMetaDataRequest = useMemo(() => {
        console.log('recreating the user meta data request')
        return firebase.firestore().doc(`users/${props.user.uid}`)
    }, [props.user.uid]);
    var [userMetaData, userMetaDataLoading] = useDocumentDataOnce(memoizedMetaDataRequest)


    if(publicPsetLoading || classLoading || gradebookLoading || userMetaDataLoading ) {
        return <></>
    }


    if(publicPsetLoadingErr) {
        return <>Server error. Perhaps you have insufficient permissions </>
    }

    let questionInfo = getQuestionInfo(qId, publicPsetData.questionInfo)
    let questionType = questionInfo.type

    return <GradingStudentWithData
        {...props}
        questionType={questionType}
        questionInfo = {questionInfo}
        publicPsetData = {publicPsetData}
        gradebook = {gradebook}
        classData={classData}
        qId = {qId}
        psetId = {psetId}
        qtrId = {qtrId}
        userMetaData = {userMetaData}
    />

}

const GradingStudentWithData = (props) => {
    return <SplitPane  overflow="auto"  split="horizontal" allowResize={false} primary="second" defaultSize={54}>
        <SplitPane
            size={'33%'}
            minSize={2}
        >
            <QuestionPane {...props}/>
            <AnswerAndGrading {...props} />
        </SplitPane>
        <BottomNav {...props}/>
    </SplitPane>
}

const QuestionPane = (props) => {
    let solutionPath = `/psets/${props.qtrId}/${props.psetId}/private/answers/${props.qId}`
    let question = getQuestionInfo(props.qId, props.publicPsetData.questionInfo)
    let prompt = question.prompt
    // warning: tiptap questions save the answer in the content field
    return <div className="d-flex flex-column" style={{height:'calc(100%)'}}>
        <Tabs defaultActiveKey="prompt" id="questionTabs">
            <Tab  eventKey="prompt" title={<span style={{color:'black'}}>Prompt</span>}>

                <div className='p-2'>
                    <b>Prompt: {question.title}</b>
                    <Markdown text={prompt}
                    ></Markdown>
                </div>
            </Tab>

            <Tab  eventKey="soln" title={<span style={{color:'black'}}>Solution</span>}>
                <div className='p-2 answerTab'>
                <GradingAnswerExplanation {...props}
                    editable ={true}
                    explanationPath={solutionPath}
                    collaborative={true}
                />


                </div>
            </Tab>
        </Tabs>
    </div>
}

const AnswerAndGrading = (props) => {
    let { studentId } = useParams();
    return <SplitPane size={'50%'}>
        <div className="d-flex flex-column" style={{height:'calc(100%)'}}>
            <Tabs defaultActiveKey="prompt" id="questionTabs">
                <Tab  eventKey="prompt" title={<span style={{color:'black'}}>Student Answer</span>}>
                    <div className='p-2 answerTab'>
                        <AnswerPane {...props} studentId={studentId}/>
                    </div>
                </Tab>

            </Tabs>
        </div>
        <GradingPaneTab {...props} studentId={studentId}/>
    </SplitPane>
}

const AnswerPane = (props) => {
    return <AnswerPaneWithData {...props}
    />
}

const AnswerPaneWithData = (props) => {
    let explanationPath = `users/${props.studentId}/${props.qtrId}/${props.psetId}/answers/${props.qId}`
    console.log(explanationPath)
    return <>
                <FinalAnswer {...props}
                    user={{uid:props.studentId}}
                />
                <GradingAnswerExplanation {...props}
                    editable ={false}
                    explanationPath={explanationPath}
                />
    </>
}

const GradingPaneTab = (props) => {
    return <div className="d-flex flex-column" style={{height:'calc(100%)'}}>
        <Tabs defaultActiveKey="grading" id="gradingTabs">
            <Tab  eventKey="grading" title={<span style={{color:'black'}}>Grading</span>}>
                <div className='p-2 answerTab'>
                    <GradingPane {...props} editing={true}/>
                </div>
            </Tab>
        </Tabs>
    </div>

}

const BottomNav  = (props) => {
    let { studentId } = useParams();
    let currIndex = getCurrStudentIndex(props, studentId)
    let nextId = getNextStudent(props, studentId)
    let previousId = getPreviousStudent(props, studentId)
    var mainButtonDisabled = true//this.props.status != 'grading' || !this.props.isFilled
    var navDisabed = false
    let mainButtonText = 'Edit Grade'
    let submitText = 'Submit Grade' //this.props.isGradeSubmitted ? 'Resubmit Grade' : 'Submit Grade'
    const history = useHistory();

     // onKeyDown handler function
     const keyDownHandler = (event) => {
        // be careful that the text box isn't active

        if(!isEditorActive()) {
            let keyCode = event.code
            if(keyCode == 'ArrowRight') {
                if(nextId){
                    history.push(`/grading/${props.qtrId}/${props.psetId}/${props.qId}/${nextId}`);
                }

            }
            if(keyCode == 'ArrowLeft') {
                if(previousId) {
                    history.push(`/grading/${props.qtrId}/${props.psetId}/${props.qId}/${previousId}`)
                }

            }
        }
    };

    // handle keyboard events
    useEffect(() => {
        // only run this code once
        document.addEventListener("keydown", keyDownHandler, false);
        // return the destructor
        return () => {
            document.removeEventListener("keydown", keyDownHandler, false)
        }
    }, [nextId, previousId])

    return (
        <div className="bottomNav mt-10">
          <div/>
          <div className ="">
            <Breadcrumb className="bg-white">
            <Breadcrumb.Item >
                Grading
            </Breadcrumb.Item>
            <Breadcrumb.Item href={`/grading/${props.qtrId}/${props.psetId}`}>
                {props.psetId}
            </Breadcrumb.Item>
            <Breadcrumb.Item href={`/grading/${props.qtrId}/${props.psetId}/${props.qId}`}>
                {props.qId}
            </Breadcrumb.Item>
            <Breadcrumb.Item active>Student {currIndex}</Breadcrumb.Item>
            </Breadcrumb>
        </div>
          <div className="">
            <div className = "problemNavButtons">

               <Link
                className={'btn btn-info ' + (previousId == null ? ' disabled':'')}
                style={{marginRight:'5px'}}
                to={`/grading/${props.qtrId}/${props.psetId}/${props.qId}/${previousId}`}
                onClick={ (event) => {if(previousId == null) event.preventDefault() }}
              >
                <i className="fa fa-angle-left"/> Previous
              </Link>
              <Link
                className="btn mr-2 btn-warning"
                disabled={mainButtonDisabled}
                style={{marginRight:'5px'}}
                onClick={() => props.onMainButton(mainButtonText)}
              >{mainButtonText}</Link>
              <Link
                className={'btn btn-info ' + (nextId == null ? ' disabled':'')}
                style={{marginRight:'5px'}}
                onClick={ (event) => {if(nextId == null) event.preventDefault() }}
                to={`/grading/${props.qtrId}/${props.psetId}/${props.qId}/${nextId}`}
              >
                  Next <i className="fa fa-angle-right"/>
              </Link>
              <button
                className={'btn btn-info ' + (nextId == null ? ' disabled':'')}
                style={{marginRight:'5px'}}
                onClick={ () => {
                    let nextUngraded = getNextUngraded(props.classData, props.gradebook)
                    if(nextUngraded != null) {
                        history.push(`/grading/${props.qtrId}/${props.psetId}/${props.qId}/${nextUngraded}`);
                    } else {
                        Swal.fire({
                            toast:true,
                            icon: 'success',
                            title: 'All done!',
                            showConfirmButton: true,
                        });
                    }
                }}
              >
                  Next Ungraded<i className="fa fa-angle-right"/>
              </button>
              <button
                className={'btn btn-info ' + (nextId == null ? ' disabled':'')}
                style={{marginRight:'5px'}}
                onClick={ () => {
                    let nextUnverified = getNextUnverified(props.classData, props.gradebook)
                    if(nextUnverified != null) {
                        history.push(`/grading/${props.qtrId}/${props.psetId}/${props.qId}/${nextUnverified}`);
                    } else {
                        Swal.fire({
                            toast:true,
                            icon: 'success',
                            title: 'All done!',
                            showConfirmButton: true,
                        });
                    }
                }}
              >
                  Next Unverified<i className="fa fa-angle-right"/>
              </button>
            </div>
          </div>
        </div>
    );
}

function getNextUnverified(classData, gradebook) {
    for (const student of classData['students']) {
        let studentId = student.uid
        if(!studentId in gradebook) {
            return student.uid
        }
        if(!gradebook[studentId]) {
            return student.uid
        }
        if(gradebook[studentId].grader == 'auto') {
            return student.uid
        }

    }
    return null;
}

function getNextUngraded(classData, gradebook) {
    for (const student of classData['students']) {
        let studentId = student.uid
        if(!studentId in gradebook) {
            return student.uid
        }
        if(!gradebook[studentId]) {
            return student.uid
        }

    }
    return null;
}

function getCurrStudentIndex(props, currStudentId) {
    let studentList = props.classData.students
    for (let index = 0; index < studentList.length; index++) {
        const student = studentList[index];
        if(student.uid == currStudentId) {
            return index + 1
        }
    }
    console.error('could not find student ', currStudentId)
    return null
}

function getNextStudent(props, currStudentId) {
    let studentList = props.classData.students
    for (let index = 0; index < studentList.length; index++) {
        const student = studentList[index];
        if(student.uid == currStudentId) {
            if(index + 1 < studentList.length) {
                return studentList[index + 1].uid
            } else {
                // end of the list
                return null
            }
        }
    }
    console.error('could not find student ', currStudentId)
    return null
}

function getPreviousStudent(props, currStudentId) {
    let studentList = props.classData.students
    for (let index = 0; index < studentList.length; index++) {
        const student = studentList[index];
        if(student.uid == currStudentId) {
            if(index != 0) {
                return studentList[index - 1].uid
            } else {
                // start of the list
                return null
            }
        }
    }
    console.error('could not find student ', currStudentId)
    return null
}