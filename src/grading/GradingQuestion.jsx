import React from 'react';
import {useDocumentData} from "react-firebase-hooks/firestore";
import {Link} from "react-router-dom";
import {Loading} from '../components/general/loading/Loading';
import {firestore} from "../firebaseApp.js";

export const GradingQuestion = (props)=> {

    console.log('qtr', props.qtrId)

    var [gradebook, gradebookLoading, gradebookLoadingErr] = useDocumentData(
        firestore.doc(`/psets/${props.qtrId}/${props.psetId}/private/gradebook/${props.qId}`)
    );
    console.log(gradebook)
    if( gradebookLoading){
        return <Loading/>
    }

    let studentTable = makeStudentTable(props, props.classData, gradebook)
    return <>
        <h1>{props.qId}</h1>
        {studentTable}
    </>
}

const makeStudentTable = (props,classData, gradebook) => {

    return <table className='table table-striped'>
        <thead><tr>
            <th>#</th>
            <th>Email</th>
            <th>Name</th>
            <th>Grade</th>
            <th>Grader</th>
        </tr></thead>
        <tbody>
        {classData.students.map((item,index)=>{
            return makeStudentRow(props, item,index, gradebook)
        })}
       </tbody>
    </table>
}

const makeStudentRow = (props,student, index, gradebook) => {
    // let sunetId = student.email.split('@')[0]
    let studentUrl = `/grading/${props.qtrId}/${props.psetId}/${props.qId}/${student.uid}`
    let gradeStr = ''
    let graderStr = ''
    if(gradebook && gradebook[student.uid]) {
        let gradeData = gradebook[student.uid]
        if(gradeData.maxPoints > 0){
            gradeStr = `${gradeData.points} / ${gradeData.maxPoints}`
            graderStr = gradeData.graderName
        }
    }

    return <tr key={index}>
        <td>{index + 1}</td>
        <td>
            <Link to = {studentUrl}>{student.email}</Link>
        </td>
        <td>{student.name}</td>
        <td>{gradeStr}</td>
        <td>{graderStr}</td>
    </tr>
}

