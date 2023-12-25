import React from 'react';
import {Redirect} from 'react-router'
import {useParams} from "react-router-dom";

export const GradingHome = (props) => {

    // get the first question in the pset and redirect to it

    let { qtrId, psetId } = useParams();

    return <Redirect
        to={`/grading/${qtrId}/${psetId}/splash`}
    />
  }