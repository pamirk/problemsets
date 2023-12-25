import React, {useEffect, useState} from "react";
import {database} from "../../../firebaseApp.js";
import {useParams} from "react-router";


const NUM_ONLINE_TIME_DELAY = 30000;

export const useNumOnline = () => {
    let [numPeopleOnline, setNumPeopleOnline] = useState(undefined)
    const {qtrId} = useParams();
    // TODO: this debounce isn't working
    // const [debounceNumOnline] = useDebouncedCallback((value) => {
    //     console.log("This value is debounced", value);
    //     setNumPeopleOnline(value);
    // }, NUM_ONLINE_TIME_DELAY, { leading: true, trailing: false })

    useEffect(() => {
        const ref = database.ref(`/${qtrId}/status`);
        ref.orderByChild("state").equalTo("online").on("value", function (snap) {
            //setNumPeopleOnline(snap.numChildren())
            // debounceNumOnline(snap.numChildren())
            setNumPeopleOnline(snap.numChildren())
        });
    }, []);

    return [numPeopleOnline]
}
