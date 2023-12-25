import {FaPencilAlt} from "react-icons/fa"
import {Karel} from "./KarelMoving.jsx"

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

const displayOneHistory = (history, quarterId, psetId) => {
    // console.log("HISTORY", history)
    const roomId = history['roomId']
    const learnerNames = history['learnerNames']
    const date = new Date(history['createdOnUTC']).toLocaleString()

    const roomLink = `/peerTeach/${quarterId}/${psetId}/${roomId}`
    return (
        <tr key={roomId}>
            <td></td>
            <td>
                {displayUsers(learnerNames)}
            </td>
            <td>{date}</td>
            <td>
                <div><FaPencilAlt/>  <a target="_blank" href={roomLink}>View session work</a></div>
            </td>
            <td></td>
        </tr>
    )

}

export const Histories = (props) => {
    const { histories, activeRoom, quarterId, psetId } = props;
    // console.log("HISTORIES 94", histories, props)
    const displayHistories = histories.map((elem) => {
        if(elem) {
            if(elem['roomId'] !== activeRoom) {
                return displayOneHistory(elem, quarterId, psetId)
            }
        }
    })

    return (
        <div className="card">
            {/* <div className="splashCardMainTitle">Past Connections</div> */}
            <h5 className="m-3"> Past Connections</h5>
            <table className="table table-hover" >
                <tbody  style={{textAlign: "left"}}>
                <tr>
                    <th></th>
                    <th>Collaborators</th>
                    <th>Date</th>
                    <th>Links</th>
                    <th></th>
                </tr>
                {displayHistories.length === 0 ?
                    <>
                    <tr><td colSpan="5"><div style={{display: "flex", justifyContent: "center"}}>Your past connections will show up here. Enjoy Karel dancing in the meantime :)</div></td></tr>
                    <tr><td colSpan="5"><Karel/></td></tr>
                    </> :
                displayHistories}
                </tbody>
            </table>
        </div>
    )
}

