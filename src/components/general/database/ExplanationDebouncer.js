import {useEffect, useRef, useState} from 'react';
import {useDebounce} from 'use-debounce';
import {useDocumentData,} from "react-firebase-hooks/firestore";
import deepEqual from 'fast-deep-equal'
import {firestore} from "../../../firebaseApp.js";

export const useExplanationDebounced = (documentPath, editable, starterCode, sessionId) => {
    // the State
    const [currExplanation, setCurrExplanation] = useState('')

    // load from the database
    var [studentData, studentDataLoading, studentDataError] = useDocumentData(
        firestore.doc(documentPath)
    );

    useEffect(() => {
        console.log(studentData)
        // called when the studentData is loaded
        if (studentData) {
            if (studentData['explanation']) {
                setCurrExplanation(studentData['explanation'])
            } else if (starterCode) {
                console.log('set starter code')
                setCurrExplanation(starterCode)
            }
        }
    }, [studentData])

    // do we need to inject starter code?
    // either the studentData is missing or the explanation is missing
    // make sure not to fire if there was a data loading error
    // (that means the missing data is because of wifi issues etc)
    if ((!studentData || !studentData['explanation']) && !studentDataError) {
        // starter code
        studentData = {
            explanation: starterCode ? starterCode : ''
        }
    }


    // we dont want to write when the data first loads
    // useRef object will persist for the full lifetime of the component.
    const isFirstDebounce = useRef();
    useEffect(() => {
        // starts false! This is only turned on when a change comes form someone else...
        isFirstDebounce.current = false
    }, [])

    // debouncedExplanation is a lagged version of currExplanation (by 250ms). When it changes, we'll update the database with the explanation
    const [debouncedExplanation] = useDebounce(currExplanation, 250);


    // Whenever our debouncedInputData changes, we need to update the database
    useEffect(() => {
        if (debouncedExplanation) {

            // only save if this isn't the data we just loaded from the db
            // option for optimization: you could short circuit the deepequal.

            // dont save if there hasn't been a change
            let oldExplanation = studentData['explanation']
            let isOriginal = deepEqual(oldExplanation, currExplanation)
            let shouldSave = !isOriginal && editable
            if (!isOriginal && editable) {
                isFirstDebounce.current = false
            }
            if (shouldSave) {
                console.log('saving...')
                isFirstDebounce.current = false
                firestore.doc(documentPath).set(
                    {
                        explanation: currExplanation,
                        lastAuthorSessionId: sessionId,
                        lastEdit: new Date()
                    },
                    {merge: true}
                )
                    .catch(() => {
                        // note that this is not fired when the internet is turned off!!
                        // https://stackoverflow.com/questions/60850409/firebase-set-object-in-firestore-never-catches-errors
                        alert('error')
                    })
            }
        }
    }, [debouncedExplanation]);


    return [currExplanation, studentDataLoading, studentDataError, setCurrExplanation]
}