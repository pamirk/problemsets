import React from 'react';
import {Redirect} from 'react-router'
import {useParams} from "react-router-dom";

export const PSetHome = (props) => {

    // get the first question in the pset and redirect to it

    let {qtrId, psetId} = useParams();

    return <Redirect
        to={`/${qtrId}/${psetId}/splash`}
    />
}