/* ----------*
* Constants
------------*/

import { CompositeDecorator, Editor, EditorState, Modifier } from "draft-js";
import { useMemo, useRef, useState } from "react";

const INSERT_ACTION_LABEL = `insert-suggestion`;
const PREFIX = "#";

export const SUGGESTIONS = [
  "Jaervinen",
  "Nieminen",
  "Lamminpaeae",
  "Kallio",
  "Jokinen",
  "Niittukari",
  "Li",
];

/* ----------*
* Utils
------------*/

function getSelectionRange() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return null;
  return selection.getRangeAt(0);
}

function getTriggerRange(term) {
  const range = getSelectionRange();
  const text = range?.startContainer.textContent.substring(
    0,
    range.startOffset
  );
  if (!text || /\s+$/.test(text)) return null;

  const start = text.lastIndexOf(term);
  if (start === -1) return null;

  const end = range.startOffset;
  return {
    end,
    start,
    text: text.substring(start),
  };
}

function getInsertRange(activeSuggestion, editorState) {
  const selection = editorState.getSelection();
  const content = editorState.getCurrentContent();
  const anchorKey = selection.getAnchorKey();
  const end = selection.getAnchorOffset();
  const block = content.getBlockForKey(anchorKey);
  const text = block.getText();
  const start = text.substring(0, end).lastIndexOf(PREFIX);

  return {
    start,
    end,
  };
}

const CaretCoordinates = {
  x: 0,
  y: 0,
};

function getCaretCoordinates() {
  const range = getSelectionRange();
  if (range) {
    const { left: x, top: y } = range.getBoundingClientRect();
    Object.assign(CaretCoordinates, { x, y });
  }
  return CaretCoordinates;
}

/* ----------*
* Modifiers
------------*/

const addSuggestion = (editorState, activeSuggestion, content) => {
  const { start, end } = getInsertRange(activeSuggestion, editorState);
  const contentState = editorState.getCurrentContent();
  const currentSelection = editorState.getSelection();
  const selection = currentSelection.merge({
    anchorOffset: start,
    focusOffset: end,
  });

  const contentStateWithEntity = contentState.createEntity(
    "SUGGESTION",
    "IMMUTABLE",
    { content }
  );
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const newContentState = Modifier.replaceText(
    contentStateWithEntity,
    selection,
    `${PREFIX}${content}`,
    null,
    entityKey
  );

  const newEditorState = EditorState.push(
    editorState,
    newContentState,
    INSERT_ACTION_LABEL
  );

  return EditorState.forceSelection(
    newEditorState,
    newContentState.getSelectionAfter()
  );
};

/* ----------*
* Decorators
------------*/

const Suggestion = ({ children }) => {
  return (
    <span style={{ color: "white", backgroundColor: "#6078f0" }}>
      {children}
    </span>
  );
};

const findSuggestionEntities = (contentBlock, callback, contentState) => {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (
      entityKey !== null &&
      contentState.getEntity(entityKey).getType() === "SUGGESTION"
    );
  }, callback);
};

const Suggestions = (props) => {
  const position = () => {
    const co = props.position;
    if (!co) return {};
    return {
      top: co.y,
      left: co.x,
    };
  };

  console.log(props);
  console.log({ text: props.searchText, type: typeof props.searchText });
  if (typeof props.searchText !== "string") return null;

  const term = props.searchText.toLowerCase();
  const filter = (item) => item.toLowerCase().includes(term);

  let results = SUGGESTIONS.filter(filter);
  console.log({ results });

  return (
    results &&
    !(results.length === 1 && results[0].length === term.length) && (
      <nav style={position()}>
        <ol>
          {results.map((result, index) => {
            const select = () => props.onSelect(result);
            return (
              <li key={index} onClick={select}>
                {result}
              </li>
            );
          })}
        </ol>
      </nav>
    )
  );
};

export default function EditorView() {
  const editorRef = useRef();

  const [editorState, setEditorState] = useState(() => {
    const decorator = new CompositeDecorator([
      {
        strategy: findSuggestionEntities,
        component: Suggestion,
      },
    ]);
    return EditorState.createEmpty(decorator);
  });

  const [activeSuggestion, setActiveSuggestions] = useState(null);

  const updateSuggestionsState = () => {
    const triggerRange = getTriggerRange(PREFIX);
    // console.log({ triggerRange });
    const activeSuggestion = !triggerRange
      ? null
      : {
          position: getCaretCoordinates(),
          searchText: triggerRange.text.slice(1, triggerRange.text.length),
          selectedIndex: 0,
        };
    setActiveSuggestions({ activeSuggestion });
  };

  const onChange = (editorState) => {
    setEditorState(editorState);
    updateSuggestionsState();
  };

  const handleSuggestionSelected = (text) => {
    onChange(addSuggestion(editorState, activeSuggestion, text));
    setActiveSuggestions(null);
    editorRef?.current?.focus();
  };

  return (
    <div
      style={{
        position: "fixed",
        width: 500,
        backgroundColor: "#ededed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
    >
      <Editor ref={editorRef} editorState={editorState} onChange={onChange} />

      <Suggestions {...activeSuggestion} onSelect={handleSuggestionSelected} />
    </div>
  );
}
