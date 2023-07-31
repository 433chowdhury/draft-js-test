import { CompositeDecorator, Editor, EditorState, Modifier } from "draft-js";
import "draft-js/dist/Draft.css";
import React, { useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "./Mention";
import { useCallback } from "react";
import { getTriggerRange } from "./utils";

const HASHTAG_REGEX = /#[\w\u0590-\u05ff]+/g;

const HashtagSpan = (props) => {
  return (
    <span
      data-offset-key={props.offsetKey}
      style={{ margin: "0 0px", background: "yellow", borderRadius: "4px" }}
    >
      {props.children}
    </span>
  );
};

const compositeDecorator = new CompositeDecorator([
  {
    strategy: (block, callback, contentState) => {
      block.findEntityRanges((value) => {
        const entityKey = value.getEntity();
        return (
          entityKey && contentState.getEntity(entityKey).getType() === "HASHTAG"
        );
      }, callback);
    },
    component: HashtagSpan,
  },
]);

function App() {
  const editorRef = useRef();

  const [availableSuggestions, setAvailableSuggestions] = useState([]);

  const [editorState, setEditorState] = useState(() => {
    return EditorState.createEmpty(compositeDecorator);
  });

  const [suggestionReplaceRange, setSuggestionReplaceRange] =
    useState(undefined);

  const [suggestionPosition, setSuggestionPositioni] = useState();

  const suggestionProcessing = useCallback(() => {
    const trigger = getTriggerRange("#");
    // console.log({ trigger });
    if (trigger) {
      setSuggestionReplaceRange({
        start: trigger.start,
        end: trigger.end,
        text: trigger.text,
      });
      setSuggestionPositioni(trigger.position);
      if (trigger.text.length > 1) {
        setAvailableSuggestions(
          SUGGESTIONS.filter((item) =>
            item.toLowerCase().includes(trigger.text.slice(1).toLowerCase())
          )
        );
      } else setAvailableSuggestions(SUGGESTIONS);
    } else {
      setAvailableSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      if (document.activeElement === editorRef.current?.editor) {
        suggestionProcessing();
      }
    };
    document.addEventListener("keyup", handler);
    return () => {
      document.removeEventListener("keyup", handler);
    };
  }, []);

  const handleSuggestionAdd = useCallback(
    (suggestionText) => {
      const content = editorState.getCurrentContent();

      const selection = editorState.getSelection();

      const anchorOffset =
        selection.getFocusOffset() - suggestionReplaceRange.text.length;
      const focusOffset = selection.getFocusOffset();

      const newText = `#${suggestionText}`;

      const updatedSelectionState = selection.merge({
        anchorOffset,
        focusOffset,
      });

      const contentStateWithEntity = content.createEntity(
        "HASHTAG",
        "IMMUTABLE",
        undefined
      );

      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

      const newContentState = Modifier.replaceText(
        contentStateWithEntity,
        updatedSelectionState,
        newText,
        undefined,
        entityKey
      );

      const newEditorState = EditorState.push(
        editorState,
        newContentState,
        "apply-entity"
      );

      const editorStateWithForcedFocus =
        EditorState.moveFocusToEnd(newEditorState);

      // setting suggestion to empty
      window.requestAnimationFrame(() => {
        setEditorState(editorStateWithForcedFocus);
        setSuggestionReplaceRange(undefined);
        setAvailableSuggestions([]);
      });
    },
    [editorState, suggestionReplaceRange]
  );

  const processNewEditorState = useCallback((newState) => {
    setEditorState(newState);
    // suggestionProcessing();
  }, []);

  return (
    <div style={{ height: 500, width: 800, backgroundColor: "#ededed" }}>
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={processNewEditorState}
      />
      {!!availableSuggestions.length && (
        <ul
          style={{
            position: "fixed",
            left: suggestionPosition?.left,
            top: suggestionPosition?.top + 7,
            zIndex: 1200,
            padding: "10px 13px",
            borderRadius: "10px",
            background: "white",
            boxShadow: "0 0 12px 3px #acacac",
            listStyle: "none",
          }}
        >
          {availableSuggestions.map((item) => (
            <li
              key={item}
              onClick={() => {
                handleSuggestionAdd(item);
              }}
              style={{
                // padding: "3px 5px",
                marginBottom: 4,
                cursor: "pointer",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
