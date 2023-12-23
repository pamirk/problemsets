import {useEffect, useState} from 'react';
import {useDocumentDataOnce,} from "react-firebase-hooks/firestore";
import firebase from "firebase";
import Form from 'react-bootstrap/Form'
import InputGroup from 'react-bootstrap/InputGroup'
import Button from 'react-bootstrap/Button'

export const FinalAnswer = (props) => {
  let answerPath = `users/${props.user.uid}/${props.qtrId}/${props.psetId}/answers/${props.qId}`

  // load from the database
  var [studentData, studentDataLoading, studentDataError] = useDocumentDataOnce(
    firebase.firestore().doc(answerPath)
  );

  if(studentDataLoading) {
    return <FinalAnswerView
    currAnswer={undefined}
    setCurrAnswer={()=>{}}
    currIsCorrect={props.currIsCorrect}
    isCheckingAnswer = {false}
    submitAnswer={()=>{}}
    editable={false}
    questionType={props.questionType}
    forcedPlaceholder={'  '}
  />
  }
  if(studentDataError) {
    return <>Error</>
  }

  // we want the answer field
  let loadedFinalAnswer = (studentData && studentData['answer']) ? studentData['answer'] : ''
  return <FinalAnswerWithData
    {...props}
    studentDataLoading = {studentDataLoading}
    loadedFinalAnswer={loadedFinalAnswer}
  />

}

export const FinalAnswerWithData = ({loadedFinalAnswer,questionType,submitAnswer, currIsCorrect, isCheckingAnswer,editable}) =>{

  const [currAnswer, setCurrAnswer] = useState(loadedFinalAnswer)

  useEffect(()=> {
    setCurrAnswer(loadedFinalAnswer)
  }, [loadedFinalAnswer])

  return <FinalAnswerView
    currAnswer={currAnswer}
    setCurrAnswer={setCurrAnswer}
    currIsCorrect={currIsCorrect}
    isCheckingAnswer = {isCheckingAnswer}
    submitAnswer={submitAnswer}
    editable={editable}
    questionType={questionType}
  />

}

const FinalAnswerView = ({currAnswer,setCurrAnswer,currIsCorrect,isCheckingAnswer,submitAnswer,editable,questionType,forcedPlaceholder}) => {
  var classNames = 'numericAnswer'
  if(currIsCorrect) {
    classNames += " is-valid"
  }
  const onCheckAnswer = () => {
    let rawAnswer = currAnswer
    console.log('raw answer', rawAnswer)
    submitAnswer(rawAnswer)
  }
  let answerTypeValues = getAnswerTypeValues(questionType)
  if(answerTypeValues == null){
    return <></>
  }
  let value = currAnswer ? currAnswer : ''
  let btnText = isCheckingAnswer ? 'Checking...' : 'Check Answer'

  let placeholder = editable ? "Enter your answer" : "No answer"
  if(forcedPlaceholder){
    placeholder=forcedPlaceholder
  }
  return  <InputGroup className="">
    <Form.Label column xl="1" style={{minWidth:'150px'}}><b>{answerTypeValues.labelText}:</b>&nbsp;</Form.Label>
            <Form.Control

              onChange = {(e) =>setCurrAnswer(e.target.value)}
              id="answerField"
              type={answerTypeValues.formType}
              placeholder={placeholder}
              value = {value}
              className={classNames}
              style={{border:'none'}}
              readOnly = {!editable}
            />
            {editable &&
                <Button style={{width:'150px'}} disabled={isCheckingAnswer}onClick={() => onCheckAnswer()} variant="light" >
                {btnText}
              </Button>
            }
          </InputGroup>
}

function getAnswerTypeValues(questionType) {
  if(questionType.includes('numeric')) {
    return {
      labelText:'Numeric Answer',
      formType:'number'
    }
  }
  if(questionType.includes('string')) {
    return {
      labelText:'String Answer',
      formType:''
    }
  }
  return null
}
