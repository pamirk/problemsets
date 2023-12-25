import React, {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {Dropdown, DropdownButton} from 'react-bootstrap';
import API_ROUTE from '../ApiRoute.js';
import axios from 'axios'
import Swal from 'sweetalert2'
import {getGracePeriodDeadline} from "../utils/PSetUtil.js"
import {calcGradeFraction, checkify, GRADING_DEFAULT_POINTS} from '../grading/GradingUtil.jsx';


// global date options
const dateOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'long'
}

export const PSetSplash = ({publicPsetData, allFeedback, studentPsetData, user}) => {
    let {qtrId, psetId} = useParams();


    if (!publicPsetData) return <></>
    let dueDate = new Date(publicPsetData.due)
    let solutionDate = new Date(publicPsetData.tooLate)
    let graceDate = getGracePeriodDeadline(publicPsetData)
    let firstId = publicPsetData.questionInfo[0].qId


    const timeTillDueString = getTimeTillString(dueDate)
    const timeTillGraceString = getTimeTillString(graceDate)
    const timeTillSolutionsString = getTimeTillString(solutionDate)

    return <div className="container-fluid" style={{background: '#f7f7f7', minHeight: '100vh', height: '100%'}}>
        <div className='row'>
            <div className='col'>


                <div
                    style={{maxWidth: 800, textAlign: 'center', padding: '20px', background: 'white', height: '100vh'}}>
                    <h2>{publicPsetData['title']}</h2>
                    <h3>For {user.displayName}</h3>
                    <hr/>

                    <div className="mb-3">
                        <Link className="btn btn-primary" to={`/${qtrId}/${psetId}/${firstId}`}>Get Started</Link>
                        {/* &nbsp;
        <Link className="btn btn-primary" to={`/${qtrId}/${psetId}/submit`}>Submit Page</Link> */}
                    </div>

                    {
                        (publicPsetData.gradesReleased || false) &&
                        <GradingSummary
                            publicPsetData={publicPsetData}
                            studentPsetData={studentPsetData}
                            allFeedback={allFeedback}
                            user={user}
                            qtrId={qtrId}
                            psetId={psetId}
                        />
                    }

                    <div className="alert alert-primary" style={{textAlign: 'left'}}>

                        <p><b>Due Date:</b> {dueDate.toLocaleString("en-US", dateOptions)} ({timeTillDueString}).</p>
                        <p><b>Grace Period
                            Date:</b> {graceDate.toLocaleString("en-US", dateOptions)} ({timeTillGraceString}).</p>
                        <span><b>Solutions Posted:</b> {solutionDate.toLocaleString("en-US", dateOptions)} ({timeTillSolutionsString}).</span>


                    </div>


                    <ExtensionStatus
                        publicPsetData={publicPsetData}
                        studentPsetData={studentPsetData}
                    />

                    <ExtensionRequest
                        publicPsetData={publicPsetData}
                        user={user}
                    />

                </div>
            </div>
        </div>
    </div>

}

const GradingSummary = (props) => {
    // need grade data here.
    // get everything for this collection
    // make sure that grades have been released

    let gradeReport = []
    let gradeSum = 0
    let nItems = 0
    let gradeSumMax = 0
    let feedbackFormat = ('gradeReportType' in props.publicPsetData ? props.publicPsetData.gradeReportType : 'check')
    for (const question of props.publicPsetData.questionInfo) {
        let feedback = props.allFeedback[question.qId]
        let rawGrade = calcGradeFraction(feedback)
        // return rawGrade.points , rawGrade.maxPoints
        let gradeStr = ''
        if (rawGrade != null) {
            gradeStr = checkify(rawGrade.points, rawGrade.maxPoints, feedbackFormat)
            gradeSum += rawGrade.points ? rawGrade.points : 0

        }
        gradeReport.push({
            'title': question.title,
            'grade': gradeStr
        })

        if (!question.isExtraCredit) {
            gradeSumMax += (rawGrade && rawGrade.maxPoints) ? rawGrade.maxPoints : GRADING_DEFAULT_POINTS
        } else {
            console.log("extra credit doesn't count against your gradeSumMax")
        }

        nItems++
    }
    let overallGradeFormat = feedbackFormat != 'check' ? 'percentage' : 'check'
    let overallGrade = checkify(gradeSum, gradeSumMax, feedbackFormat)
    console.log(gradeSum, gradeSumMax)
    gradeReport.push({
        'title': <b>Overall</b>,
        'grade': overallGrade
    })

    return <div className='bordered'>
        <h3>Grade Summary</h3>
        <table className='table table-hover' style={{textAlign: 'left'}}>
            <thead>
            <tr>
                <th>Question</th>
                <th>TA Grade</th>
            </tr>
            </thead>
            <tbody>
            {gradeReport.map((item, index) => {
                return <tr key={index}>
                    <td>{item.title}</td>
                    <td>{item.grade}</td>
                </tr>
            })}
            </tbody>
        </table>
    </div>
}

const ExtensionStatus = ({studentPsetData, publicPsetData}) => {
    const originalDueDate = new Date(publicPsetData.due)

    // if there is no extension in the database
    if (!studentPsetData.extension) {
        return <></>
    }

    // if there is an extension recorded
    const plan = studentPsetData.extension.plan;

    const explanaition = studentPsetData.extension.explanaition;
    const requestTimeStamp = new Date(studentPsetData.extension.requestTimestamp);
    const personalDueDate = new Date(studentPsetData.extension.dueDate);
    const dueDateStr = personalDueDate.toLocaleString("en-US", dateOptions)
    const requestTime = requestTimeStamp.toLocaleString("en-US", dateOptions)
    const timeLeftStr = getTimeTillString(personalDueDate)


    const extensionLengthHours = Math.round((personalDueDate.getTime() - originalDueDate.getTime()) / (1000 * 3600));

    return <div className="alert alert-success" style={{textAlign: 'left'}}>
        <p><b>Extension Granted </b><br/>You were granted a rather long extension ({extensionLengthHours} hours). As you
            know, CS109 is a fast paced course and it will be extra work in the next few weeks to catch-up. Your new due
            date is {dueDateStr} ({timeLeftStr}). This is a hard deadline.</p>
        <p><b>Request Date: </b> {requestTime}<br/>
            <b>Reason for request: </b> {explanaition}<br/>
            <b>Catch-up Plan:</b> {plan}</p>
    </div>
}


const ExtensionRequest = ({publicPsetData, user}) => {
    let [extensionType, setExtensionType] = useState('')
    const extensionLengthHours = calcExtensionLength(publicPsetData)

    return <>

        <DropdownButton variant="secondary" id="dropdown-basic-button" title="Extension Request Forms">
            <Dropdown.Item onClick={() => setExtensionType('grace')}>Grace period extension</Dropdown.Item>
            <Dropdown.Item onClick={() => setExtensionType('late')}>{extensionLengthHours} hour
                extension</Dropdown.Item>
            <Dropdown.Item onClick={() => setExtensionType('tooLate')}>Over {extensionLengthHours} hour
                extension</Dropdown.Item>
        </DropdownButton>
        <div className="mt-3"></div>
        <ExtensionForm
            extensionType={extensionType}
            setExtensionType={setExtensionType}
            publicPsetData={publicPsetData}
            user={user}
        />
    </>
}

const ExtensionForm = ({extensionType, publicPsetData, setExtensionType, user}) => {
    if (extensionType === '') return <></>
    if (extensionType === 'grace') return <GraceForm setExtensionType={setExtensionType}
                                                     publicPsetData={publicPsetData}/>
    if (extensionType === 'late') return <LateForm user={user} setExtensionType={setExtensionType}
                                                   publicPsetData={publicPsetData}/>
    if (extensionType === 'tooLate') return <TooLateForm setExtensionType={setExtensionType}/>
}

const GraceForm = ({setExtensionType, publicPsetData}) => {
    let graceDate = getGracePeriodDeadline(publicPsetData)
    return <>
        <div style={{textAlign: 'left'}}>
            <div className="d-flex flex-row justify-content-between"><h5>Grace period extension:</h5>
                <button onClick={() => setExtensionType('')} className="btn-close"></button>
            </div>
            <div className="alert alert-success">
                <b>Automatic</b>: An extension will be auto-applied if you make changes to your assignment up until the
                grace period due date ({graceDate.toLocaleString("en-US", dateOptions)}), regardless of the reason. That
                time cuttoff is administered by a computer which is rather precise.
                You can use this sort of extension for things like; self-care, you just missed the deadline,
                time-management, etc. You do not need to explicitly request the extension.
            </div>
        </div>

    </>
}

const LateForm = ({publicPsetData, setExtensionType, user}) => {
    let {qtrId, psetId} = useParams()
    let [lateExplanaition, setLateExplanation] = useState('')
    let [catchUpPlan, setCatchUpPlan] = useState('')
    let readyToSubmit = lateExplanaition.length > 5 && catchUpPlan.length > 5

    const submitRequest = () => {
        Swal.fire({
            icon: 'question',
            title: 'Are you sure?',
            text: "You can't unrequest an extension",
            showConfirmButton: true,
            showCancelButton: true,
        }).then((result) => {
            if (!result.isConfirmed) return
            extensionRequestSwal()
            // actually make the authenticated request
            user.getIdToken(true)
                .then(function (token) {
                    let URL = `${API_ROUTE}requestExtension`
                    axios.post(URL, {
                        token: token,
                        qtrId: qtrId,
                        psetId: psetId,
                        explanaition: lateExplanaition,
                        plan: catchUpPlan
                    }).then(response => {
                        extensionGrantedSwal()
                        setExtensionType('')
                    }).catch(err => {
                        extensionRequestFailSwal()
                    });
                })
        })
    }

    const extensionLengthHours = calcExtensionLength(publicPsetData)
    return <>
        <div style={{textAlign: 'left'}}>
            <div className="d-flex flex-row justify-content-between">
                <h5>{extensionLengthHours} hour extension:</h5>
                <button onClick={() => setExtensionType('')} className="btn-close"></button>
            </div>

            <div className="alert alert-warning">
                <b>Warning</b>: CS109 is a fast-paced class and if you need an extension of this length then you may
                fall behind
                on future problem sets (or the midterm / final). Having said that, you might have a medical, personal or
                serious time-management situation which requires this sort of long extension.
            </div>
            <b>Explain your reason for needing a long extension:</b>
            <textarea
                value={lateExplanaition}
                onChange={(e) => setLateExplanation(e.target.value)}
                rows="5"
                style={{width: '100%', resize: 'none'}}
                placeholder="e.g. I started the pset before the due date, but I became terribly ill while trying to bungee jump off an airplane."
            />

            <b>What is your plan to get back up to speed in CS109?</b>
            <textarea
                value={catchUpPlan}
                onChange={(e) => setCatchUpPlan(e.target.value)}
                rows="5"
                style={{width: '100%', resize: 'none'}}
                placeholder="e.g. I will finish this pset by Friday. I will start the next pset the day after and will have it done on time. I will start studying for the midterm one hour each night today."
            />
        </div>
        {
            (!readyToSubmit) &&
            <div className="alert alert-danger">Must provide a longer explanaition and/or catch up plan. </div>
        }
        <button onClick={submitRequest} disabled={!readyToSubmit}
                className="btn btn-primary">Request {extensionLengthHours} hour extension
        </button>
        <hr/>
    </>
}

const TooLateForm = ({setExtensionType}) => {
    return <>
        <div style={{textAlign: 'left'}}>
            <div className="d-flex flex-row justify-content-between">
                <h5>After-solutions-posted extension:</h5>
                <button onClick={() => setExtensionType('')} className="btn-close"></button>
            </div>

            <div className="alert alert-secondary">
                <b>Heads up</b>: In general we do not accept work after the solution has been posted and TAs start
                grading. Most of the time management incentives are to help make sure you don't accidentally miss
                this <b>very hard</b> deadline! Having said that, there may be a real crisis that means you are not able
                to do your work before the solutions are released (eg an illness that lasts a week, funeral attendance,
                etc). First, we hope you are well. Personal life is so truly important and we respect you doing what you
                need to do. In such an extreme case you need to contact the course staff (cs109@cs.stanford.edu) and we
                will work something out. Please do contact us as early as possible.
            </div>
        </div>
    </>
}

function calcExtensionLength(publicPsetData) {
    const dueDate = new Date(publicPsetData.due)
    const solnReleaseDate = new Date(publicPsetData.tooLate)
    return Math.round((solnReleaseDate.getTime() - dueDate.getTime()) / (1000 * 3600));
}

function getTimeTillString(futureDate) {
    const rtf = new Intl.RelativeTimeFormat("en", {
        localeMatcher: "best fit", // other values: "lookup"
        numeric: "auto", // other values: "auto"
        style: "long", // other values: "short" or "narrow"
    });

    const deltaHours = (futureDate.getTime() - Date.now()) / (1000 * 3600);
    if (Math.abs(deltaHours) > 48) {
        return rtf.format(Math.round(deltaHours / 24), 'days')
    }
    return rtf.format(Math.floor(deltaHours), 'hour');
}

const extensionGrantedSwal = () => {
    Swal.fire({
        toast: true,
        icon: 'success',
        title: 'Extension Granted',
        position: 'top-end',
        showConfirmButton: true,
    });
}
const extensionRequestSwal = () => {
    Swal.fire({
        toast: true,
        icon: 'info',
        title: 'Requesting Extension',
        position: 'top-end',
        showConfirmButton: false,
        timer: 10000,
        timerProgressBar: true
    });
}

const extensionRequestFailSwal = () => {
    Swal.fire({
        toast: true,
        icon: 'error',
        title: 'Something went wrong',
        position: 'top-end',
        showConfirmButton: true,
    })
};
