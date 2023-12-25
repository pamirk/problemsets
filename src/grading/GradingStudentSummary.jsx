import React from 'react';
import {useCollectionOnce,} from "react-firebase-hooks/firestore";
import {Link,} from "react-router-dom";
import {firestore} from "../firebaseApp.js";

export const GradingStudentSummary = (props)=> {


    var [gradebookCollection, gradebooksLoading, gradebooksLoadingErr] = useCollectionOnce(
        firestore.collection(`/psets/${props.qtrId}/${props.psetId}/private/gradebook/`)
    );
    if(gradebooksLoading) {
        return <></>
    }
    let allGradebooks = {}
    for (const doc of gradebookCollection.docs) {
        allGradebooks[doc.id] = doc.data()
    }

    let studentTable = makeStudentTable(props, props.classData, allGradebooks)
    return <>
        <h1>Student Summary {props.publicPsetData.sidebarLong}</h1>
        {studentTable}
    </>
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
            return makeStudentRow(props, item,index, allGradebooks)
        })}
       </tbody>
    </table>
}

const makeStudentRow = (props,student, index, allGradebooks) => {
    // let sunetId = student.email.split('@')[0]

    let sunetId = student.email.split('@')[0]

    let psetTotal =0
    let nQuestions = 0
    for (const question of props.publicPsetData.questionInfo) {
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

