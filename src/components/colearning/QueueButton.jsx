import {Button} from "react-bootstrap";


export const QueueButton = (props) => {
    const { queueOpen, nextOpenTimeUTC, nextCloseTimeUTC, joined, addToQueue, removeFromQueue} = props
    // console.log("queue button", queueOpen, nextOpenTimeUTC, nextCloseTimeUTC, joined)

    const displayOpenTime = new Date(nextOpenTimeUTC).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})
    const dipslayCloseTime = new Date(nextCloseTimeUTC).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})

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

    if(queueOpen) {
        if(!joined) {
            // console.log(nextCloseTimeUTC, new Date(Date.now()).toUTCString())
            return (
                <>
                    <div className='alert alert-primary mt-3'>
                        To find you the best person to work with, we open the peer-learn queue for 5 minutes every 15 minutes. The queue is currenlty <b>open</b>.
                        This round of signups close at {dipslayCloseTime}.

                    <div className='mb-3 mt-3'>
                    {/* <FaClock/>
                    <Countdown date={nextCloseTimeUTC} renderer={renderer}/> */}
                    <Button onClick={addToQueue}>Find me a match</Button>
                    </div>
                    </div>
                </>
            )
        } else {
            return (
                <>
                <div className='alert alert-primary mt-3'>
                <p>
                    We are searching for a match. Your collaborative work session will start at {dipslayCloseTime}.
                </p>
                <p>
                <b>Reminder to uphold the <a href="http://web.stanford.edu/class/cs109/handouts/honorCode.html" target="_blank">Stanford Honor Code</a> when working with your peers.</b>
                </p>
                <Button variant="warning" onClick={removeFromQueue}>Cancel match</Button>
                </div>
                {/* <div className='mb-3 mt-3'>
                <FaClock/>
                <Countdown date={nextCloseTimeUTC} renderer={renderer}/>
                </div> */}
                {/* <Karel/> */}
                </>
            )

        }
    } else {
        // console.log("The time is...", nextOpenTimeUTC)
        return (
            <>
            <div className='alert alert-primary mt-3'>
            The queue is currently <b>closed</b>. The next peer-learning signups open at {displayOpenTime}.
            </div>
            {/* <FaClock/>
            <Countdown date={nextOpenTimeUTC} renderer={renderer}/> */}
            {/* <Button className="btn-secondary" disabled>Find me a match</Button> */}
            </>
        )
    }


}