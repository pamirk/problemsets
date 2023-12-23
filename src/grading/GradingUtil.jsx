import {rubric} from './components/rubric.js'
import {FaCheck, FaMinus, FaPlus} from 'react-icons/fa';

export const GRADING_DEFAULT_POINTS = 5

export const calcGrade = (feedback) => {
    if (!feedback || !feedback.rubric) {
        return null
    } else {
        let grade = applyDefaultRubric(feedback.rubric)
        return grade.points / grade.maxPoints
    }

}

export const calcGradeFraction = (feedback) => {
    if (!feedback || !feedback.rubric) {
        return null
    } else {
        let grade = applyDefaultRubric(feedback.rubric)
        return grade
    }

}

export const checkify = (nPoints, maxPoints, feedbackFormat) => {
    /**
     * Note: Chris Piech reports grades in checks. Jerry requests
     * that grades be reported in fractions. All grade reporting ends
     * in this function! So even though the name is "checkify" in reality
     * it is visualizing the grade in the instructors preferred format.
     */
    // under all systems, ungraded is blank
    if (maxPoints == 0) {
        return <></>
    }


    // first, lets have a case for the format being fraction
    if (feedbackFormat === 'fraction') {
        return <span>{nPoints} / {maxPoints}</span>
    }

    // and a case for percentage
    if (feedbackFormat === 'percentage') {
        return <span>{Math.round(100 * (nPoints / maxPoints))}%</span>
    }

    // this is the standard check system
    let rawGrade = nPoints / maxPoints
    if (rawGrade >= 0.92) {
        return <span><FaCheck/><FaPlus/></span>
    }
    if (rawGrade >= 0.8) {
        return <span><FaCheck/></span>
    }
    if (rawGrade >= 0.5) {
        return <span><FaCheck/><FaMinus/></span>
    }
    if (rawGrade > 0) {
        return <span><FaMinus/></span>
    }
    return <b><i>0</i></b>
}

export function applyDefaultRubric(rubricValues) {
    return computeGrade(rubric, rubricValues)
}

export function computeGrade(rubric, rubricValues) {
    let nDeductions = 0
    let nPoints = 0
    for (const rubricItem of rubric) {
        let value = rubricValues[rubricItem.id]
        if (value && value != "none") {
            nPoints += rubricItem.maxPoints
            for (const optionItem of rubricItem.options) {
                if (optionItem.value == value) {
                    nDeductions += optionItem.points
                }
            }
        }
    }

    return {
        points: nPoints - nDeductions,
        maxPoints: nPoints
    }
}
