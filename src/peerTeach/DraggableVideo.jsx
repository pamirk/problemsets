import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash} from 'react-icons/fa';


// standard zoom aspect ratio is 16:9
const DRAGGABLE_WIDTH = 300;
const DRAGGABLE_HEIGHT = 200;

// / throttle.ts
export const throttle = (f) => {
    let token = null;
    let lastArgs = null;
    const invoke = () => {
        f(...lastArgs);
        token = null;
    };
    const result = (...args) => {
        lastArgs = args;
        if (!token) {
            token = requestAnimationFrame(invoke);
        }
    };
    result.cancel = () => token && cancelAnimationFrame(token);
    return result;
};

// / use-draggable.ts
const id = (x) => x;

// complex logic should be a hook, not a component
const useDraggable = ({onDrag = id} = {}) => {
    // this state doesn't change often, so it's fine
    const [pressed, setPressed] = useState(false);

    // do not store position in useState! even if you useEffect on
    // it and update `transform` CSS property, React still rerenders
    // on every state change, and it LAGS
    const position = useRef({x: '-350px', y: 0});
    const dragAnchor = useRef({x: 0, y: 0});
    const ref = useRef();
    const parentRef = useRef();

    // we've moved the code into the hook, and it would be weird to
    // return `ref` and `handleMouseDown` to be set on the same element
    // why not just do the job on our own here and use a function-ref
    // to subscribe to `mousedown` too? it would go like this:
    const unsubscribe = useRef();
    const legacyRef = useCallback((elem) => {
        // in a production version of this code I'd use a
        // `useComposeRef` hook to compose function-ref and object-ref
        // into one ref, and then would return it. combining
        // hooks in this way by hand is error-prone

        // then I'd also split out the rest of this function into a
        // separate hook to be called like this:
        // const legacyRef = useDomEvent('mousedown');
        // const combinedRef = useCombinedRef(ref, legacyRef);
        // return [combinedRef, pressed];
        ref.current = elem;
        if (unsubscribe.current) {
            unsubscribe.current();
        }
        if (!elem) {
            return;
        }
        const handleMouseDown = (e) => {
            // don't forget to disable text selection during drag and drop
            // operations
            e.target.style.userSelect = 'none';
            setPressed(true);
            dragAnchor.current = {
                x: e.offsetX,
                y: e.offsetY,
            };
        };
        elem.addEventListener('mousedown', handleMouseDown);
        unsubscribe.current = () => {
            elem.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    useEffect(() => {
        // why subscribe in a `useEffect`? because we want to subscribe
        // to mousemove only when pressed, otherwise it will lag even
        // when you're not dragging
        if (!pressed) {
            return;
        }

        // updating the page without any throttling is a bad idea
        // requestAnimationFrame-based throttle would probably be fine,
        // but be aware that naive implementation might make element
        // lag 1 frame behind cursor, and it will appear to be lagging
        // even at 60 FPS
        const handleMouseMove = throttle((event) => {
            // needed for TypeScript anyway
            if (!ref.current || !position.current) {
                return;
            }
            const pos = position.current;
            // it's important to save it into variable here,
            // otherwise we might capture reference to an element
            // that was long gone. not really sure what's correct
            // behavior for a case when you've been scrolling, and
            // the target element was replaced. probably some formulae
            // needed to handle that case. TODO
            const elem = ref.current;
            position.current = onDrag({
                x: event.clientX - dragAnchor.current.x,
                y: event.clientY - dragAnchor.current.y,
            });
            // remove the fix to right and bottom
            elem.style.right = null;
            elem.style.bottom = null;
            elem.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
        });
        const handleMouseUp = (e) => {
            e.target.style.userSelect = 'auto';
            setPressed(false);
        };
        // subscribe to mousemove and mouseup on document, otherwise you
        // can escape bounds of element while dragging and get stuck
        // dragging it forever
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            handleMouseMove.cancel();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        // if `onDrag` wasn't defined with `useCallback`, we'd have to
        // resubscribe to 2 DOM events here, not to say it would mess
        // with `throttle` and reset its internal timer
    }, [pressed, onDrag]);

    // actually it makes sense to return an array only when
    // you expect that on the caller side all of the fields
    // will be usually renamed
    return [legacyRef, ref, position, pressed];

    // > seems the best of them all to me
    // this code doesn't look pretty anymore, huh?
};

// / example.ts
const backgroundStyle = {
    width: DRAGGABLE_WIDTH + 'px',
    height: DRAGGABLE_HEIGHT + 'px',
    background: 'purple',
    color: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    position: 'absolute',
    cursor: 'grab',
    left: '0px',
    top: '0px',
    zIndex: 100,
};

const overlayButtonsStyle = {
    position: 'absolute',
    bottom: '0px'
}


export const DraggableComponent = forwardRef(({component, overlayButtons, jitsiRef}, ref) => {
    const [draggable, setDraggable] = useState(true)

    // handlers must be wrapped into `useCallback`. even though
    // resubscribing to `mousedown` on every tick is quite cheap
    // due to React's event system, `handleMouseDown` might be used
    // in `deps` argument of another hook, where it would really matter.
    // as you never know where return values of your hook might end up,
    // it's just generally a good idea to ALWAYS use `useCallback`

    // it's nice to have a way to at least prevent element from
    // getting dragged out of the page
    const handleDrag = useCallback(
        ({x, y}) => {
            let xValue = Math.min(Math.max(0, x), window.innerWidth - DRAGGABLE_WIDTH)
            let yValue = Math.min(Math.max(0, y), window.innerHeight - DRAGGABLE_HEIGHT)
            return {x: xValue, y: yValue}
        },
        [],
    );

    const [handleRef, backgroundRef, position, pressed] = useDraggable({
        onDrag: handleDrag,
    });


    useImperativeHandle(ref, () => ({
        setIsDraggable(newDraggable, newSize) {
            setDraggable(newDraggable)
            if (backgroundRef.current) {
                let style = backgroundRef.current.style
                if (newDraggable) {
                    const lastPos = position.current
                    style.transform = `translate(${lastPos.x}px, ${lastPos.y}px)`;
                } else {
                    style.transform = `translate(0px, 0px)`;
                }
                style.width = newSize.width;
                style.height = newSize.height;
            }
        },
    }))


    return (
        <>
            <div ref={handleRef} style={backgroundStyle}>
                {component}
                {draggable && <InvisibleCover/>}
                {draggable && <OverlayButtons draggable={draggable} jitsiRef={jitsiRef}/>}
            </div>

        </>
    );
});

const OverlayButtons = ({draggable, jitsiRef}) => {

    const [videoMuted, setVideoMuted] = useState(false)
    const [audioMuted, setAudioMuted] = useState(false)

    const toggleAudio = (e) => {
        setAudioMuted(!audioMuted)
        jitsiRef.current.executeCommand('toggleAudio');
        e.stopPropagation()
    }

    const toggleVideo = (e) => {
        setVideoMuted(!videoMuted)
        jitsiRef.current.executeCommand('toggleVideo');
        e.stopPropagation()
    }

    useEffect(() => {
        console.log('draggable changed', jitsiRef)
        if (jitsiRef && jitsiRef.current) {
            jitsiRef.current.isVideoMuted().then(muted => {
                setVideoMuted(muted)
            })
            jitsiRef.current.isAudioMuted().then(muted => {
                setAudioMuted(muted)
            })
        }
    }, [draggable])

    const videoIcon = videoMuted ? <FaVideoSlash/> : <FaVideo/>
    const audioIcon = audioMuted ? <FaMicrophoneSlash/> : <FaMicrophone/>
    return <div style={overlayButtonsStyle}>
        <div className="d-flex">

            <button className="btn btn-dark rounded-pill" onClick={(e) => toggleAudio(e)}>{audioIcon}</button>
            <button className="btn btn-dark rounded-pill" onClick={(e) => toggleVideo(e)}>{videoIcon}</button>

        </div>
    </div>
}

const InvisibleCover = () => {
    return <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
    }}
    ></div>
}
