import {Form, Formik} from "formik";
import {MultipleRadio, Radio, TextInput} from '../forms/Form.jsx';
import {Button, Modal} from "react-bootstrap";
import * as Yup from "yup";
import {firestore} from "../../firebaseApp";

export const FeedbackSurvey = (props) => {
    const {activeRoom, quarterId} = props
    // console.log('Feedback props', props)

    const validationSchema = Yup.object().shape({
        rating: Yup.number().typeError('Required').required('Required'),
        comments: Yup.string().nullable(true),
        interactionDescription: Yup.string().nullable(true)
    });

    const initialValues = {
        rating: null,
        comments: "",
        interactionDescription: ""
    };

    const onSubmit = async (values) => {
        console.log(values);
        await firestore
            .collection("matching")
            .doc(quarterId)
            .collection("rooms")
            .doc(activeRoom)
            .collection("feedback")
            .doc(props.userId)
            .set({
                callRating: values['rating'],
                comments: values['comments'],
                interactionDescription: values['interactionDescription']
            }, {merge: true})
        await props.onSubmit()
    }

    return (
        <Modal
            show={props.show}
        >
            <Modal.Header>
                <Modal.Title>Feedback on Peer Learning</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={(values) => onSubmit(values)}
                >
                    <Form style={{width: "100%"}}>
                        Please tell us about your peer learning experience!

                        <MultipleRadio name="rating" label=""
                                       description="How would you rate this peer learning session on a scale from 1 (not great :/) to 5 (incredible!)?">
                            <div style={{display: "flex", justifyContent: "space-evenly"}}>
                                <Radio name="rating" value="1" label="1"/>
                                <Radio name="rating" value="2" label="2"/>
                                <Radio name="rating" value="3" label="3"/>
                                <Radio name="rating" value="4" label="4"/>
                                <Radio name="rating" value="5" label="5"/>
                            </div>
                        </MultipleRadio>

                        <TextInput
                            name="comments"
                            placeholder=""
                            label="Tell us about your experience"
                        />

                        <TextInput
                            name="interactionDescription"
                            placeholder=""
                            label="If you felt uncomfortable at any point in this call, please describe the interaction here."
                        />
                        {/* </div> */}

                        <Button variant="primary" type="submit" className="mt-4">
                            Submit
                        </Button>
                    </Form>
                </Formik>
            </Modal.Body>
        </Modal>
    )
}