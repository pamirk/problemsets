import React, {useEffect, useState} from 'react';
import {database} from "../../../firebaseApp.js";

const GLOBAL_EVENT_QUEUE = '%GLOBAL%'

export const EVENT_TYPES = {
    newMatch: 'NEW_MATCH',
    peerLearnNudge: 'PEER_LEARN_NUDGE',
    // newMessage: 'NEW_MESSAGE',
}

export const useEvents = (quarter, uid) => {
    const [events, setEvents] = useState([]);

    const addEvent = (newEvent) => {
        setEvents((events) => [...events, newEvent]);
    }

    const removeEvent = (newEvent) => {
        setEvents((events) => events.filter((event) => event.eventId !== newEvent.eventId));
    }

    useEffect(() => {
        const eventListenerRef = database.ref(`/${quarter}/events/${uid}`);
        const eventListenerRefGlobal = database.ref(`/${quarter}/events/${GLOBAL_EVENT_QUEUE}`);
        const eventListenerRefs = [[eventListenerRef, uid], [eventListenerRefGlobal, GLOBAL_EVENT_QUEUE]];
        for (const [ref, dest] of eventListenerRefs) {
            ref.orderByChild('timestampMS').startAt(Date.now()).on('child_added', (snap, prevChildKey) => {
                // const eventListenerRef = database.ref(`/${quarter}/queue/`)
                // eventListenerRef.on('child_added', (snap, prevChildKey) => {
                // console.log(">>>>>> Child added ", snap.val())
                const val = snap.val();
                val['eventDest'] = dest
                if (!val?.ignore) {
                    // only add events without an ignore flag
                    addEvent(val);
                }
            })
        }
    }, [])

    let eventsByType = Object.fromEntries(Object.values(EVENT_TYPES).map((eventType) => [eventType, []]));
    events.forEach((event) => {
        if (!(event.eventType in eventsByType)) {
            console.error("Unknown event type: ", event.eventType);
            console.error("Valid types: ", Object.values(EVENT_TYPES));
        } else {
            eventsByType[event.eventType].push(event)
        }
    });
    console.log("eventsByType: ", eventsByType);

    return [eventsByType, removeEvent];

}
