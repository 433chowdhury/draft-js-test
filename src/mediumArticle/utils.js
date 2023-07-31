export const getAutocompleteRange = (trigger) => {
//   const selection = window.getSelection();
//   if (selection.rangeCount === 0) {
//     return null;
//   }

//   if (this.hasEntityAtSelection()) {
//     return null;
//   }

//   const range = selection.getRangeAt(0);
//   let text = range.startContainer.textContent;
//   text = text.substring(0, range.startOffset);
//   const index = text.lastIndexOf(trigger);
//   if (index === -1) {
//     return null;
//   }
//   text = text.substring(index);
//   return {
//     text,
//     start: index,
//     end: range.startOffset,
//   };
// };

// export const getAutocompleteState = (invalidate = true) => {
//   if (!invalidate) {
//     return this.autocompleteState;
//   }

//   var type = null;
//   var trigger = null;
//   const tagRange = this.getAutocompleteRange(triggers.TAG_TRIGGER);
//   const personRange = this.getAutocompleteRange(triggers.PERSON_TRIGGER);
//   if (!tagRange && !personRange) {
//     this.autocompleteState = null;
//     return null;
//   }
//   var range = null;
//   if (!tagRange) {
//     range = personRange;
//     type = triggers.PERSON;
//     trigger = triggers.PERSON_TRIGGER;
//   }

//   if (!personRange) {
//     range = tagRange;
//     type = triggers.TAG;
//     trigger = triggers.TAG_TRIGGER;
//   }

//   if (!range) {
//     range = tagRange.start > personRange.start ? tagRange : personRange;
//     type = tagRange.start > personRange.start ? triggers.TAG : triggers.PERSON;
//     trigger =
//       tagRange.start > personRange.start
//         ? triggers.TAG_TRIGGER
//         : triggers.PERSON_TRIGGER;
//   }

//   const tempRange = window.getSelection().getRangeAt(0).cloneRange();
//   tempRange.setStart(tempRange.startContainer, range.start);

//   const rangeRect = tempRange.getBoundingClientRect();
//   let [left, top] = [rangeRect.left, rangeRect.bottom];

//   return {
//     trigger,
//     type,
//     left,
//     top,
//     text: range.text,
//     selectedIndex: 0,
//   };
return null;
};
