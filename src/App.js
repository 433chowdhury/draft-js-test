import {
  CompositeDecorator,
  Editor,
  EditorState,
  Modifier,
  convertFromRaw,
  convertToRaw,
} from "draft-js";
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
      // block.findEntityRanges((value) => {
      //   const entityKey = value.getEntity();
      //   return (
      //     entityKey && contentState.getEntity(entityKey).getType() === "HASHTAG"
      //   );
      // }, callback);

      // with regex
      const text = block.getText();
      let matchArr, start;
      while ((matchArr = HASHTAG_REGEX.exec(text)) !== null) {
        start = matchArr.index;
        callback(start, start + matchArr[0].length);
      }
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

      const newEditorState = EditorState.moveFocusToEnd(
        EditorState.push(editorState, newContentState, "apply-entity")
      );

      // put a space after entity enter
      const spaceEnterContent = newEditorState.getCurrentContent();

      const spaceEnterNewContent = Modifier.insertText(
        spaceEnterContent,
        newEditorState.getSelection(),
        " "
      );

      const editorStateAfterSpace = EditorState.push(
        newEditorState,
        spaceEnterNewContent,
        "insert-characters"
      );

      const editorStateWithForcedFocus = EditorState.moveFocusToEnd(
        editorStateAfterSpace
      );

      setEditorState(editorStateWithForcedFocus);

      // setting suggestion to empty
      window.requestAnimationFrame(() => {
        setSuggestionReplaceRange(undefined);
        setAvailableSuggestions([]);
      });
    },
    [editorState, suggestionReplaceRange]
  );

  const replaceString = useCallback(
    (chars, newEditorState) => {
      if (chars !== " ") return "not-handled";

      const contentState = newEditorState.getCurrentContent();
      const selectionState = newEditorState.getSelection();
      const anchorKey = selectionState.getAnchorKey();
      const block = contentState.getBlockForKey(anchorKey);
      const text = block.getText();

      const previousCharIndex = selectionState.getEndOffset() - 1;

      if (text.charAt(previousCharIndex) === " ") return "not-handled";

      const arr = text.split(" ");

      const lastSegment = arr[arr.length - 1];

      const index = lastSegment.indexOf("#");

      // Detect a match. Can be substituted with a RegEx test condition.
      if (index !== -1) {
        // if (lastIndex < previousCharIndex) return "not-handled";
        const hashtagEntityKey = block.getEntityAt(
          selectionState.getEndOffset() - 1
        );

        console.log({ hashtagEntityKey });

        if (hashtagEntityKey) return "not-handled";

        const currentSelectionState = editorState.getSelection();

        const textLength =
          currentSelectionState.getEndOffset() - lastSegment.length;

        const newSelectionState = selectionState.merge({
          // The starting position of the range to be replaced.
          anchorOffset: currentSelectionState.getEndOffset() - textLength,
          // The end position of the range to be replaced.
          focusOffset: currentSelectionState.getEndOffset(),
        });

        const newText = `${lastSegment}`;

        const contentStateWithEntity = contentState.createEntity(
          "HASHTAG",
          "IMMUTABLE",
          undefined
        );

        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();

        const newContentState = Modifier.replaceText(
          contentState,
          // The text to replace, which is represented as a range with a start & end offset.
          newSelectionState,
          // The new string to replace the old string.
          newText,
          undefined,
          entityKey
        );

        const newEditorState = EditorState.moveFocusToEnd(
          EditorState.push(editorState, newContentState, "apply-entity")
        );

        // put a space after entity enter
        const spaceEnterContent = newEditorState.getCurrentContent();

        const spaceEnterNewContent = Modifier.insertText(
          spaceEnterContent,
          newEditorState.getSelection(),
          " "
        );

        const editorStateAfterSpace = EditorState.push(
          newEditorState,
          spaceEnterNewContent,
          "insert-characters"
        );

        const editorStateWithForcedFocus = EditorState.moveFocusToEnd(
          editorStateAfterSpace
        );

        setEditorState(editorStateWithForcedFocus);

        return "handled";
      }
      return "not-handled";
    },
    [editorState]
  );

  const processNewEditorState = useCallback((newState) => {
    const content = newState.getCurrentContent();

    console.log({ content: convertToRaw(content) });

    setEditorState(newState);
  }, []);

  return (
    <div style={{ height: 500, width: 800, backgroundColor: "#ededed" }}>
      <Editor
        ref={editorRef}
        editorState={editorState}
        onChange={processNewEditorState}
        // handleBeforeInput={replaceString}
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
