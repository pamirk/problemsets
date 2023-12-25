import React, {useEffect, useRef, useState} from 'react';
import {useDocumentData,} from "react-firebase-hooks/firestore";
import {useParams} from "react-router-dom";
import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import {QuestionWideUI} from "./QuestionWideUI.jsx"
import {QuestionMobileUI} from "./QuestionMobileUI.jsx"
import API_ROUTE from '../ApiRoute.js';
import {checkIsPastDeadline, getQuestionInfo} from "../utils/PSetUtil.js"
import {v4 as uuidv4} from 'uuid';
import {firestore} from "../firebaseApp.js";

/**
 * Notes to future reader
 * One strange thing about this question is that it doesn't write the first
 * debounce to the server! This is a precaution to prevent a looping update
 */

export const Question = ({
                             userMetaData,
                             user,
                             studentPsetData,
                             publicPsetData,
                             allFeedback
                         }) => {
    const [editable, setEditable] = useState(!checkIsPastDeadline(publicPsetData, studentPsetData))
    const [sessionId, setSessionId] = useState(uuidv4())

    let publicQuestionInfo = publicPsetData['questionInfo']
    let {qId, qtrId, psetId} = useParams();
    let question = getQuestionInfo(qId, publicQuestionInfo)
    let corrects = studentPsetData.corrects;


    // I load some data which might not be used. Why? Because I don't want to half render a page
    // also it seems like the requests can be parallelized if they are all made at the same time.


    // the deadline could pass while the page is open! useEffect makes sure this
    // code runs exactly once. It creates a timer which runs every 10k ms
    useEffect(() => {
        // create a timer which runs every 10k ms
        const timer = setInterval(() => {
            setEditable(!checkIsPastDeadline(publicPsetData, studentPsetData))
        }, 10000);
    }, [qId]); // the empty dependency array forces only once


    let isCorrect = qId in corrects && corrects[qId]

    let isPastDeadline = checkIsPastDeadline(publicPsetData, studentPsetData)

    // decide if the person should have access to the solutions before we fetch
    // TODO: refactor into a helper function
    let hasSoln = 'solutionsReleased' in publicPsetData && publicPsetData['solutionsReleased']

    // students can't see solutions if they are not done yet!
    if (!isPastDeadline) {
        hasSoln = false
    }

    // SLs and admins can always see solutions
    if (userMetaData && userMetaData['role'] && userMetaData['role'] == 'admin') {
        hasSoln = true
    }

    if (!hasSoln) {
        return <QuestionWithData
            user={user}
            qtrId={qtrId}
            psetId={psetId}
            qId={qId}
            publicPsetData={publicPsetData}
            questionInfo={question}
            isCorrect={isCorrect}
            editable={editable}
            solutionData={null}
            userMetaData={userMetaData}
            feedbackData={allFeedback[qId]}
            sessionId={sessionId}
        />
    }
    return <QuestionWithSoln
        user={user}
        qtrId={qtrId}
        psetId={psetId}
        qId={qId}
        publicPsetData={publicPsetData}
        questionInfo={question}
        isCorrect={isCorrect}
        editable={editable}
        userMetaData={userMetaData}
        feedbackData={allFeedback[qId]}
        sessionId={sessionId}
    />
};

export const QuestionWithSoln = (props) => {
    // try to load the solutions. You might not be able to, which is fine!
    // that just means the solutions are not released yet :-)
    // /psets/win22/pset1/private/answers/countingcards
    var [solutionData, solutionDataLoading, solutionLoadingError] = useDocumentData(
        firestore
            .collection("psets")
            .doc(`${props.qtrId}/${props.psetId}/private/answers/${props.qId}`)
    );
    if (solutionDataLoading) {
        return <></>
    }

    // TODO: include this when Chris is teaching
    if (solutionLoadingError) {
        return <>Failed to load solution. Please refresh.</>
    }

    return <QuestionWithData
        {...props}
        solutionData={solutionData}
    />
}

export const QuestionWithData = ({
                                     user,
                                     qtrId,
                                     psetId,
                                     qId,
                                     feedbackData,
                                     userMetaData,
                                     editable,
                                     publicPsetData,
                                     questionInfo,
                                     solutionData,
                                     isCorrect,
                                     sessionId
                                 }) => {


    const questionText = questionInfo['prompt']
    const questionTitle = `${questionInfo['title']}`

    const [isCheckingAnswer, setIsCheckingAnswer] = useState(false)
    const [width, setWidth] = useState(window.innerWidth);

    // we dont want to write when the data first loads
    // useRef object will persist for the full lifetime of the component.
    const isFirstDebounce = useRef();
    useEffect(() => {
        // starts false! This is only turned on when a change comes form someone else...
        isFirstDebounce.current = false
    }, [])

    // Function: Take the value in the answer field and send it to ther server,
    // fire a swal with the results
    // this "answer" is the final answer (eg a number), not the explanation
    const onSubmitAnswer = (answer) => submitAnswer(answer, setIsCheckingAnswer, user, qId, psetId, qtrId)

    function handleWindowSizeChange() {
        setWidth(window.innerWidth);
    }

    useEffect(() => {
        window.addEventListener('resize', handleWindowSizeChange);
        return () => {
            window.removeEventListener('resize', handleWindowSizeChange);
        }
    }, []);


    let isMobile = (width <= 768);

    let childProps = {
        qId: qId,
        qtrId: qtrId,
        psetId: psetId,
        user: user,
        userMetaData: userMetaData,
        questionType: questionInfo['type'],
        questionTitle: questionTitle,
        questionText: questionText,
        questionInfo: questionInfo,
        submitAnswer: onSubmitAnswer,
        currIsCorrect: isCorrect,
        isCheckingAnswer: isCheckingAnswer,
        publicPsetData: publicPsetData,
        editable: editable,
        solutionData: solutionData,
        feedbackData: feedbackData,
        sessionId: sessionId
    }

    if (isMobile) {
        return <QuestionMobileUI {...childProps}/>
    } else {
        return <QuestionWideUI {...childProps}/>
    }
}


const checkAnswerSwal = () => {
    Swal.fire({
        toast: true,
        icon: 'info',
        title: 'Checking Answer',
        position: 'top-end',
        showConfirmButton: false,
        timer: 10000,
        timerProgressBar: true
    });
}

const checkAnswerErr = () => {
    Swal.fire({
        toast: true,
        icon: 'error',
        title: 'Something went wrong',
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
    });
}


function submitAnswer(answer, setIsCheckingAnswer, user, qId, psetId, qtrId) {
    if (!answer) {
        // they have an empty answer. Do nothing?
    } else {
        checkAnswerSwal()
        setIsCheckingAnswer(true);
        // submit the check to the server (authenticated)
        user.getIdToken(true)
            .then(function (token) {
                let URL = `${API_ROUTE}checkAnswer`;
                axios.post(URL, {
                    token: token,
                    guess: answer,
                    qId: qId,
                    psetId: psetId,
                    qtrId: qtrId
                }).then(response => {
                    let wasCorrect = response.data.isCorrect;
                    // setIsCorrect(wasCorrect);
                    withReactContent(Swal).fire({
                        title: wasCorrect ? 'Correct' : 'Not correct, but keep trying!',
                        icon: wasCorrect ? 'success' : 'info',
                    });
                    setIsCheckingAnswer(false);
                }).catch(err => {
                    console.error(err);
                    checkAnswerErr()
                    setIsCheckingAnswer(false);
                });
            });
    }
};

