import { CompositeDecorator, Editor, EditorState } from "draft-js";
import "draft-js/dist/Draft.css";
import React, { useState } from "react";
import { SUGGESTIONS } from "./Mention";

const HASHTAG_REGEX = /#[\w\u0590-\u05ff]*/g;

const HashtagSpan = (props) => {
  return (
    <span
      data-offset-key={props.offsetKey}
      style={{ margin: "0 5px", background: "yellow", borderRadius: "4px" }}
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
      console.log({ matchArr });
      const machedText = matchArr[0];
      start = matchArr.index;
      callback(start, start + matchArr[0].length);
      if (machedText.length === 1) setAvailableSuggestions(SUGGESTIONS);
      else {
        setAvailableSuggestions(
          SUGGESTIONS.filter((item) =>
            item
              .toLowerCase()
              .includes(machedText.slice(1, machedText.length).toLowerCase())
          )
        );
      }
    }
  }

  function hashtagStrategy(contentBlock, callback, contentState) {
    findWithRegex(HASHTAG_REGEX, contentBlock, callback);
  }

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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ height: 500, width: 800, backgroundColor: "#ededed" }}>
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          spellCheck={true}
        />
        <ul>
          {availableSuggestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
