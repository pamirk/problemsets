import React, {useEffect, useState} from 'react';
import {useDocumentDataOnce,} from "react-firebase-hooks/firestore";
import firebase from "firebase";
import {Form, ListGroup, ListGroupItem} from 'react-bootstrap';
import {isEditorActive} from '../../utils/PSetUtil.js'
import {FaCircle} from 'react-icons/fa';
import deepEqual from 'fast-deep-equal'
// import {DraftEditor} from '../../components/editors/DraftEditor.js'
import {rubric} from './rubric'
import {computeGrade} from '../GradingUtil.jsx';
import {RichTextEditor} from '../../components/richText/RichTextEditor.jsx';


const GRADING_COMPLETE = 'Grading Complete'

export const GradingPane = (props) => {

    // get the students data, only once
    const query = firebase
      .firestore()
      .collection("users")
      .doc(`${props.studentId}/${props.qtrId}/${props.psetId}/feedback/${props.qId}`)
    var [gradeData, gradeDataLoading, gradeDataError] = useDocumentDataOnce(query);

    if(gradeDataError) {
      return <>Error loading grading data</>
    }

    // give it a default value
    if(gradeDataLoading) {
      return <></>
    }

    return <GradingPaneWithData
      {...props}
      initialComment = {gradeData && gradeData.comment ? gradeData.comment : ''}
      initialRubricValues = {gradeData && gradeData.rubric ? gradeData.rubric : {}}
      initialValidation = {gradeData && gradeData.isValidated}
      editing = {props.editing}

    />
}

/**
 * I have a bug. When you switch between students it saves the old student comment into the
 * new student comment. I am not sure why! It looks like the debounce gets executed before
 * the components are re-rendered
 */
const GradingPaneWithData = (props) => {
  let feedbackPath = `users/${props.studentId}/${props.qtrId}/${props.psetId}/feedback/${props.qId}/`
  const [currCommentDirtyBit, setCurrCommentDirtyBit] = useState('temporarily disabled')
  const [rubricValues, setRubricValues] = useState(props.initialRubricValues)
  const [grade, setGrade] = useState(computeGrade(rubric, props.initialRubricValues))
  const [gradingStatus, setGradingStatus] = useState(checkGradingStudentComplete(rubricValues, currCommentDirtyBit))
  const [isValidated, setIsValidated] = useState(props.initialValidation)
  let isGradingComplete = gradingStatus === GRADING_COMPLETE



  const onSetCurrRubric = (newRubric) => {
    if(!deepEqual(newRubric, rubricValues)) {
      setRubricValues(newRubric)
      let grade = computeGrade(rubric, newRubric)
      // change our state variable
      setGrade(grade)
      // save the score in the gradebook
      updateGradeBook(props.qtrId, props.psetId, props.qId,
        props.studentId, props.user, grade)

      // save the rubric data on the users path
      firebase.firestore().doc(feedbackPath)
        .set({
          rubric: newRubric,
          lastEdit: new Date()
        },{ merge: true })
        .catch((e) => {console.error(e)})

    }
  }

  // Whenever our rubric or comment changes, we need to recalculate if grading is complete
  useEffect(() => {
    setGradingStatus(checkGradingStudentComplete(rubricValues, currCommentDirtyBit))
  }, [rubricValues, currCommentDirtyBit])

  // handle keyboard events
  useEffect(() => {
    const keyDownHandler = (event) => {
        if(!isEditorActive()) {
            let keyCode = event.code
            if(keyCode === 'KeyF') {
                updateGradeBook(props.qtrId, props.psetId, props.qId,
                  props.studentId, props.user, grade)
                setIsValidated(true)
                firebase.firestore().doc(feedbackPath)
                  .set({ isValidated: true, lastEdit: new Date() },{ merge: true })
            }
        }
    }
    document.addEventListener("keydown", keyDownHandler, false);
    return () => {
        document.removeEventListener("keydown", keyDownHandler, false)
    }
   }, [])

  return <div key={props.studentId}className='d-flex flex-column' style={{height:'100%'}} >
      <span>
        Grade: {grade.points} / {grade.maxPoints}
        <span
          style={{fontWeight:"bold","marginLeft":'5px', "marginBottom":'5px'}}
          className={isGradingComplete ? 'badge bg-primary' : 'badge bg-warning'}
        >{gradingStatus}</span>
        <span
          style={{marginLeft:'5px'}}
          className={isValidated ? '' : 'd-none'}
        ><FaCircle/></span>
      </span>
      <RubricButtons
          rubric = {rubric}
          rubricValues = {rubricValues}
          setRubricValues = {(r) => onSetCurrRubric(r)}
      />
        <b>Comments:</b>
      <div className="d-flex" style={{minHeight:200, flexGrow:2}}>
          <RichTextEditor
              user={props.user}
              firebaseDocPath={feedbackPath}
              editable={props.editing}
              collaborative={false}
              contentKey="comment"
          />
      </div>

  </div>
}

const RubricButtons = (props) => {
    let keyCodeMap = {}


    // onKeyDown handler function
    const keyDownHandler = (event) => {
        // be careful that the text box isn't active
        if(!isEditorActive()) {
            let keyCode = event.code
            console.log('keyCode', keyCode)
            if(keyCode in keyCodeMap) {
                let rubricId = keyCodeMap[keyCode].itemId
                let newValue = keyCodeMap[keyCode].optionValue
                let newRubricValues = {...props.rubricValues}
                // toggle
                if(newRubricValues[rubricId] == newValue) {
                    newRubricValues[rubricId] = 'none'
                } else {
                    newRubricValues[rubricId] = newValue
                }

                props.setRubricValues(newRubricValues)
            }


        }
    };

    // handle keyboard events
    useEffect(() => {
        keyCodeMap = makeKeyCodeMap(rubric)
        // only run this code once
        document.addEventListener("keydown", keyDownHandler, false);
        // return the destructor
        return () => {
            document.removeEventListener("keydown", keyDownHandler, false)
        }
    }, [props.rubricValues])

    const makeOption = (rubricItem, index) => {
        let value = props.rubricValues[rubricItem.id]
        return <RadioOption
            key = {index}
            item = {rubricItem}
            value = {value}
            onClick = {(rubricId, newValue) => {
              let newRubricValues = {...props.rubricValues}
              newRubricValues[rubricId] = newValue
              props.setRubricValues(newRubricValues)
            }}
        />
    }

    return <ListGroup>
    {
      props.rubric.map((item, index) => {
        return makeOption(item, index);
      })
    }
    </ListGroup>
}


const RadioOption = (props) => {
    let options = props.item.options;
    return (
        <ListGroupItem>
          <b>{props.item.label}</b> ({props.item.maxPoints} points)<br/>

          <div key={props.item.id} className="mb-3">
            {

              options.map((optionItem, index) => {
                return (
                  <Form.Check
                    disabled = {!props.editable}
                    key={index}
                    id={optionItem.value}
                    name={props.item.id}
                    type={'radio'}
                    label={` ${optionItem.label} (${optionItem.points} points)`}
                    checked = {props.value == optionItem.value}
                    onChange = {() => props.onClick(props.item.id, optionItem.value)}
                  >

                  </Form.Check >
                );
              })
            }
          </div>
        </ListGroupItem>
    );
  }

RadioOption.defaultProps = {
  editable : true,
}

function makeKeyCodeMap(rubric) {
  let keyCodeMap = {}
  for (const rubricItem of rubric) {
      for (const optionItem of rubricItem.options) {
          if('keyCode' in optionItem) {
            keyCodeMap[optionItem.keyCode] = {
                itemId:rubricItem.id,
                optionValue:optionItem.value
            }
          }
      }
  }
  return keyCodeMap
}

function checkGradingStudentComplete(rubricValues, comment){
  if(!('correctness' in rubricValues)
    || !rubricValues['correctness']
    || rubricValues['correctness'] =='none'
  ){
    return 'Missing Correctness'
  }
  console.log(comment)
  if(comment === ''){
    return 'Missing Comment'
  }

  console.log('grading complete')
  return GRADING_COMPLETE

}



function updateGradeBook(qtrId, psetId, qId, studentId, user, grade){
  let newGradeEntry = {}
  newGradeEntry[studentId] = {
    ...grade,
    graderName:user.displayName,
    grader:user.uid,
    lastChanged:Date.now()
  }
  firebase.firestore().collection("psets")
    .doc(`${qtrId}/${psetId}/private/gradebook/${qId}`)
    .set(newGradeEntry,{ merge: true})
    .catch((e) => {console.error(e)})
}