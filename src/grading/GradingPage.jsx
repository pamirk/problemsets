import React, {useMemo} from 'react';
import {useDocumentDataOnce,} from "react-firebase-hooks/firestore";
import {useParams} from "react-router-dom";
import {GradingSplash} from './GradingSplash.jsx'
import {GradingQuestion} from './GradingQuestion.jsx';
import {GradingStudentSummary} from './GradingStudentSummary.jsx';
import {firestore} from "../firebaseApp.js";

export const GradingPage = (props) => {
    console.log('grading page')
    let { qtrId, psetId } = useParams();

    // get public pset data
    var [publicPsetData, publicPsetLoading, publicPsetLoadingErr] = useDocumentDataOnce(
        firestore.doc(`psets/${qtrId}/${psetId}/public`)
    );

    var [classData, classLoading, classLoadingErr] = useDocumentDataOnce(
        firestore.doc(`class/${qtrId}/`)
    );

    // get user data (ie are they a TA?)
    const memoizedMetaDataRequest = useMemo(() => {
        console.log('recreating the user meta data request')
        return firestore.doc(`users/${props.user.uid}`)
    }, [props.user.uid]);
    var [userMetaData, userMetaDataLoading] = useDocumentDataOnce(memoizedMetaDataRequest)

    if(publicPsetLoading || classLoading || userMetaDataLoading) {
        return <></>
    }

    if(publicPsetLoadingErr) {
        console.log('pset',publicPsetLoadingErr)
        return <>Server error. Perhaps you have insufficient permissions </>
    }

    return <GradingPageWithData
        publicPsetData={publicPsetData}
        user={props.user}
        classData = {classData}
        userMetaData = {userMetaData}
    />
}

const GradingPageWithData = (props) => {
    console.log('grading page with data')
    let { qtrId, psetId, qId, studentId } = useParams();
    return <>
        <GradingPageBody {...props}
            qId = {qId}
            qtrId = {qtrId}
            psetId = {psetId}
            studentId = {studentId}
        />
        <div style={{height:'60px'}} />
        <GradingNavbar {...props}
            qId = {qId}
            qtrId = {qtrId}
            psetId = {psetId}
            studentId = {studentId}
        />

    </>
}

const GradingPageBody = (props)=> {
    return <div className='container-fluid'>
        <div className='row'>
            <div className='col'>
                <GradingPageContent {...props}/>
            </div>
        </div>
    </div>
}

const GradingPageContent = (props) => {
    if(props.qId == 'splash') {
        return <GradingSplash {...props} />
    }
    if(props.qId == 'studentSummary') {
        return <GradingStudentSummary {...props}/>
    }
    return <GradingQuestion {...props}/>
}

const GradingNavbar = (props) => {
    let {qtrId, psetId, qId, studentId} = props
    return <nav className="navbar fixed-bottom navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
            <ol className="breadcrumb">
            <li className="breadcrumb-item">Grading</li>
                {/* <li className="breadcrumb-item"><a href={`/grading/${qtrId}`}>{qtrId}</a></li> */}
                <li className="breadcrumb-item"><a href={`/grading/${qtrId}/${psetId}`}>{psetId}</a></li>
                {
                    qId != 'splash' &&
                    <li className="breadcrumb-item"><a href={`/grading/${qtrId}/${psetId}/${qId}`}>{qId}</a></li>
                }

                <li className="breadcrumb-item"><a href={`/grading/${qtrId}/${psetId}/${qId}/${studentId}`}>{studentId}</a></li>
            </ol>
        </div>
    </nav>
}

