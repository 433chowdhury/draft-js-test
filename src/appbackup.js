import {
    CompositeDecorator,
    Editor,
    EditorState,
    Modifier,
    RichUtils,
    convertToRaw,
  } from "draft-js";
  import "draft-js/dist/Draft.css";
  import React, { useState } from "react";
  import { SUGGESTIONS } from "./Mention";
  import { useCallback } from "react";
  
  const HASHTAG_REGEX = /#[\w\u0590-\u05ff]+/g;
  const HASHTAG_REGEX_CLOSE = /#[\w\u0590-\u05ff]*\s*/g;
  const HASHTAG_REGEX_REPLACE = /#\w+\s[^\n]/g;
  
  const HashtagSpan = (props) => {
    return (
      <span
        data-offset-key={props.offsetKey}
        style={{ margin: "0 4px", background: "yellow", borderRadius: "4px" }}
      >
        {props.children}
      </span>
    );
  };
  
  function App() {
    const [availableSuggestions, setAvailableSuggestions] = useState([]);
  
    function findWithRegex(regex, contentBlock, callback) {
      const text = contentBlock.getText();
      let matchArr, start;
      while ((matchArr = regex.exec(text)) !== null) {
        start = matchArr.index;
        callback(start, start + matchArr[0].length);
      }
    }
  
    function hashtagStrategy(contentBlock, callback, contentState) {
      // const selectionState = editorState.getSelection();
      // const windowSelection = window
      //   .getSelection()
      //   .getRangeAt(0)
      //   .cloneRange()
      //   .getBoundingClientRect();
      // console.log({ selectionState, windowSelection });
      // findWithRegex(HASHTAG_REGEX, contentBlock, callback);
      contentBlock.findEntityRanges((character) => {
        const entityKey = character.getEntity();
        return (
          entityKey !== null &&
          contentState.getEntity(entityKey).getType() === "HASHTAG"
        );
      }, callback);
    }
  
    const processNewEditorState = (newEditorState) => {
      const contentState = newEditorState.getCurrentContent();
      const text = contentState.getPlainText();
      let matchArr;
      const regexClose = HASHTAG_REGEX_CLOSE;
  
      while ((matchArr = regexClose.exec(text)) !== null) {
        const machedText = matchArr[0];
        setAvailableSuggestions(
          SUGGESTIONS.filter((item) =>
            item
              .toLowerCase()
              .includes(machedText.slice(1, machedText.length).toLowerCase())
          )
        );
      }
  
      const regexReplace = HASHTAG_REGEX_REPLACE;
  
      while ((matchArr = regexReplace.exec(text)) !== null) {
        const start = matchArr.index;
  
        const selection = newEditorState.getSelection().merge({
          anchorOffset: start,
          focusOffset: start + matchArr[0].length,
        });
  
        const anchorKey = selection.getAnchorKey();
  
        const block = contentState.getBlockForKey(anchorKey);
  
        const hashtagEntityKey = block.getEntityAt(selection.getStartOffset());
        console.log({ hashtagEntityKey });
  
        if (!hashtagEntityKey) {
          const contentStateWithEntity = contentState.createEntity(
            "HASHTAG",
            "IMMUTABLE",
            { text: `${matchArr[0]} ` }
          );
          const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
          let newContentState = Modifier.replaceText(
            contentStateWithEntity,
            selection,
            `${matchArr[0]}`,
            null,
            entityKey
          );
  
          const editorStateAfterReplace = EditorState.push(
            newEditorState,
            newContentState,
            "hashtag-replace"
          );
  
          newEditorState = EditorState.moveFocusToEnd(
            editorStateAfterReplace
            // newContentState.getSelectionAfter()
          );
        }
      }
  
      setEditorState(newEditorState);
    };
  
    const compositeDecorator = new CompositeDecorator([
      {
        strategy: hashtagStrategy,
        component: HashtagSpan,
      },
    ]);
    // creating editor state with composite decotor
    const [editorState, setEditorState] = React.useState(() => {
      return EditorState.createEmpty(compositeDecorator);
    });
  
    const handleSuggestionAdd = useCallback(
      (suggestion) => {
        const contentState = editorState.getCurrentContent();
      },
      [editorState]
    );
  
    return (
      <div style={{ height: 500, width: 800, backgroundColor: "#ededed" }}>
        <Editor editorState={editorState} onChange={processNewEditorState} />
        <ul>
          {availableSuggestions.map((item) => (
            <li
              key={item}
              onClick={() => {
                handleSuggestionAdd(item);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  function getInsertRange(searchText, editorState) {
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const anchorKey = selection.getAnchorKey();
    const end = selection.getAnchorOffset();
    const block = content.getBlockForKey(anchorKey);
    const text = block.getText();
    const start = text.substring(0, end).lastIndexOf(`#${searchText}`);
  
    return {
      start,
      end,
    };
  }
  
  export default App;
  