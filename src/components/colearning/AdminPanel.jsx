import {FaClock} from "react-icons/fa"
import Countdown from "react-countdown";
import {useEffect, useState} from "react";
import {database} from "../../firebaseApp";
import {Card} from "react-bootstrap";
import {useParams} from "react-router";
import {ROOM_EXITED} from "./constants";


const QueueInfo = (props) => {
    const { queueOpen, nextOpenTimeUTC, nextCloseTimeUTC, quarterId} = props
    const [queue, setQueue] = useState(undefined)

    // Renderer callback with condition
    const renderer = ({ minutes, seconds, completed }) => {
        if (completed) {
        // Render a completed state
        // console.log('I should check the server to see if I am actually done :)')
        return <></>
        } else {
            // Render a countdown
            if (minutes < 1) {
                return  <span className="ml-5">{seconds < 10 ? `0${seconds}` : seconds} secs </span>;
            }
            return <span className="ml-5">{minutes < 10 ? `0${minutes}` : minutes} min</span>;
        }
    };

    useEffect(() => {
        // listen to queue.
        // TODO: use this
        // functions.httpsCallable('getQueue').then((data) => {
            // TODO
        // })
        database.ref(`/${quarterId}/queue`).on('value', (snap) => {
            setQueue(snap.exists() ? snap.val() : [])
        })
    }, [])

    if(queue === undefined) {
        return (<></>)
    }
    console.log('queue', queue)
    return (
        <>
        <h4>Queue status</h4>
        { queueOpen ?
            <div>
                <div className='alert alert-success mt-3 text-center'>
                    Queue is open. Closes in:
                    &nbsp;
                    <FaClock/>
                    &nbsp;
                    <Countdown date={nextCloseTimeUTC} renderer={renderer}/>
                </div>
            </div>
        :
            <div className='alert alert-primary mt-3 mb-3 text-center'>
                Queue is closed. Opens in:
                &nbsp;
                <FaClock />
                &nbsp;
                <Countdown date={nextOpenTimeUTC} renderer={renderer}/>
            </div>
        }
            <>
            <b>People in queue</b>
             {Object.keys(queue).map(k => <div key={k}> - {k} </div>)}
            </>
        </>
    )

}

const isRoomInactive = (room) => {
    return Object.values(room['status']).includes(ROOM_EXITED)
}


const displayUsers = (learnerNames) => {
    // skip photos, only put a list of names
    const listItems = learnerNames.map((user) => {
        return (
            <div key={user}>
            {user}
            </div>
        )
    })
    return (
        <>
        {listItems}
        </>
    )
}

const displayOneRoom = (room, quarterId, psetId) => {
    const roomId = room['roomId']
    const learnerNames = room['learnerIds']
    const date = new Date(room['createdOnUTC']).toLocaleString()
    const roomLink = `/peerTeach/${quarterId}/${psetId}/${roomId}`
    return (
            <tr key={roomId}>
                <td></td>
                <td>
                <a href={roomLink} target="_blank">Go to session</a>
                </td>
                <td>
                    {displayUsers(learnerNames)}
                </td>
                <td>{date}</td>

                <td></td>
            </tr>
    )
}

const RoomInfo = (props) => {
    const { quarterId } = props
    const { psetId } = useParams()
    const [rooms, setRooms] = useState(undefined)

    useEffect(() => {
        database.ref(`/${quarterId}/rooms`).on('value', (snap) => {

            const ret = Object.entries(snap.val()).map(([roomId, room]) => {
                room['roomId'] = roomId
                return room
            })

            setRooms(snap.exists() ? ret : [])
        })

    }, [])

    //TODO: some way to split out active rooms from inactive rooms to display
    let activeRooms = undefined
    let inactiveRooms = undefined
    if(rooms){

        activeRooms = rooms.filter((room) => !isRoomInactive(room))
        inactiveRooms = rooms.filter((room) => isRoomInactive(room))
    }


    const makeActiveRooms = activeRooms?.map((elem) => {
        return displayOneRoom(elem, quarterId, psetId)
    })

    const makeInactiveRooms = inactiveRooms?.map((elem) => {
        return displayOneRoom(elem, quarterId, psetId)
    })



    return (
    <>
        <h4>Room status</h4>
        <div><b>Active rooms</b></div>
        <table className="table table-hover" >
            <tbody  style={{textAlign: "left"}}>
                <tr>
                    <th></th>
                    <th>Room Link</th>
                    <th>Date</th>
                    <th>Active Users</th>
                    <th></th>
                </tr>
                { activeRooms ? makeActiveRooms : <></>}
            </tbody>
        </table>
        <hr/>
        <div><b>Inactive rooms</b></div>
        <table className="table table-hover" >
            <tbody  style={{textAlign: "left"}}>
                <tr>
                    <th></th>
                    <th>Room Link</th>
                    <th>Members</th>
                    <th>Date</th>
                    <th></th>
                </tr>
                { inactiveRooms ? makeInactiveRooms : <></>}
            </tbody>
        </table>
    </>
    )
}

export const AdminPanel = (props) => {
    return (<>
        <h2 className="mt-2 text-center"> Admin Panel </h2>
        <Card className="m-5 p-4">
            <QueueInfo {...props}/>
        </Card>
        <Card className="m-5 p-4">
            <RoomInfo {...props}/>
        </Card>
    </>)

}