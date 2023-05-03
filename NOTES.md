Format of json file:

```json
[ // the object is an array of one array.
  [ // ??
    [ // paragraph?
      [ // a sentence?
        [ // a word
          "transcribed-word", // lowercase word
          "decorated-word", // with punctuation and capitalization. Can be null if originalword is okay
          "start_ms", // start of word in ms
          "end_ms", // end of word in ms
          null,
          null,
          [
            1, // Don't know. 0 or 1
            1  // Don't know. 0 or 1
          ]
        ]
      ]
    ]
  ]
]
```