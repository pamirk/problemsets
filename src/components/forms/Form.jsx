import React from "react";
import {Field, useField} from "formik";
import "./Form.css";

export const TextInput = ({label, ...props}) => {
    const [field, meta] = useField(props);
    let description = props.description ? props.description : "";
    let descriptionDiv =
        description === "" ? (
            <span/>
        ) : (
            <div className="description">{description}</div>
        );
    return (
        <div className="question-spacing">
            <label className="form-label" htmlFor={props.id || props.name}>
                {label}
            </label>
            {descriptionDiv}

            <input className="text-input" {...field} {...props} />
            {meta.touched && meta.error && <div className="error">{meta.error}</div>}
        </div>
    );
};

export const TextAreaInput = ({label, ...props}) => {
    const [field, meta] = useField(props);

    return (
        <div className="question-spacing">
            <label className="form-label" htmlFor={props.id || props.name}>
                {label}
            </label>
            <div style={{color: "gray", marginBottom: "0.6rem"}}>
                {props.description ? props.description : ""}
            </div>

            <Field
                className="text-area-input"
                as="textarea"
                rows="10"
                {...field}
                {...props}
            />
            {meta.touched && meta.error && <div className="error">{meta.error}</div>}
        </div>
    );
};
// <p>

export const DescriptionField = ({label, ...props}) => {
    let description = props.description ? props.description : "";
    let descriptionDiv =
        description === "" ? (
            <span/>
        ) : (
            <div className="description">{description}</div>
        );
    return (
        <div>
            <label className="form-label" htmlFor={props.id || props.name}>
                {label}
            </label>
            {descriptionDiv}
        </div>
    );
};

export const SelectInput = ({label, ...props}) => {
    const [field, meta] = useField({...props, type: "select"});

    return (
        <div className="question-spacing">
            <label className="form-label" htmlFor={props.id || props.name}>
                {label}
            </label>
            <div className="description">
                {props.description ? props.description : ""}
            </div>

            <Field as="select" className="select-input" {...field} {...props}>
                {props.children}
            </Field>
            {meta.touched && meta.error && <div className="error">{meta.error}</div>}
        </div>
    );
};

export const MultipleCheckbox = (props) => {
    /* eslint-disable no-unused-vars */
    const [field, meta] = useField({...props});
    /* eslint-enable no-unused-vars */
    const msg = props.description ? props.description : "Select all that apply";

    return (
        <div className="question-spacing" style={props.style}>
            <label className="form-label">{props.label}</label>
            <div className="description">{msg}</div>
            {props.children}
            {meta.touched && meta.error && <div className="error">{meta.error}</div>}
        </div>
    );
};

export const AgreeCheckbox = (props) => {
    /* eslint-disable no-unused-vars */
    const [field, meta] = useField({...props});
    /* eslint-enable no-unused-vars */
    return (
        <div className="question-spacing">
            <label className="form-label">{props.label}</label>
            <div style={{color: "gray", marginBottom: "0.6rem"}}>
                {props.description ? props.description : ""}
            </div>

            {props.children}
            {meta.touched && meta.error && <div className="error">{meta.error}</div>}
        </div>
    );
};

export const Checkbox = (props) => {
    /* eslint-disable no-unused-vars */
    const [field, meta] = useField({...props});
    /* eslint-enable no-unused-vars */
    return (
        <div className="checkbox">
            <label className="form-label">
                <Field type="checkbox" {...props} />
                {props.label}
            </label>
        </div>
    );

};


export const MultipleRadio = (props) => {
    /* eslint-disable no-unused-vars */
    const [field, meta] = useField({...props});
    /* eslint-enable no-unused-vars */
    const msg = props.description ? props.description : "Select the appropriate choice";

    return (
        <div className="question-spacing" style={props.style}>
            <label className="form-label">{props.label}</label>
            <div className="description">{msg}</div>
            {props.children}
            {meta.touched && meta.error && <div className="error">{meta.error}</div>}
        </div>
    );
};

export const Radio = (props) => {
    /* eslint-disable no-unused-vars */
    const [field, meta] = useField({...props});
    /* eslint-enable no-unused-vars */
    return (
        <div className="radio">
            <label className="form-label">
                <Field type="radio" {...props} />
                {props.label}
            </label>
        </div>
    );
}