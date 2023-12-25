import React from 'react';
import {useCollectionOnce} from "react-firebase-hooks/firestore";

import {Link} from "react-router-dom";
import {firestore} from "../firebaseApp.js";

export const GradingSplash = (props)=> {
    console.log('reload grading splash')

    var [gradebookCollection, gradebooksLoading, gradebooksLoadingErr] = useCollectionOnce(
        firestore.collection(`psets/${props.qtrId}/${props.psetId}/private/gradebook`)
    );

    if(gradebooksLoading) {
        return <></>
    }
    let allGradebooks = {}
    if(gradebookCollection) {
        for (const doc of gradebookCollection.docs) {
            allGradebooks[doc.id] = removeEmptyGrades(doc.data())
        }
    }


    return <GradingSplashWithData
        {...props}
        allGradebooks = {allGradebooks}
    />
}

const GradingSplashWithData = (props) => {

    if(!props.classData) {
        return <>This term is not yet set up for grading. You need to add students so we know who to grade! In admin project see <code>src/addClassList.py</code></>
    }
    if(!props.classData.students) {
        return <>This term is not yet set up for grading. You need to add students so we know who to grade! In admin project see <code>src/addClassList.py</code></>
    }
    let questionTable = makeQuestionTable(props)

    let studentTable = makeStudentTable(props, props.classData, props.allGradebooks)

    return <>
        <h1>Grading {props.publicPsetData.title}. {props.user.displayName}</h1>
        <h2>Question Table</h2>
        {questionTable}
        <hr/>
        <h2>Student Table</h2>
        {studentTable}
    </>
}

const makeQuestionTable = (props) => {
    return <table className='table table-striped'>
        <thead><tr>
            <th>#</th>
            <th>Question</th>
            <th>N Students</th>
            <th>N Ungraded</th>
            <th>N Unverified</th>
        </tr></thead>
        <tbody>
        {props.publicPsetData.questionInfo.map((item,index)=>{
            return makeQuestionRow(props, item,index)
        })}
       </tbody>
    </table>
}

const makeQuestionRow = (props, item, index) => {
    let link = `/grading/${props.qtrId}/${props.psetId}/${item.qId}`
    console.log(item.qId)
    console.log(props.allGradebooks)
    let classList = props.classData['students']
    let gradebook = props.allGradebooks[item.qId]

    let nUnverified = '?'
    let nUngraded = '?'
    let nStudents = '?'
    if(gradebook) {
        let intersection = classList.filter(x =>  x.uid in gradebook);
        nUnverified = calcNumUnverified(classList, gradebook)
        nUngraded = classList.length - intersection.length
        nStudents = classList.length
    }

    return <tr key={index}>
        <td>{index+1}</td>
        <td><Link to={link}>{item.title}</Link></td>
        <td>{nStudents}</td>
        <td>{nUngraded}</td>
        <td>{nUnverified}</td>
    </tr>
}

function calcNumUnverified(classList, gradebook) {
    let nUnverified = 0
    for (const student of classList) {
        let studentId = student.uid
        if(!isVerified(gradebook, studentId)) {
            nUnverified += 1
        }
    }
    return nUnverified
}

function isVerified(gradebook, studentId){
    if(!studentId in gradebook) {
        return false
    }
    if(!gradebook[studentId]) {
        return false
    }
    if(gradebook[studentId].grader == 'auto') {
        return false
    }
    return true
}

function removeEmptyGrades(questionGradebook) {
    let cleaned = {}
    for (const [key, value] of Object.entries(questionGradebook)) {
        if(value) {
            cleaned[key] = value
        }
    }
    return cleaned
}

const makeStudentTable = (props,classData, allGradebooks) => {

    return <table className='table table-striped'>
        <thead><tr>
            <th>Email</th>
            <th>Pset</th>
            {props.publicPsetData.questionInfo.map((item,index)=>{
                return <th>{index+1}</th>
            })}

        </tr></thead>
        <tbody>
        {classData.students.map((item,index)=>{
            return makeStudentSummaryRow(props, item,index, allGradebooks)
        })}
       </tbody>
    </table>
}

const makeStudentSummaryRow = (props,student, index, allGradebooks) => {
    // let sunetId = student.email.split('@')[0]

    let sunetId = student.email.split('@')[0]


    let psetTotal =0
    let nQuestions = 0
    for (const question of props.publicPsetData.questionInfo) {
        if(!allGradebooks[question.qId]){
            continue
        }
        let studentGradeItem = allGradebooks[question.qId][student.uid]
        if(studentGradeItem){
            let grade = studentGradeItem.points / studentGradeItem.maxPoints
            psetTotal += grade
        }
        nQuestions += 1
    }
    let psetGrade = psetTotal / nQuestions

    return <tr key={index}>
        <td>{sunetId}</td>
        <td>{psetGrade.toFixed(2)}</td>
        {props.publicPsetData.questionInfo.map((item,index)=>{
            let qId = item.qId
            let studentUrl = `/grading/${props.qtrId}/${props.psetId}/${qId}/${student.uid}`
            if(!allGradebooks[qId]) {
                return <td><Link to = {studentUrl}>?</Link></td>
            }
            let studentGradeItem = allGradebooks[qId][student.uid]
            if(!studentGradeItem) {
                return <td><Link to = {studentUrl}>?</Link></td>
            }
            let grade = studentGradeItem.points / studentGradeItem.maxPoints

            console.log(grade)
            // return <td>{}</td>
            //
            return <td><Link to = {studentUrl}>{grade.toFixed(2)}</Link></td>
        })}
    </tr>
}