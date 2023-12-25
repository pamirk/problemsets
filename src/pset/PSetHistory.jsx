import React, {useEffect, useState} from 'react';
import {useCollection, useDocumentData, useDocumentDataOnce} from "react-firebase-hooks/firestore";
import {useParams} from "react-router-dom";
import {Loading} from '../components/general/loading/Loading';
import SplitPane from 'react-split-pane';
import {FinalAnswerWithData} from './components/FinalAnswer.jsx'
import {checkIsPastDeadline, getQuestionInfo} from '../utils/PSetUtil.js'
import Swal from 'sweetalert2'
import {firestore} from "../firebaseApp.js";
import {GradingAnswerExplanation} from '../grading/components/GradingAnswerExplanation';


export const PSetHistory = (props) => {
    let { qtrId, psetId, qId, forcedStudentId } = useParams();

    let user = props.user;
    if(forcedStudentId){
        user = {
        uid:forcedStudentId,
        displayName:'forced student'
        }
    }

    let path = `users/${user.uid}/${qtrId}/${psetId}/logs-${qId}`
    var [historyCollection, historyLoading, historyLoadingErr] = useCollection(
        firestore.collection(path)
    );

    // get correct / psetParams for pset
    var [studentPsetData, studentDataLoading, studentDataLoadingErr] = useDocumentDataOnce(
        firestore.doc(`users/${user.uid}/${qtrId}/${psetId}`)
    );

    // get user data (ie are they a TA? Do they use a screenreader?)
    var [userMetaData, userMetaDataLoading, userMetaDataErr] =
    useDocumentData(firestore.doc(`users/${user.uid}`))


    // get public pset data
    var [publicPsetData, publicPsetLoading, publicPsetLoadingErr] = useDocumentDataOnce(
        firestore.doc(`psets/${qtrId}/${psetId}/public`)
    );

    if(historyLoadingErr) {
        return <>historyLoadingErr</>
    }
    if(publicPsetLoadingErr) {
        return <>publicPsetLoadingErr</>
    }
    if(studentDataLoadingErr) {
        return <>studentDataLoadingErr</>
    }
    if(userMetaDataErr) {
        return <>userMetaDataErr</>
    }

    if(historyLoading || publicPsetLoading || studentDataLoading || userMetaDataLoading) {
        return <Loading/>
    }

    if(!historyCollection) {
        return <>No history</>
    }

    let allHistory = {}
    for (const doc of historyCollection.docs) {
        allHistory[doc.id] = doc.data()
    }

    if(Object.keys(allHistory).length == 0) {
        return <>No history for this problem</>
    }

    return <PSetHistoryWithData
        user = {user}
        allHistory={allHistory}
        publicPsetData = {publicPsetData}
        studentPsetData = {studentPsetData}
        userMetaData={userMetaData}
    />
}


const PSetHistoryWithData = ({user, userMetaData, allHistory, studentPsetData, publicPsetData}) => {
    let { qtrId, psetId, qId } = useParams();
    let allKeys = Object.keys(allHistory)

    let mostRecentKey = allKeys[allKeys.length - 1];
    let questionInfo = getQuestionInfo(qId, publicPsetData['questionInfo'])


    let [currSelection, setCurrSelection] = useState(mostRecentKey)
    let [currAnswer, setCurrAnswer] = useState(allHistory[mostRecentKey].answer)
    let [currExplanation, setCurrExplanation] = useState(allHistory[mostRecentKey].explanation)
    // recall that content is the field for the RTE (code uses explanation)
    let [currContent, setCurrContent] = useState(allHistory[mostRecentKey].content)
    const [editable, setEditable] = useState(!checkIsPastDeadline(publicPsetData, studentPsetData))

    useEffect(() => {
        // create a timer which runs every 10k ms
        setInterval(() => {
          setEditable(!checkIsPastDeadline(publicPsetData, studentPsetData))
        }, 10000);
      }, [qId]); // the empty dependency array forces only once

    useEffect(() => {
        let newAnswer = allHistory[currSelection].answer
        let newExplanation = allHistory[currSelection].explanation
        setCurrExplanation(newExplanation)
        setCurrAnswer(newAnswer)
        setCurrContent(allHistory[currSelection].content)
    }, [currSelection]);




    const revertToCurrSelection = () => {
        // you need to make sure that the solutions aren't released
        // and the grades aren't released
        // otherwise students could game the system (write all answers
        // and revert after the deadline)
        let canEdit = editable && !publicPsetData.gradesReleased
        if(userMetaData.role === "admin"){
            canEdit = true
        }
        if(!canEdit) {
            Swal.fire({
                toast:true,
                icon: 'error',
                title: 'Can not revert after the deadline. Ask the course staff.',
                showConfirmButton:false
            });
            return
        }

        Swal.fire({
            toast:true,
            icon: 'info',
            title: 'Reverting...',
            showConfirmButton:false
        });
        firestore
        .doc(`users/${user.uid}/${qtrId}/${psetId}/answers/${qId}/`)
        .set(
          buildRevertDoc(allHistory[currSelection], currAnswer),
          { merge: false } // overwrites!
        )
        .then(() => {
            Swal.fire({
                icon: 'success',
                title: 'You will need to refresh all tabs',
                text:'Your answer has been reverted in the database',
                showConfirmButton: true,

                showClass:{
                    popup:'none'
                },
            });
        })
        .catch(() => {
          // note that this is not fired when the internet is turned off!!
          // https://stackoverflow.com/questions/60850409/firebase-set-object-in-firestore-never-catches-errors
          alert('error')
        })
    }

    return <>
        <div className='container-fluid'>
            <div className='row'>
                <div className='col d-flex flex-column' style={{height:'100vh'}}>
                    <h1>History for {qId}</h1>
                    <SplitPane
                        style={{height:'100%',width:'90vw',flexGrow:2}}
                        defaultSize={500}
                    >
                        <HistoryMenu
                            allHistory = {allHistory}
                            currSelection = {currSelection}
                            setCurrSelection = {setCurrSelection}
                        />
                        <div style={{maxWidth:600, height:'100%'}} className='d-flex flex-column'>
                            <><button onClick={() => revertToCurrSelection()}class="btn btn-primary">Revert to this explanation ({currSelection})</button></><br/>

                            <FinalAnswerWithData
                                loadedFinalAnswer = {currAnswer}
                                questionType = {questionInfo['type']}
                                editable = {false}
                                user={user}
                                submitAnswer={(e)=>{}}
                                currIsCorrect={false}
                                isCheckingAnswer={false}
                            />
                            <HistoryAnswerExplanation
                                questionInfo={questionInfo}
                                questionType={questionInfo['type']}
                                currExplanation={currExplanation}
                                editable = {false}
                                showHistory = {false}
                                user = {user}
                                qtrId={qtrId}
                                psetId={psetId}
                                qId={qId}
                                currSelection={currSelection}
                            />
                        </div>
                    </SplitPane>
                </div>
            </div>
        </div>
    </>
  }

  const HistoryAnswerExplanation = (props)=> {
    if(!props.currSelection) return <>Select a history time</>

    let logAnswerPath = `/users/${props.user.uid}/${props.qtrId}/${props.psetId}/logs-${props.qId}/${props.currSelection}`

      return <>
        <GradingAnswerExplanation {...props}
                    editable ={false}
                    explanationPath={logAnswerPath}
                    collaborative={false}
                />
      </>
  }

  const HistoryMenu = ({
      allHistory,
      currSelection,
      setCurrSelection
  }) => {
    // ordered from most recent, to least recent
    let keys = Object.keys(allHistory).reverse()
    return <>
      {
        keys.map((dateKey, index) => {
          let date = new Date(dateKey)
          let options = {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour:'numeric',
              minute:'numeric',
              second:'numeric',
              timeZoneName:'short',
              fractionalSecondDigits:1
          };
          let dateStr = date.toLocaleString('en-US', options)
          return <p key={index}><button onClick={() => setCurrSelection(dateKey)} className='btn btn-link'>{dateStr}</button></p>
        })
      }
    </>
  }


  const buildRevertDoc = (originLog) => {

    return {...originLog,
        author:'revertHistory'
    }
  }