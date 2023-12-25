import React from 'react';
import {useDocumentDataOnce,} from "react-firebase-hooks/firestore";
import {useParams} from "react-router-dom";
import 'ace-builds/src-noconflict/ace';
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-textmate";
import "ace-builds/src-min-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/python";
import Markdown from '../components/rendering/Markdown.jsx'
import {firestore} from "../firebaseApp.js";

export function ShowPSet(props) {

    // get the first question in the pset and redirect to it

    let {qtrId, psetId} = useParams();

    // get the pset data
    var [publicData, publicDataLoading, error] = useDocumentDataOnce(
        firestore.doc(`psets/${qtrId}/${psetId}/public`)
    );

    // wait until it is all loaded
    if (publicDataLoading) {
        return <></>
    }


    return <>
        <PrintOuterWithData
            user={props.user}
            publicQuestionInfo={publicData['questionInfo']}
            publicPSetData={publicData}
        />
    </>
}


const PrintPsetWithData = (props) => {
    return <div style={{
        minHeight: '100vh',
        display: 'flex',
    }}>

        <div style={{maxWidth: 720, paddingLeft: '20px', background: 'white', minHeight: '100vh'}}>
            {/* <center><h2>PSet 1</h2></center> */}
            {/* <hr/> */}
            <div className="alert alert-primary mt-2"><b>Problem Set</b> You can talk about the problems, but each
                student must write up their own solutions!
            </div>
            <h1 style={{textAlign: 'center'}}>CS109 {props.publicPSetData['title']}</h1>
            <hr/>
            {/* <btn onClick = {() => generatePDF()} className="btn btn-primary "><FaPrint/> Save as PDF</btn> */}
            {/* <span> </span> */}
            {/*  */}
            {
                props.publicQuestionInfo.map(function (questionInfo, index) {
                    return <PrintQuestion
                        questionInfo={questionInfo}
                        index={index}
                        key={index}
                        user={props.user}
                    />
                })
            }
        </div>
    </div>
}

const PrintQuestion = (props) => {

    let {qtrId, psetId} = useParams();
    let qId = props.questionInfo.qId
    // users/8LHCxaTrQAYDc1f4KB72iTRI2hJ2/win22/pset1/answers


    return <PrintQuestionWithData
        questionInfo={props.questionInfo}
        index={props.index}
    />
}

const PrintQuestionWithData = (props) => {

    const type = props.questionInfo.type;

    if (type == 'subpart') {
        return <></>
    }
    const questionText = props.questionInfo['prompt']


    return <>
        <div className="mt-5">
            <h3>{props.index + 1}. {props.questionInfo.title}</h3>
            <div className="purpleBox">
                <Markdown text={questionText}></Markdown>
            </div>

        </div>
    </>
}

const PrintOuterWithData = (props) => {

    return (
        <>

            <PrintPsetWithData
                user={props.user}
                publicQuestionInfo={props.publicQuestionInfo}
                publicPSetData={props.publicPSetData}
            />
        </>
    )
}

